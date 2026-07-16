# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A browser-based, evidence-based colored-noise generator for soothing babies to sleep.
Client-side TypeScript, bundled by Vite, deployed to GitHub Pages at
https://red-eyed.github.io/white_noise/. No backend. Runtime dependencies:

- **`fft.js`** — radix-2 FFT for the continuous-α noise synthesis (the app's core
  feature; Tone's built-in noise only offers three fixed colors, so this stays hand-rolled
  on top of the library).
- **`tone`** (Tone.js) — the audio engine: `CrossFade`, `Filter`, `EQ3`, `Tremolo`, `Gain`,
  and `AudioContext` lifecycle. Prefer Tone nodes over raw Web Audio wiring.
- **`react` / `react-dom`** — the view layer (a "Simple" default screen and an advanced
  "Pro" panel).
- **`audiomotion-analyzer`** — the live spectrum visualizer. Don't hand-roll spectrum
  drawing; configure this library.

`.npmrc` sets `legacy-peer-deps=true` because `@vitejs/plugin-react`'s peer range trails
Vite 8; the installed versions are compatible.

## Commands

```
just install   # npm install
just dev       # Vite dev server
just build     # tsc (type-check gate) && vite build → dist/
just preview   # build, then serve dist/ locally
```

`just` targets just wrap the `npm run` scripts. `build` runs `tsc` first as a strict
type-check gate (`noEmit`), then Vite bundles — a type error fails the build.

There is **no test suite and no separate linter** configured. `tsc --strict` (with
`noUnusedLocals` / `noUnusedParameters`) is the only automated check. Don't invent test or
lint commands; if adding tests, wire them into `package.json` and the `justfile` first.

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes `dist/`
to GitHub Pages. Node 24, `npm ci`. `dist/` is gitignored and built in CI, not committed.

## Architecture

Layered from a pure DSP core outward to the React view. The engine is **fully decoupled from
the view** — nothing under "audio/data" imports React or the DOM, so the view could be
swapped again without touching audio. Read them in this order:

**Audio + data (framework-agnostic, no DOM):**

1. **[src/noise.ts](src/noise.ts) — the DSP core.** Synthesizes one loopable buffer of
   `1/f^α` noise: white noise → FFT → weight each bin by `1/f^(α/2)` → inverse FFT. `α`=0
   white, 1 pink, 2 brown. `synthesizeColoredNoise` is **pure** (RNG injected as `random`);
   `generateColoredNoiseBuffer` wraps it in an `AudioBuffer`. Still hand-rolled on `fft.js`
   because Tone's noise only has three fixed colors.

2. **[src/audio.ts](src/audio.ts) — `NoiseEngine`, the stateful Tone.js shell.** Owns the
   whole graph and hides Tone behind a plain API (no Tone types leak out). Graph:
   two `ToneBufferSource` layers → `CrossFade` → `Filter`(highpass low-cut) →
   `Filter`(lowpass high-cut, live Q) → `EQ3`(tilt) → `Tremolo`(waves) → `Gain`(master) →
   destination, with a native tap `GainNode` for the visualizer (`getAnalyserSource`).
   Exposes `start/stop`, granular `setX` setters, `applyParams` (presets/restore),
   `scheduleFadeOut`. The only place that touches `AudioContext`.

3. **[src/params.ts](src/params.ts)** — the typed `GeneratorParams` model, `PARAM_RANGES`
   (clamp + slider source of truth), and `DEFAULT_PARAMS`. Grouped sub-interfaces
   (`LayerParams`/`EqParams`/`ModulationParams`) so each concern reads its own slice.

4. **[src/presets.ts](src/presets.ts)** — named presets as pure data (`SoundDesign` only;
   volume/timer are personal and untouched). Adding one is a data change, no logic.

5. **[src/storage.ts](src/storage.ts)** — localStorage load/save of the full params + `pro`
   flag + active `preset`, defensively clamped, with migration from the old schema
   (`toneHz→highCutHz`, `alpha→colorA`). Restoring the same setup each session is a
   deliberate feature (see "Evidence").

**View (React):**

6. **[src/format.ts](src/format.ts)** — pure readout formatters + `colorName`.

7. **[src/sliders.ts](src/sliders.ts)** — `SLIDER_CONFIGS`, the declarative descriptor list
   (param key, log/linear `SliderMap`, format, live/proOnly, engine setter). The view renders
   straight from this — adding a control is a data change here, not new JSX.

8. **[src/App.tsx](src/App.tsx)** — the one stateful component: holds the engine in a ref,
   `params`/`pro`/`preset`/`playing` in state, wires the transport, presets, and mode toggle,
   and renders from `SLIDER_CONFIGS`. **[src/components/Slider.tsx](src/components/Slider.tsx)**
   is a controlled range slider; **[src/components/Spectrum.tsx](src/components/Spectrum.tsx)**
   mounts audioMotion-analyzer onto the engine's analyser tap.
   **[src/main.tsx](src/main.tsx)** is the `createRoot` entry.

`index.html` is now just a `#root` shell. `src/style.css` is a hand-written dark theme keyed
off the same class names (`.app`, `.control`, `.mode-toggle`, `.spectrum`).

## Non-obvious constraints — preserve these

- **Seamless looping comes free from the inverse FFT.** Its output is inherently periodic, so
  every color loops with no per-buffer crossfade. (The `CrossFade` node is between the two
  *layers*, unrelated to loop seams — don't add loop-seam crossfade logic.)
- **Buffer length must be a power of two** (`BUFFER_SAMPLES = 2**19` in `audio.ts`) — `fft.js`
  is radix-2 only. Keep any change a power of two.
- **`latencyHint: "playback"` is intentional**, not a default to "optimize" away. With the
  screen off, mobile OSes wake the CPU in bursts; a small (interactive) buffer underruns and
  clicks. Set once on the Tone `Context`. This app needs no low latency.
- **Color sliders commit on release, not every input tick.** Each color change rebuilds a
  full-FFT buffer (`live: false` in `SLIDER_CONFIGS`; `Slider.tsx` commits on
  pointer/key-up). All other sliders are cheap Tone param ramps and commit live. Preserve
  this split when adding controls.
- **`setColorA/B` cross-fade a fresh buffer in live** — a new `ToneBufferSource` is built,
  started, and connected to the layer's `CrossFade` input, then the old one is
  stopped/disposed, so a running stream re-colors without a gap.
- **DC is zeroed and the slope is flattened below 20 Hz** (`LOW_FREQUENCY_CORNER_HZ`).
  Brown noise's `1/f²` weight blows up toward DC; without the corner a few sub-audible bins
  would swallow all the headroom as an infrasonic swell.
- **`stop()` suspends the AudioContext** (`rawContext.suspend()`) to release audio hardware;
  `start()` calls `Tone.start()` to resume from the user gesture.
- **The visualizer shares the engine's `AudioContext`.** audioMotion is constructed with
  `audioCtx` = the engine's raw context and `source` = the analyser tap node, with
  `connectSpeakers: false` (Tone already routes audio to the destination).
- **Frequency sliders are log-scaled** (`logMap` in `sliders.ts`), so equal travel is equal
  octaves — the useful low end isn't crammed into a sliver of the track.
- **`fft.js` ships no types** — the ambient declaration lives in [src/fft.d.ts](src/fft.d.ts).
  Complex arrays are interleaved `[re0, im0, re1, im1, …]`; bin `k` is at `[2k]`/`[2k+1]`.

## Evidence-driven product

This is a health-adjacent app; the UI copy and defaults encode published infant-sleep
evidence, and the [README.md](README.md) documents the citations. When changing defaults,
copy, or the recommended color band (**White–Pink**), keep them consistent with the evidence
in the README and the in-app `<details class="evidence">` block — don't drift the science.
