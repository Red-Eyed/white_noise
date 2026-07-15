import { generateColoredNoiseBuffer } from "./noise";

// Loop length as a power of two so the FFT-based synthesis stays radix-2.
// 2^19 ≈ 11.9 s at 44.1 kHz — long enough that the loop is inaudible.
const BUFFER_SAMPLES = 2 ** 19;
const PARAM_SMOOTHING_SECONDS = 0.01;
const FADE_OUT_DURATION_SECONDS = 10;

export class NoiseEngine {
  onStop: (() => void) | null = null;

  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private alpha: number;
  private fadeOutTimeoutId: number | null = null;
  private starting = false;

  constructor(initialAlpha: number) {
    this.alpha = initialAlpha;
  }

  get isPlaying(): boolean {
    return this.source !== null;
  }

  async start(volume: number, toneHz: number): Promise<void> {
    if (this.isPlaying || this.starting) return;
    this.starting = true;

    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    const gain = this.context.createGain();
    gain.gain.value = volume;

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = toneHz;

    const source = this.buildSource();
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    source.start();

    this.source = source;
    this.filter = filter;
    this.gain = gain;
    this.starting = false;
  }

  stop(): void {
    if (!this.isPlaying) return;

    this.cancelFadeOut();
    this.source?.stop();
    this.source?.disconnect();
    this.filter?.disconnect();
    this.gain?.disconnect();
    this.source = null;
    this.filter = null;
    this.gain = null;

    // Release the audio hardware while stopped; start() resumes it. Without
    // this the AudioContext keeps the audio subsystem clocked, a small idle
    // drain. (Playback itself loops on the audio thread, not in JS.)
    void this.context?.suspend();

    this.onStop?.();
  }

  setVolume(volume: number): void {
    this.gain?.gain.setTargetAtTime(volume, this.context!.currentTime, PARAM_SMOOTHING_SECONDS);
  }

  setTone(toneHz: number): void {
    this.filter?.frequency.setTargetAtTime(toneHz, this.context!.currentTime, PARAM_SMOOTHING_SECONDS);
  }

  setColor(alpha: number): void {
    this.alpha = alpha;
    if (!this.isPlaying) return;

    const newSource = this.buildSource();
    newSource.connect(this.filter!);
    newSource.start();

    this.source!.stop();
    this.source!.disconnect();
    this.source = newSource;
  }

  scheduleFadeOut(minutes: number): void {
    this.cancelFadeOut();

    const fadeDelayMs = minutes * 60 * 1000;
    this.fadeOutTimeoutId = window.setTimeout(() => {
      if (!this.gain || !this.context) return;

      const now = this.context.currentTime;
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(0, now + FADE_OUT_DURATION_SECONDS);

      this.fadeOutTimeoutId = window.setTimeout(() => this.stop(), FADE_OUT_DURATION_SECONDS * 1000);
    }, fadeDelayMs);
  }

  cancelFadeOut(): void {
    if (this.fadeOutTimeoutId !== null) {
      window.clearTimeout(this.fadeOutTimeoutId);
      this.fadeOutTimeoutId = null;
    }
  }

  private buildSource(): AudioBufferSourceNode {
    const buffer = generateColoredNoiseBuffer(this.context!, BUFFER_SAMPLES, this.alpha);
    const source = this.context!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }
}
