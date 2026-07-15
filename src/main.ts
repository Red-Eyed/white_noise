import { NoiseEngine } from "./audio";
import { loadSettings, saveSettings, type Settings } from "./storage";

const DEFAULT_SETTINGS: Settings = {
  volume: 0.25,
  toneHz: 500,
  alpha: 1,
  timerMinutes: 0,
};

const playStopButton = document.getElementById("play-stop") as HTMLButtonElement;
const volumeSlider = document.getElementById("volume") as HTMLInputElement;
const toneSlider = document.getElementById("tone") as HTMLInputElement;
const colorSlider = document.getElementById("color") as HTMLInputElement;
const volumeReadout = document.getElementById("volume-readout") as HTMLSpanElement;
const toneReadout = document.getElementById("tone-readout") as HTMLSpanElement;
const colorReadout = document.getElementById("color-readout") as HTMLSpanElement;
const timerSelect = document.getElementById("timer") as HTMLSelectElement;

const settings = loadSettings(DEFAULT_SETTINGS);
applySettingsToControls(settings);

const engine = new NoiseEngine(Number(colorSlider.value));
engine.onStop = () => setPlayingUI(false);

if ("mediaSession" in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({ title: "Sleep Noise" });
  navigator.mediaSession.setActionHandler("play", playNoise);
  navigator.mediaSession.setActionHandler("pause", stopNoise);
}

playStopButton.addEventListener("click", () => {
  if (engine.isPlaying) {
    stopNoise();
  } else {
    playNoise();
  }
});

volumeSlider.addEventListener("input", () => {
  engine.setVolume(Number(volumeSlider.value));
  updateVolumeReadout();
  persist();
});

toneSlider.addEventListener("input", () => {
  engine.setTone(Number(toneSlider.value));
  updateToneReadout();
  persist();
});

// Live label follows the drag, but rebuilding the noise buffer is a one-time
// FFT, so it runs on release (`change`) rather than every `input` tick.
colorSlider.addEventListener("input", updateColorReadout);
colorSlider.addEventListener("change", () => {
  engine.setColor(Number(colorSlider.value));
  persist();
});

timerSelect.addEventListener("change", () => {
  if (engine.isPlaying) applyTimer();
  persist();
});

async function playNoise(): Promise<void> {
  await engine.start(Number(volumeSlider.value), Number(toneSlider.value));
  setPlayingUI(true);
  applyTimer();
}

function stopNoise(): void {
  engine.stop();
}

function applyTimer(): void {
  const minutes = Number(timerSelect.value);
  if (minutes > 0) {
    engine.scheduleFadeOut(minutes);
  } else {
    engine.cancelFadeOut();
  }
}

function applySettingsToControls(saved: Settings): void {
  volumeSlider.value = String(saved.volume);
  toneSlider.value = String(saved.toneHz);
  colorSlider.value = String(saved.alpha);
  timerSelect.value = String(saved.timerMinutes);
  updateVolumeReadout();
  updateToneReadout();
  updateColorReadout();
}

function persist(): void {
  saveSettings({
    volume: Number(volumeSlider.value),
    toneHz: Number(toneSlider.value),
    alpha: Number(colorSlider.value),
    timerMinutes: Number(timerSelect.value),
  });
}

function updateVolumeReadout(): void {
  const fraction = Number(volumeSlider.value) / Number(volumeSlider.max);
  volumeReadout.textContent = `${Math.round(fraction * 100)}%`;
}

function updateToneReadout(): void {
  toneReadout.textContent = `${toneSlider.value} Hz`;
}

function updateColorReadout(): void {
  const alpha = Number(colorSlider.value);
  colorReadout.textContent = `${colorName(alpha)} (α ${alpha.toFixed(1)})`;
}

function colorName(alpha: number): string {
  if (alpha < 0.25) return "White";
  if (alpha < 0.9) return "White–Pink";
  if (alpha <= 1.1) return "Pink";
  if (alpha < 1.75) return "Pink–Brown";
  return "Brown";
}

function setPlayingUI(isPlaying: boolean): void {
  playStopButton.textContent = isPlaying ? "Stop" : "Play";
  playStopButton.setAttribute("aria-pressed", String(isPlaying));
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }
}
