// Persists the full control state so every session is identical. The infant
// evidence favours consistency over any particular spectral color, so restoring
// the same setup each night is itself the feature — not a convenience.

import { PARAM_RANGES, type GeneratorParams, type Range } from "./params";

export interface PersistedState {
  params: GeneratorParams;
  advanced: boolean; // whether the advanced panel is open
  preset: string | null; // the active preset name, or null when custom
}

const STORAGE_KEY = "sleep-noise-settings";

export function loadState(defaults: PersistedState): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      params: coerceParams(parsed, defaults.params),
      // `?? parsed.pro` migrates the old key name (before Pro was renamed Advanced).
      advanced: boolOr(parsed.advanced ?? parsed.pro, defaults.advanced),
      preset: typeof parsed.preset === "string" ? parsed.preset : defaults.preset,
    };
  } catch {
    return defaults;
  }
}

export function saveState(state: PersistedState): void {
  try {
    const flat = { ...state.params, advanced: state.advanced, preset: state.preset };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flat));
  } catch {
    // Persistence is best-effort; ignore quota / private-mode errors.
  }
}

// Coerce each field into range, falling back to the default. `?? old` handles
// migration from the original schema (toneHz → highCutHz, alpha → colorA).
function coerceParams(raw: Record<string, unknown>, defaults: GeneratorParams): GeneratorParams {
  return {
    volume: clamp(raw.volume, PARAM_RANGES.volume, defaults.volume),
    colorA: clamp(raw.colorA ?? raw.alpha, PARAM_RANGES.colorA, defaults.colorA),
    colorB: clamp(raw.colorB, PARAM_RANGES.colorB, defaults.colorB),
    mix: clamp(raw.mix, PARAM_RANGES.mix, defaults.mix),
    lowCutHz: clamp(raw.lowCutHz, PARAM_RANGES.lowCutHz, defaults.lowCutHz),
    highCutHz: clamp(raw.highCutHz ?? raw.toneHz, PARAM_RANGES.highCutHz, defaults.highCutHz),
    resonanceQ: clamp(raw.resonanceQ, PARAM_RANGES.resonanceQ, defaults.resonanceQ),
    tiltDb: clamp(raw.tiltDb, PARAM_RANGES.tiltDb, defaults.tiltDb),
    waveRateHz: clamp(raw.waveRateHz, PARAM_RANGES.waveRateHz, defaults.waveRateHz),
    waveDepth: clamp(raw.waveDepth, PARAM_RANGES.waveDepth, defaults.waveDepth),
    timerMinutes: numberOr(raw.timerMinutes, defaults.timerMinutes),
  };
}

function clamp(value: unknown, range: Range, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(range.max, Math.max(range.min, value));
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
