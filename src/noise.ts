import FFT from "fft.js";

// Below this frequency the 1/f^alpha slope is flattened. For brown noise the
// weight rises without bound toward DC, so a handful of sub-audible bins would
// otherwise swallow all the headroom as a slow infrasonic swell. Clamping the
// slope below the audible floor keeps the audible spectrum correct.
const LOW_FREQUENCY_CORNER_HZ = 20;
const NORMALIZED_PEAK = 0.99;

// Synthesize one loopable buffer of 1/f^alpha noise, following the spectral
// definition directly: white noise -> FFT -> weight each bin by 1/f^(alpha/2)
// -> inverse FFT. alpha = 0 is white, 1 is pink, 2 is brown.
//
// Because the inverse FFT output is inherently periodic, the buffer loops
// seamlessly for every color with no crossfade. Pure given `random`.
// `samples` must be a power of two (fft.js requirement).
export function synthesizeColoredNoise(
  samples: number,
  alpha: number,
  sampleRate: number,
  random: () => number,
): Float32Array {
  const fft = new FFT(samples);

  const white = new Float64Array(samples);
  for (let i = 0; i < samples; i++) {
    white[i] = random() * 2 - 1;
  }

  const spectrum = fft.createComplexArray();
  fft.realTransform(spectrum, white);
  fft.completeSpectrum(spectrum);

  applySpectralSlope(spectrum, samples, alpha, sampleRate);

  const timeDomain = fft.createComplexArray();
  fft.inverseTransform(timeDomain, spectrum);

  return normalizeRealPeak(timeDomain, samples, NORMALIZED_PEAK);
}

export function generateColoredNoiseBuffer(
  context: BaseAudioContext,
  samples: number,
  alpha: number,
): AudioBuffer {
  const data = synthesizeColoredNoise(samples, alpha, context.sampleRate, Math.random);
  const buffer = context.createBuffer(1, samples, context.sampleRate);
  buffer.getChannelData(0).set(data);
  return buffer;
}

// Weight each frequency bin by 1/f^(alpha/2) (amplitude), which yields a
// 1/f^alpha power spectrum. The weight is symmetric in the bin index so the
// spectrum stays Hermitian and the inverse transform comes out real. Operates
// on an interleaved complex array: bin k lives at [2k] (real), [2k+1] (imag).
function applySpectralSlope(
  spectrum: number[],
  bins: number,
  alpha: number,
  sampleRate: number,
): void {
  const exponent = alpha / 2;

  spectrum[0] = 0; // Drop DC so the buffer has no constant offset.
  spectrum[1] = 0;

  for (let k = 1; k < bins; k++) {
    const binsFromDc = Math.min(k, bins - k);
    const frequency = (binsFromDc / bins) * sampleRate;
    const shapedFrequency = Math.max(frequency, LOW_FREQUENCY_CORNER_HZ);
    const weight = 1 / Math.pow(shapedFrequency, exponent);
    spectrum[2 * k] *= weight;
    spectrum[2 * k + 1] *= weight;
  }
}

// Read the real parts (even indices) of the interleaved complex array and scale
// so the peak sits at `target`.
function normalizeRealPeak(spectrum: number[], samples: number, target: number): Float32Array {
  let peak = 0;
  for (let i = 0; i < samples; i++) {
    peak = Math.max(peak, Math.abs(spectrum[2 * i]));
  }

  const scale = peak > 0 ? target / peak : 0;
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    out[i] = spectrum[2 * i] * scale;
  }
  return out;
}
