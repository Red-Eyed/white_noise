# Sleep Noise

A browser-based, evidence-based noise generator for soothing babies to sleep.

**Live:** https://red-eyed.github.io/white_noise/

## Controls, and the evidence behind them

- **Color (White · Pink · Brown)** — a continuous `1/f^α` spectral slope: white (α=0),
  pink (α=1), brown (α=2). The only infant trial behind any color is for broadband white
  noise — 80% of newborns asleep within five minutes vs 25% without (Spencer et al.,
  *Arch Dis Child*, PubMed 2405784) — and neonates respond most strongly to broad-spectrum
  sound (fMEG, PMC3876038). Pink's "deeper sleep" evidence is adult-only; brown is not well
  studied in infants. So the app defaults to and recommends the **White–Pink** band.
- **Volume** — the AAP found some infant sound machines exceed 85 dB (the workplace
  hearing-protection threshold), with unknown effects from loud, long-duration exposure. A
  web app can't measure real loudness, so the default is low and the guidance is to keep it
  quiet enough to talk over, device well away from the crib.
- **Tone** — a comfort low-pass to tame harsh high-end. Not evidence-claimed; personal taste.
- **Auto-off** — fades out after a set time to limit total exposure.
- **Consistency** — settings are saved and restored each session, because the evidence
  favours consistency over any particular color.

## How the noise is generated

Colored noise follows the spectral definition directly: white noise → FFT → weight each bin
by `1/f^(α/2)` → inverse FFT ([src/noise.ts](src/noise.ts), using the `fft.js` library). The
inverse-FFT output is inherently periodic, so every color loops seamlessly with no crossfade.

## Development

```
just install   # npm install
just dev       # start Vite dev server
just build     # type-check and build to dist/
just preview   # build, then serve dist/ locally
```

Pushing to `main` builds and deploys `dist/` to GitHub Pages automatically.
