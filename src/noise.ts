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

  return buffer;
}
