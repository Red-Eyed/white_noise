# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A browser-based, evidence-based colored-noise generator for soothing babies to sleep.
Pure client-side TypeScript + Web Audio, bundled by Vite, deployed to GitHub Pages at
https://red-eyed.github.io/white_noise/. No backend, no framework, no runtime dependencies
beyond `fft.js`.

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

Four files, layered from a pure DSP core outward to DOM glue. Read them in this order:

1. **[src/noise.ts](src/noise.ts) — the DSP core.** Synthesizes one loopable buffer of
   `1/f^α` noise by following the spectral definition directly: white noise → FFT → weight
   each frequency bin by `1/f^(α/2)` → inverse FFT. `α`=0 white, 1 pink, 2 brown.
   `synthesizeColoredNoise` is **pure** (the RNG is injected as a `random` parameter);
   `generateColoredNoiseBuffer` is the thin shell that wraps it in an `AudioBuffer`.

2. **[src/audio.ts](src/audio.ts) — `NoiseEngine`, the stateful audio shell.** Owns all
   mutable Web Audio state. The graph is `AudioBufferSourceNode → BiquadFilter(lowpass) →
   GainNode → destination`. Exposes `start/stop`, live `setVolume/setTone/setColor`, and
   `scheduleFadeOut` (auto-off). This is the only place that touches `AudioContext`.

3. **[src/main.ts](src/main.ts) — DOM wiring.** Grabs the controls from `index.html`, binds
   input events to `NoiseEngine` methods, and calls persistence. No audio logic lives here.

4. **[src/storage.ts](src/storage.ts) — localStorage persistence.** Load/save the four
   settings (`volume`, `toneHz`, `alpha`, `timerMinutes`), defensively coerced. Restoring the
   same setup each session is a deliberate feature, not a convenience (see "Evidence" below).

`index.html` holds all UI markup (sliders/select, evidence `<details>`); `src/style.css` is a
hand-written dark theme. There is no component framework — controls are plain DOM elements
looked up by `id`.

## Non-obvious constraints — preserve these

- **Seamless looping comes free from the inverse FFT.** Its output is inherently periodic, so
  every color loops with no crossfade. Don't add crossfade logic — it would fight the design.
- **Buffer length must be a power of two** (`BUFFER_SAMPLES = 2**19` in `audio.ts`) — `fft.js`
  is radix-2 only. Keep any change a power of two.
- **`latencyHint: "playback"` is intentional**, not a default to "optimize" away. With the
  screen off, mobile OSes wake the CPU in bursts; a small (interactive) buffer underruns and
  clicks. This app needs no low latency — the large playback buffer is what stops the clicks.
- **The color slider rebuilds the buffer on `change` (release), not `input`.** Each rebuild is
  a full FFT, so it must not run on every drag tick. Volume/tone are cheap Web Audio param
  ramps and *do* update live on `input`. Preserve this split.
- **`setColor` swaps the source node live** — it builds a fresh buffer, starts the new source,
  then stops/disconnects the old one, so a running stream re-colors without a gap.
- **DC is zeroed and the slope is flattened below 20 Hz** (`LOW_FREQUENCY_CORNER_HZ`).
  Brown noise's `1/f²` weight blows up toward DC; without the corner a few sub-audible bins
  would swallow all the headroom as an infrasonic swell.
- **`stop()` suspends the AudioContext** to release audio hardware; `start()` resumes it.
- **`fft.js` ships no types** — the ambient declaration lives in [src/fft.d.ts](src/fft.d.ts).
  Complex arrays are interleaved `[re0, im0, re1, im1, …]`; bin `k` is at `[2k]`/`[2k+1]`.

## Evidence-driven product

This is a health-adjacent app; the UI copy and defaults encode published infant-sleep
evidence, and the [README.md](README.md) documents the citations. When changing defaults,
copy, or the recommended color band (**White–Pink**), keep them consistent with the evidence
in the README and the in-app `<details class="evidence">` block — don't drift the science.
