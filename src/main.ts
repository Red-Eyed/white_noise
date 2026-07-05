import { NoiseEngine } from "./audio";

const playStopButton = document.getElementById("play-stop") as HTMLButtonElement;
const volumeSlider = document.getElementById("volume") as HTMLInputElement;
const toneSlider = document.getElementById("tone") as HTMLInputElement;
const colorSlider = document.getElementById("color") as HTMLInputElement;
const timerSelect = document.getElementById("timer") as HTMLSelectElement;

const engine = new NoiseEngine(Number(colorSlider.value));
engine.onStop = () => setPlayingUI(false);

playStopButton.addEventListener("click", async () => {
  if (engine.isPlaying) {
    engine.stop();
    return;
  }

  await engine.start(Number(volumeSlider.value), Number(toneSlider.value));
  setPlayingUI(true);
  applyTimer();
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
}
