// The full typed parameter surface for the generator — one source of truth shared
// by the engine (which builds the audio graph), storage (which coerces persisted
// values), the UI (slider ranges + readouts) and presets. Grouped sub-interfaces
// let each audio module depend only on the parameters it consumes (Interface
// Segregation), while GeneratorParams composes them for the whole app.

export interface LayerParams {
  colorA: number; // spectral exponent α of the base ("bed") layer: 0 white, 1 pink, 2 brown
  colorB: number; // α of the second ("air") layer, blended in by `mix`
  mix: number; // 0 = only layer A, 1 = only layer B (equal-power crossfade)
}

export interface EqParams {
  lowCutHz: number; // highpass corner — removes rumble below it
  highCutHz: number; // lowpass corner — the "tone" / brightness ceiling
  resonanceQ: number; // Q of the lowpass — higher = a resonant edge at the corner
  tiltDb: number; // spectral tilt: <0 darker, >0 brighter, pivoting around a mid frequency
}

export interface ModulationParams {
  waveRateHz: number; // LFO speed for the slow amplitude "waves"
  waveDepth: number; // 0 = steady, 1 = dips toward silence at each trough
}

export interface GeneratorParams extends LayerParams, EqParams, ModulationParams {
  volume: number;
  timerMinutes: number;
}

// Everything except the personal volume/timer — the slice a preset overrides.
export type SoundDesign = LayerParams & EqParams & ModulationParams;

export interface Range {
  readonly min: number;
  readonly max: number;
}

// Valid range per numeric parameter — the single source used to clamp persisted
// values and to map the log-scaled frequency sliders. Keep the static slider
// min/max in index.html consistent with these.
export const PARAM_RANGES = {
  volume: { min: 0, max: 0.7 },
  colorA: { min: 0, max: 2 },
  colorB: { min: 0, max: 2 },
  mix: { min: 0, max: 1 },
  lowCutHz: { min: 20, max: 500 },
  highCutHz: { min: 200, max: 8000 },
  resonanceQ: { min: 0.4, max: 6 },
  tiltDb: { min: -12, max: 12 },
  waveRateHz: { min: 0.02, max: 0.6 },
  waveDepth: { min: 0, max: 1 },
} satisfies Record<string, Range>;

export const DEFAULT_PARAMS: GeneratorParams = {
  volume: 0.25,
  colorA: 1, // pink — the evidence-favoured default
  colorB: 0.4, // a brighter "air" layer, silent until mixed in
  mix: 0, // single layer, so the default sound matches the simple app
  lowCutHz: 20, // effectively open
  highCutHz: 500, // matches the original Tone default
  resonanceQ: 0.707, // Butterworth — flat, no resonant peak
  tiltDb: 0, // flat
  waveRateHz: 0.1,
  waveDepth: 0, // steady, no modulation
  timerMinutes: 0,
};
