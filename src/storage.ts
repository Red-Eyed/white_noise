// Persists control settings so every session is identical. The infant evidence
// favours consistency over any particular spectral color, so restoring the same
// setup each night is itself the feature — not a convenience.

export interface Settings {
  volume: number;
  toneHz: number;
  alpha: number;
  timerMinutes: number;
}

const STORAGE_KEY = "sleep-noise-settings";

export function loadSettings(defaults: Settings): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>;
    return {
      volume: numberOr(parsed.volume, defaults.volume),
      toneHz: numberOr(parsed.toneHz, defaults.toneHz),
      alpha: numberOr(parsed.alpha, defaults.alpha),
      timerMinutes: numberOr(parsed.timerMinutes, defaults.timerMinutes),
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Persistence is best-effort; ignore quota / private-mode errors.
  }
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
