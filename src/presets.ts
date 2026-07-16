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

// Presets that reproduce the exact noise color used in a published sleep study,
// rather than a creative sound design. Each is plain, unfiltered, unmodulated
// noise — fully open EQ, flat tilt, no wave — because that's what the cited
// study actually played; no attempt is made to replicate any study's playback
// timing or apparatus beyond the noise color itself.
export interface CaseStudyPreset {
  design: SoundDesign;
  citation: { label: string; url: string };
}

export const CASE_STUDY_PRESETS = {
  "Spencer 1990": {
    design: {
      colorA: 0,
      colorB: 0,
      mix: 0,
      lowCutHz: 20,
      highCutHz: 8000,
      resonanceQ: 0.707,
      tiltDb: 0,
      waveRateHz: 0.1,
      waveDepth: 0,
    },
    citation: {
      label: "Spencer et al. 1990, Arch Dis Child — newborn white-noise sleep-onset trial",
      url: "https://pubmed.ncbi.nlm.nih.gov/2405784/",
    },
  },
  "Papalambros 2017": {
    design: {
      colorA: 1,
      colorB: 1,
      mix: 0,
      lowCutHz: 20,
      highCutHz: 8000,
      resonanceQ: 0.707,
      tiltDb: 0,
      waveRateHz: 0.1,
      waveDepth: 0,
    },
    citation: {
      label: "Papalambros et al. 2017, Front Hum Neurosci — pink-noise deep-sleep/memory trial",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5340797/",
    },
  },
} satisfies Record<string, CaseStudyPreset>;

export type CaseStudyPresetName = keyof typeof CASE_STUDY_PRESETS;
