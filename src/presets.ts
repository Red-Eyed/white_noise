import type { SoundDesign } from "./params";

// Named starting points that drive every sound-design slider at once. Pure data:
// adding a preset is one entry, no logic change (Open/Closed). Volume and the
// auto-off timer are personal, and deliberately left untouched by presets.
export const PRESETS = {
  Ocean: { colorA: 1.7, colorB: 1.0, mix: 0.4, lowCutHz: 30, highCutHz: 900, resonanceQ: 0.7, tiltDb: -2, waveRateHz: 0.08, waveDepth: 0.55 },
  Rain: { colorA: 0.6, colorB: 0.2, mix: 0.45, lowCutHz: 120, highCutHz: 6000, resonanceQ: 0.7, tiltDb: 2, waveRateHz: 0.3, waveDepth: 0.15 },
  Fan: { colorA: 1.8, colorB: 1.8, mix: 0.0, lowCutHz: 40, highCutHz: 500, resonanceQ: 1.4, tiltDb: -4, waveRateHz: 0.05, waveDepth: 0.12 },
  Womb: { colorA: 2.0, colorB: 1.5, mix: 0.25, lowCutHz: 20, highCutHz: 380, resonanceQ: 0.7, tiltDb: -6, waveRateHz: 0.12, waveDepth: 0.45 },
  "Deep Sleep": { colorA: 1.0, colorB: 1.0, mix: 0.0, lowCutHz: 25, highCutHz: 1500, resonanceQ: 0.7, tiltDb: 0, waveRateHz: 0.1, waveDepth: 0.0 },
  Focus: { colorA: 1.2, colorB: 0.5, mix: 0.2, lowCutHz: 60, highCutHz: 3000, resonanceQ: 0.7, tiltDb: 1, waveRateHz: 0.1, waveDepth: 0.0 },
} satisfies Record<string, SoundDesign>;

export type PresetName = keyof typeof PRESETS;
