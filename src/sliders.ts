// Declarative descriptors for every slider: which parameter it drives, how the
// slider position maps to the value, how to format the readout, and how to apply
// it to the engine. The React view renders straight from this list, so adding a
// control is a data change here — not new JSX.

import type { NoiseEngine } from "./audio";
import { PARAM_RANGES, type GeneratorParams, type Range } from "./params";
import {
  formatColor,
  formatHz,
  formatMix,
  formatQ,
  formatTilt,
  formatVolume,
  formatWaveDepth,
  formatWaveRate,
} from "./format";

export interface SliderMap {
  toValue(raw: number): number; // slider position → parameter value
  toRaw(value: number): number; // parameter value → slider position
}

export const linear: SliderMap = { toValue: (raw) => raw, toRaw: (value) => value };

// Log-scaled: equal slider travel = equal octaves, so the useful low end isn't
// crammed into a sliver of the track (and the harsh top isn't over-represented).
export function logMap(range: Range): SliderMap {
  const ratio = Math.log(range.max / range.min);
  return {
    toValue: (raw) => range.min * Math.exp(ratio * raw),
    toRaw: (value) => Math.log(value / range.min) / ratio,
  };
}

const toneMap = logMap(PARAM_RANGES.highCutHz);
const lowCutMap = logMap(PARAM_RANGES.lowCutHz);

export interface SliderConfig {
  key: keyof GeneratorParams;
  label: string;
  map: SliderMap;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  format: (value: number) => string;
  // `live` sliders are cheap param ramps and commit on every input tick; non-live
  // ones (the colors) rebuild a noise buffer, so they only commit on release.
  live: boolean;
  advancedOnly: boolean;
  apply: (engine: NoiseEngine, value: number) => void;
  caption?: string;
  scale?: string[];
}

export const SLIDER_CONFIGS: SliderConfig[] = [
  {
    key: "volume",
    label: "Volume",
    map: linear,
    sliderMin: PARAM_RANGES.volume.min,
    sliderMax: PARAM_RANGES.volume.max,
    sliderStep: 0.01,
    format: formatVolume,
    live: true,
    advancedOnly: false,
    apply: (engine, v) => engine.setVolume(v),
    caption: "Keep it in the calm zone — quiet enough to hold a conversation over.",
  },
  {
    key: "colorA",
    label: "Color",
    map: linear,
    sliderMin: PARAM_RANGES.colorA.min,
    sliderMax: PARAM_RANGES.colorA.max,
    sliderStep: 0.05,
    format: formatColor,
    live: false,
    advancedOnly: false,
    apply: (engine, v) => engine.setColorA(v),
    scale: ["White", "Pink", "Brown"],
    caption: "Evidence points to the White–Pink range.",
  },
  {
    key: "colorB",
    label: "Air layer",
    map: linear,
    sliderMin: PARAM_RANGES.colorB.min,
    sliderMax: PARAM_RANGES.colorB.max,
    sliderStep: 0.05,
    format: formatColor,
    live: false,
    advancedOnly: true,
    apply: (engine, v) => engine.setColorB(v),
    caption: "A second noise color, blended in by the mix below.",
  },
  {
    key: "mix",
    label: "Layer mix",
    map: linear,
    sliderMin: PARAM_RANGES.mix.min,
    sliderMax: PARAM_RANGES.mix.max,
    sliderStep: 0.01,
    format: formatMix,
    live: true,
    advancedOnly: true,
    apply: (engine, v) => engine.setMix(v),
    scale: ["Color", "Air layer"],
  },
  {
    key: "lowCutHz",
    label: "Low-cut",
    map: lowCutMap,
    sliderMin: 0,
    sliderMax: 1,
    sliderStep: 0.005,
    format: formatHz,
    live: true,
    advancedOnly: true,
    apply: (engine, v) => engine.setLowCut(v),
    caption: "Rolls off rumble below the corner.",
  },
  {
    key: "highCutHz",
    label: "Tone",
    map: toneMap,
    sliderMin: 0,
    sliderMax: 1,
    sliderStep: 0.005,
    format: formatHz,
    live: true,
    advancedOnly: false,
    apply: (engine, v) => engine.setHighCut(v),
    caption: "High-cut ceiling — lower is warmer, higher is brighter.",
  },
  {
    key: "resonanceQ",
    label: "Resonance",
    map: linear,
    sliderMin: PARAM_RANGES.resonanceQ.min,
    sliderMax: PARAM_RANGES.resonanceQ.max,
    sliderStep: 0.05,
    format: formatQ,
    live: true,
    advancedOnly: true,
    apply: (engine, v) => engine.setResonance(v),
    caption: "Emphasis right at the Tone corner.",
  },
  {
    key: "tiltDb",
    label: "Tilt",
    map: linear,
    sliderMin: PARAM_RANGES.tiltDb.min,
    sliderMax: PARAM_RANGES.tiltDb.max,
    sliderStep: 0.5,
    format: formatTilt,
    live: true,
    advancedOnly: true,
    apply: (engine, v) => engine.setTilt(v),
    scale: ["Darker", "Brighter"],
  },
  {
    key: "waveRateHz",
    label: "Waves",
    map: linear,
    sliderMin: PARAM_RANGES.waveRateHz.min,
    sliderMax: PARAM_RANGES.waveRateHz.max,
    sliderStep: 0.01,
    format: formatWaveRate,
    live: true,
    advancedOnly: true,
    apply: (engine, v) => engine.setWaveRate(v),
    caption: "Speed of the slow volume swell.",
  },
  {
    key: "waveDepth",
    label: "Wave depth",
    map: linear,
    sliderMin: PARAM_RANGES.waveDepth.min,
    sliderMax: PARAM_RANGES.waveDepth.max,
    sliderStep: 0.01,
    format: formatWaveDepth,
    live: true,
    advancedOnly: true,
    apply: (engine, v) => engine.setWaveDepth(v),
    caption: "How deep each swell dips — 0 is steady.",
  },
];
