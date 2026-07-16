// Pure readout formatters + the color name used by the labels.

import { PARAM_RANGES } from "./params";

export function colorName(alpha: number): string {
  if (alpha < 0.25) return "White";
  if (alpha < 0.9) return "White–Pink";
  if (alpha <= 1.1) return "Pink";
  if (alpha < 1.75) return "Pink–Brown";
  return "Brown";
}

export function formatVolume(v: number): string {
  return `${Math.round((v / PARAM_RANGES.volume.max) * 100)}%`;
}

export function formatColor(alpha: number): string {
  return `${colorName(alpha)} (α ${alpha.toFixed(1)})`;
}

export function formatMix(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)} kHz`;
  return `${Math.round(hz)} Hz`;
}

export function formatTilt(db: number): string {
  return `${db > 0 ? "+" : ""}${db.toFixed(1)} dB`;
}

export function formatWaveRate(hz: number): string {
  return `${(1 / hz).toFixed(1)} s/cycle`;
}

export function formatWaveDepth(v: number): string {
  return v === 0 ? "off" : `${Math.round(v * 100)}%`;
}
