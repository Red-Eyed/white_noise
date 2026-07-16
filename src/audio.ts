import * as Tone from "tone";
import { synthesizeColoredNoise } from "./noise";
import type { GeneratorParams } from "./params";

// Loop length as a power of two so the FFT-based synthesis stays radix-2.
// 2^19 ≈ 11.9 s at 44.1 kHz — long enough that the loop is inaudible.
const BUFFER_SAMPLES = 2 ** 19;
const RAMP_SECONDS = 0.02;
const FADE_OUT_DURATION_SECONDS = 10;
const TILT_LOW_HZ = 400;
const TILT_HIGH_HZ = 1600;

// A native node the visualizer taps, plus the context it lives in.
export interface AnalyserSource {
  context: AudioContext;
  node: AudioNode;
}

// The persistent Tone.js effect graph. Two colored-noise layers cross-fade into a
// serial chain of library nodes; only the one-shot buffer sources are rebuilt.
interface Graph {
  crossfade: Tone.CrossFade;
  lowCut: Tone.Filter;
  highCut: Tone.Filter;
  tilt: Tone.EQ3;
  tremolo: Tone.Tremolo;
  master: Tone.Gain;
  analyserBridge: GainNode;
}

// Stateful audio shell. Owns the Tone.js graph and hides it behind a plain API so
// nothing else in the app depends on Tone. `noise.ts` (fft.js) still synthesizes
// the continuous-α buffers — Tone's built-in noise only offers three fixed colors.
export class NoiseEngine {
  onStop: (() => void) | null = null;

  private graph: Graph | null = null;
  private sourceA: Tone.ToneBufferSource | null = null;
  private sourceB: Tone.ToneBufferSource | null = null;
  private current: GeneratorParams;
  private contextReady = false;
  private fadeOutTimeoutId: number | null = null;
  private playing = false;
  private starting = false;

  constructor(initial: GeneratorParams) {
    this.current = { ...initial };
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get params(): GeneratorParams {
    return { ...this.current };
  }

  async start(): Promise<void> {
    if (this.playing || this.starting) return;
    this.starting = true;

    this.ensureContext();
    await Tone.start(); // resume the AudioContext from the user gesture
    this.ensureGraph();

    // Restore level in case a previous session ended mid fade-out at gain 0.
    this.graph!.master.gain.rampTo(this.current.volume, RAMP_SECONDS);
    this.startLayer("A", this.current.colorA);
    this.startLayer("B", this.current.colorB);

    this.playing = true;
    this.starting = false;
  }

  stop(): void {
    if (!this.playing) return;
    this.cancelFadeOut();
    this.disposeLayers();
    this.playing = false;
    // Release the audio hardware while stopped; start() resumes it.
    void this.rawContext.suspend();
    this.onStop?.();
  }

  setVolume(volume: number): void {
    this.current.volume = volume;
    this.graph?.master.gain.rampTo(volume, RAMP_SECONDS);
  }

  // Color changes rebuild a noise buffer, so callers fire these on `change`.
  setColorA(alpha: number): void {
    this.current.colorA = alpha;
    this.swapColor("A", alpha);
  }

  setColorB(alpha: number): void {
    this.current.colorB = alpha;
    this.swapColor("B", alpha);
  }

  setMix(mix: number): void {
    this.current.mix = mix;
    this.graph?.crossfade.fade.rampTo(mix, RAMP_SECONDS);
  }

  setLowCut(hz: number): void {
    this.current.lowCutHz = hz;
    this.graph?.lowCut.frequency.rampTo(hz, RAMP_SECONDS);
  }

  setHighCut(hz: number): void {
    this.current.highCutHz = hz;
    this.graph?.highCut.frequency.rampTo(hz, RAMP_SECONDS);
  }

  setResonance(q: number): void {
    this.current.resonanceQ = q;
    this.graph?.highCut.Q.rampTo(q, RAMP_SECONDS);
  }

  setTilt(db: number): void {
    this.current.tiltDb = db;
    if (!this.graph) return;
    // Positive = brighter: attenuate lows, lift highs by the same amount.
    this.graph.tilt.low.rampTo(-db, RAMP_SECONDS);
    this.graph.tilt.high.rampTo(db, RAMP_SECONDS);
  }

  setWaveRate(hz: number): void {
    this.current.waveRateHz = hz;
    this.graph?.tremolo.frequency.rampTo(hz, RAMP_SECONDS);
  }

  setWaveDepth(depth: number): void {
    this.current.waveDepth = depth;
    this.graph?.tremolo.depth.rampTo(depth, RAMP_SECONDS);
  }

  setTimerMinutes(minutes: number): void {
    this.current.timerMinutes = minutes; // no audio node — used by scheduleFadeOut + persistence
  }

  // Bulk update (presets, restore). Ramps every live node and swaps both layers;
  // gapless while playing because the buffer sources cross-fade in live.
  applyParams(params: GeneratorParams): void {
    this.current = { ...params };
    const g = this.graph;
    if (!g) return;
    g.master.gain.rampTo(params.volume, RAMP_SECONDS);
    g.crossfade.fade.rampTo(params.mix, RAMP_SECONDS);
    g.lowCut.frequency.rampTo(params.lowCutHz, RAMP_SECONDS);
    g.highCut.frequency.rampTo(params.highCutHz, RAMP_SECONDS);
    g.highCut.Q.rampTo(params.resonanceQ, RAMP_SECONDS);
    g.tilt.low.rampTo(-params.tiltDb, RAMP_SECONDS);
    g.tilt.high.rampTo(params.tiltDb, RAMP_SECONDS);
    g.tremolo.frequency.rampTo(params.waveRateHz, RAMP_SECONDS);
    g.tremolo.depth.rampTo(params.waveDepth, RAMP_SECONDS);
    this.swapColor("A", params.colorA);
    this.swapColor("B", params.colorB);
  }

  // A native node + context for the visualizer to analyse — no Tone types leak.
  getAnalyserSource(): AnalyserSource | null {
    if (!this.graph) return null;
    return { context: this.rawContext, node: this.graph.analyserBridge };
  }

  scheduleFadeOut(minutes: number): void {
    this.cancelFadeOut();
    const fadeDelayMs = minutes * 60 * 1000;
    this.fadeOutTimeoutId = window.setTimeout(() => {
      this.graph?.master.gain.rampTo(0, FADE_OUT_DURATION_SECONDS);
      this.fadeOutTimeoutId = window.setTimeout(() => this.stop(), FADE_OUT_DURATION_SECONDS * 1000);
    }, fadeDelayMs);
  }

  cancelFadeOut(): void {
    if (this.fadeOutTimeoutId !== null) {
      window.clearTimeout(this.fadeOutTimeoutId);
      this.fadeOutTimeoutId = null;
    }
  }

  private ensureContext(): void {
    if (this.contextReady) return;
    // "playback" requests a larger output buffer than "interactive". With the
    // screen off, mobile OSes wake the CPU only in bursts; a small buffer
    // underruns between them and clicks. This app needs no low latency.
    Tone.setContext(new Tone.Context({ latencyHint: "playback" }));
    this.contextReady = true;
  }

  private ensureGraph(): void {
    if (this.graph) return;
    const p = this.current;

    const crossfade = new Tone.CrossFade(p.mix);
    const lowCut = new Tone.Filter({ frequency: p.lowCutHz, type: "highpass", rolloff: -12, Q: 0.707 });
    const highCut = new Tone.Filter({ frequency: p.highCutHz, type: "lowpass", rolloff: -12, Q: p.resonanceQ });
    const tilt = new Tone.EQ3({
      low: -p.tiltDb,
      mid: 0,
      high: p.tiltDb,
      lowFrequency: TILT_LOW_HZ,
      highFrequency: TILT_HIGH_HZ,
    });
    const tremolo = new Tone.Tremolo({ frequency: p.waveRateHz, depth: p.waveDepth, spread: 0 }).start();
    const master = new Tone.Gain(p.volume);
    // A native tap fed by (not interrupting) the master output — the spectrum
    // library attaches its own analyser to this node.
    const analyserBridge = this.rawContext.createGain();

    crossfade.chain(lowCut, highCut, tilt, tremolo, master);
    master.connect(analyserBridge);
    master.toDestination();

    this.graph = { crossfade, lowCut, highCut, tilt, tremolo, master, analyserBridge };
  }

  private startLayer(which: "A" | "B", alpha: number): void {
    const input = this.layerInput(which);
    if (!input) return;
    const source = this.buildSource(alpha);
    source.connect(input).start();
    this.setSource(which, source);
  }

  // Rebuild one layer's buffer and cross-fade it in live; no-op while stopped
  // (the stored color is used at the next start).
  private swapColor(which: "A" | "B", alpha: number): void {
    const previous = which === "A" ? this.sourceA : this.sourceB;
    const input = this.layerInput(which);
    if (!input || !previous) return;
    const next = this.buildSource(alpha);
    next.connect(input).start();
    previous.stop();
    previous.dispose();
    this.setSource(which, next);
  }

  private disposeLayers(): void {
    for (const source of [this.sourceA, this.sourceB]) {
      source?.stop();
      source?.dispose();
    }
    this.sourceA = null;
    this.sourceB = null;
  }

  private buildSource(alpha: number): Tone.ToneBufferSource {
    const sampleRate = Tone.getContext().sampleRate;
    const data = synthesizeColoredNoise(BUFFER_SAMPLES, alpha, sampleRate, Math.random);
    const buffer = Tone.ToneAudioBuffer.fromArray(data);
    return new Tone.ToneBufferSource({ url: buffer, loop: true });
  }

  private layerInput(which: "A" | "B"): Tone.Gain | null {
    if (!this.graph) return null;
    return which === "A" ? this.graph.crossfade.a : this.graph.crossfade.b;
  }

  private setSource(which: "A" | "B", source: Tone.ToneBufferSource): void {
    if (which === "A") this.sourceA = source;
    else this.sourceB = source;
  }

  private get rawContext(): AudioContext {
    return Tone.getContext().rawContext as unknown as AudioContext;
  }
}
