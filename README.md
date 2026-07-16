# Sleep Noise

A browser-based, evidence-based noise generator for soothing babies to sleep.

**Live:** https://red-eyed.github.io/white_noise/

## Controls, and the evidence behind them

- **Color (White · Pink · Brown)** — a continuous `1/f^α` spectral slope: white (α=0),
  pink (α=1), brown (α=2). The classic infant trial behind any color is for broadband white
  noise — 80% of newborns asleep within five minutes vs 25% without (Spencer et al. 1990,
  *Arch Dis Child*, [PubMed 2405784](https://pubmed.ncbi.nlm.nih.gov/2405784/)) — and neonates
  respond most strongly to broad-spectrum sound (fMEG,
  [PMC3876038](https://pmc.ncbi.nlm.nih.gov/articles/PMC3876038/)). A 2025 fNIRS study found
  regular white-noise exposure during sleep measurably changes infant brain functional
  connectivity ([Nature Sci Rep s41598-025-14774-7](https://www.nature.com/articles/s41598-025-14774-7)),
  and a 2025 systematic review of white noise across maternal and neonatal care found
  consistent benefits for sleep onset, stress, and pain outcomes
  ([PMC12818530](https://pmc.ncbi.nlm.nih.gov/articles/PMC12818530/)). Pink's "deeper sleep"
  evidence is adult-only — it strengthens slow-wave sleep and next-day memory in older adults
  (Papalambros et al. 2017, *Frontiers in Human Neuroscience*,
  [PMC5340797](https://pmc.ncbi.nlm.nih.gov/articles/PMC5340797/)) — and brown is not well
  studied in infants. So the app defaults to and recommends the **White–Pink** band.
- **Volume** — the AAP found some infant sound machines exceed 85 dB, the workplace
  hearing-protection threshold, with unknown effects from loud, long-duration exposure
  ([AAP, *Pediatrics* 2014](https://publications.aap.org/pediatrics/article/133/4/677/32749/Infant-Sleep-Machines-and-Hazardous-Sound-Pressure);
  [Consumer Reports coverage](https://www.consumerreports.org/babies-kids/bassinets/white-noise-for-babies-its-confusing-a3417127276/)).
  A web app can't measure real loudness, so the default is low and the guidance is to keep it
  quiet enough to talk over, device well away from the crib.
- **High cut** — a comfort low-pass to tame harsh high-end. Not evidence-claimed; personal taste.
- **Auto-off** — fades out after a set time to limit total exposure.
- **Consistency** — settings are saved and restored each session, because a consistent
  bedtime routine (not any particular color) is what's linked to better infant sleep outcomes
  — earlier onset, fewer night wakings, longer duration (Mindell et al.,
  [PMC4402657](https://pmc.ncbi.nlm.nih.gov/articles/PMC4402657/)).

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
