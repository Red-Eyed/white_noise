import { useEffect, useRef, useState } from "react";
import { NoiseEngine } from "./audio";
import { DEFAULT_PARAMS, type GeneratorParams } from "./params";
import { PRESETS, type PresetName } from "./presets";
import { loadState, saveState } from "./storage";
import { SLIDER_CONFIGS, type SliderConfig } from "./sliders";
import { Slider } from "./components/Slider";
import { Spectrum } from "./components/Spectrum";

const initial = loadState({ params: DEFAULT_PARAMS, advanced: false, preset: null });
const initialPreset = initial.preset && initial.preset in PRESETS ? initial.preset : null;

export function App() {
  const engineRef = useRef<NoiseEngine | null>(null);
  if (!engineRef.current) engineRef.current = new NoiseEngine(initial.params);
  const engine = engineRef.current;

  const [params, setParams] = useState<GeneratorParams>(initial.params);
  const [advanced, setAdvanced] = useState(initial.advanced);
  const [preset, setPreset] = useState<string | null>(initialPreset);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    engine.onStop = () => setPlaying(false);
  }, [engine]);

  // Persist the full state, debounced so a slider drag isn't 60 writes/second.
  useEffect(() => {
    const id = window.setTimeout(() => saveState({ params, advanced, preset }), 150);
    return () => window.clearTimeout(id);
  }, [params, advanced, preset]);

  const applyTimer = (minutes: number) => {
    if (minutes > 0) engine.scheduleFadeOut(minutes);
    else engine.cancelFadeOut();
  };

  const togglePlay = async () => {
    if (playing) {
      engine.stop();
      return;
    }
    await engine.start();
    setPlaying(true);
    applyTimer(params.timerMinutes);
  };

  const updateParam = (key: keyof GeneratorParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setPreset(null); // any manual nudge means it's no longer a named preset
  };

  const commitParam = (config: SliderConfig, value: number) => {
    config.apply(engine, value);
  };

  const changeTimer = (minutes: number) => {
    engine.setTimerMinutes(minutes);
    setParams((prev) => ({ ...prev, timerMinutes: minutes }));
    if (playing) applyTimer(minutes);
  };

  const choosePreset = (name: string) => {
    if (!(name in PRESETS)) {
      setPreset(null);
      return;
    }
    const merged: GeneratorParams = { ...params, ...PRESETS[name as PresetName] };
    engine.applyParams(merged);
    setParams(merged);
    setPreset(name);
  };

  const resetDefaults = () => {
    engine.applyParams(DEFAULT_PARAMS);
    setParams(DEFAULT_PARAMS);
    setPreset(null);
    if (playing) applyTimer(DEFAULT_PARAMS.timerMinutes);
  };

  const visibleSliders = SLIDER_CONFIGS.filter((config) => advanced || !config.advancedOnly);

  return (
    <main className={advanced ? "app advanced" : "app"}>
      <button
        className="play-stop"
        type="button"
        aria-pressed={playing}
        onClick={() => void togglePlay()}
      >
        {playing ? "Stop" : "Play"}
      </button>

      <div className="mode-toggle" role="group" aria-label="Control mode">
        <button type="button" className="mode-btn" aria-pressed={!advanced} onClick={() => setAdvanced(false)}>
          Simple
        </button>
        <button type="button" className="mode-btn" aria-pressed={advanced} onClick={() => setAdvanced(true)}>
          Advanced
        </button>
      </div>

      {advanced && <Spectrum engine={engine} active={advanced && playing} />}

      {advanced && (
        <label className="control">
          <span className="control__label">Preset</span>
          <select value={preset ?? ""} onChange={(event) => choosePreset(event.target.value)}>
            <option value="">Custom</option>
            {Object.keys(PRESETS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <span className="control__caption">
            A starting point — nudge any slider to make it your own.
          </span>
        </label>
      )}

      <div className="controls">
        {visibleSliders.map((config) => (
          <Slider
            key={config.key}
            config={config}
            value={params[config.key]}
            onInput={(value) => updateParam(config.key, value)}
            onCommit={(value) => commitParam(config, value)}
          />
        ))}

        <label className="control">
          <span className="control__label">Auto-off</span>
          <select value={params.timerMinutes} onChange={(event) => changeTimer(Number(event.target.value))}>
            <option value={0}>Off</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
          </select>
        </label>
      </div>

      <button type="button" className="reset-defaults" onClick={resetDefaults}>
        Reset to defaults
      </button>

      <p className="safety-hint">
        Keep the device well away from the crib and at a low volume — soft enough that you could
        comfortably hold a quiet conversation nearby.
      </p>

      <details className="evidence">
        <summary>Why these settings</summary>
        <div className="evidence__body">
          <p>
            <strong>Color.</strong> Broadband white noise is the classic infant trial: 80% of
            newborns fell asleep within five minutes with white noise versus 25% without
            (Spencer et al. 1990, <em>Arch Dis Child</em>). Neonates respond most strongly to
            broad-spectrum sound (fMEG study), and a 2025 fNIRS study found regular white-noise
            exposure during sleep measurably changes infant brain connectivity. A 2025 systematic
            review across maternal and neonatal care likewise found consistent benefits for
            sleep onset, stress, and pain. Pink noise's "deeper sleep" evidence is adult-only — it
            strengthens slow-wave sleep and next-day memory in older adults (Papalambros et al.
            2017) — and brown noise is not well studied in infants. So the recommended band is
            White–Pink, and Brown is offered but flagged as less studied.
          </p>
          <p>
            <strong>Volume.</strong> The AAP found some infant sound machines exceed 85 dB — the
            level at which workplace hearing protection is required — and the effects of loud,
            long-duration exposure on the developing brain are unknown. This app cannot measure real
            loudness, so keep the volume quiet enough to talk over and place the device well away
            from the crib.
          </p>
          <p>
            <strong>Consistency.</strong> A consistent bedtime routine — not any particular
            color — is what's linked to earlier sleep onset, fewer night wakings, and longer
            sleep duration in infants (Mindell et al.), so your settings are saved and restored
            automatically each session.
          </p>
          <p>
            <strong>Advanced controls.</strong> The Advanced panel (EQ, layer mix, modulation, presets) is for
            exploring — the science above still points to a quiet, steady, White–Pink sound.
          </p>
          <p className="evidence__sources">
            Sources:{" "}
            <a href="https://pubmed.ncbi.nlm.nih.gov/2405784/" target="_blank" rel="noopener noreferrer">
              Spencer 1990
            </a>{" "}
            ·{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3876038/" target="_blank" rel="noopener noreferrer">
              fMEG study
            </a>{" "}
            ·{" "}
            <a href="https://www.nature.com/articles/s41598-025-14774-7" target="_blank" rel="noopener noreferrer">
              fNIRS study
            </a>{" "}
            ·{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12818530/" target="_blank" rel="noopener noreferrer">
              2025 review
            </a>{" "}
            ·{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5340797/" target="_blank" rel="noopener noreferrer">
              Papalambros 2017
            </a>{" "}
            ·{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4402657/" target="_blank" rel="noopener noreferrer">
              Mindell bedtime routine
            </a>{" "}
            ·{" "}
            <a
              href="https://publications.aap.org/pediatrics/article/133/4/677/32749/Infant-Sleep-Machines-and-Hazardous-Sound-Pressure"
              target="_blank"
              rel="noopener noreferrer"
            >
              AAP
            </a>{" "}
            via{" "}
            <a
              href="https://www.consumerreports.org/babies-kids/bassinets/white-noise-for-babies-its-confusing-a3417127276/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consumer Reports
            </a>
            .
          </p>
        </div>
      </details>

      <p className="app-version">v{__APP_VERSION__}</p>
    </main>
  );
}
