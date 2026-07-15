import { NoiseEngine } from "./audio";

const playStopButton = document.getElementById("play-stop") as HTMLButtonElement;
const volumeSlider = document.getElementById("volume") as HTMLInputElement;
const toneSlider = document.getElementById("tone") as HTMLInputElement;
const colorSlider = document.getElementById("color") as HTMLInputElement;
const timerSelect = document.getElementById("timer") as HTMLSelectElement;

const engine = new NoiseEngine(Number(colorSlider.value));
engine.onStop = () => setPlayingUI(false);

if ("mediaSession" in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({ title: "Brown Noise" });
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
});

toneSlider.addEventListener("input", () => {
  engine.setTone(Number(toneSlider.value));
});

colorSlider.addEventListener("input", () => {
  engine.setColor(Number(colorSlider.value));
});

timerSelect.addEventListener("change", () => {
  if (engine.isPlaying) applyTimer();
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

function setPlayingUI(isPlaying: boolean): void {
  playStopButton.textContent = isPlaying ? "Stop" : "Play";
  playStopButton.setAttribute("aria-pressed", String(isPlaying));
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }
}
