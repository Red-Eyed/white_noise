const LOOP_CROSSFADE_SECONDS = 1;

export function generateBrownNoiseBuffer(
  context: BaseAudioContext,
  durationSeconds: number,
  leak: number,
): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let brown = 0;
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    brown = leak * brown + (1 - leak) * white;
    data[i] = brown;
    peak = Math.max(peak, Math.abs(brown));
  }

  if (peak > 0) {
    const scale = 1 / peak;
    for (let i = 0; i < length; i++) {
      data[i] *= scale;
    }
  }

  crossfadeLoopSeam(data, Math.min(length, Math.floor(sampleRate * LOOP_CROSSFADE_SECONDS)));

  return buffer;
}

// Blends the buffer's tail toward its head so a looped AudioBufferSourceNode
// wraps without an audible click (a hard jump reads as broadband noise/hiss).
function crossfadeLoopSeam(data: Float32Array, crossfadeSamples: number): void {
  const tailStart = data.length - crossfadeSamples;
  for (let i = 0; i < crossfadeSamples; i++) {
    const fadeIn = i / crossfadeSamples;
    const fadeOut = 1 - fadeIn;
    data[tailStart + i] = data[tailStart + i] * fadeOut + data[i] * fadeIn;
  }
}
