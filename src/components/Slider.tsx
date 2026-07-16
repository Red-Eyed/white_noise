import type { ChangeEvent, KeyboardEvent, PointerEvent } from "react";
import type { SliderConfig } from "../sliders";

interface Props {
  config: SliderConfig;
  value: number; // the parameter value (not the slider position)
  onInput: (value: number) => void; // every tick — updates state, readout, position
  onCommit: (value: number) => void; // applies to the engine
}

// A labeled range slider. Live sliders commit on every input; non-live ones
// (colors, which rebuild a buffer) update the readout live but only commit to the
// engine on release, read straight off the input so the value is never stale.
export function Slider({ config, value, onInput, onCommit }: Props) {
  const { map, sliderMin, sliderMax, sliderStep, format, live, label, caption, scale } = config;

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const next = map.toValue(Number(event.target.value));
    onInput(next);
    if (live) onCommit(next);
  };

  const handleRelease = (event: PointerEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>) => {
    if (live) return;
    onCommit(map.toValue(Number(event.currentTarget.value)));
  };

  return (
    <label className="control">
      <span className="control__label">
        {label} <span className="control__value">{format(value)}</span>
      </span>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={map.toRaw(value)}
        onChange={handleInput}
        onPointerUp={handleRelease}
        onKeyUp={handleRelease}
      />
      {scale && (
        <span className="control__scale" aria-hidden="true">
          {scale.map((mark) => (
            <span key={mark}>{mark}</span>
          ))}
        </span>
      )}
      {caption && <span className="control__caption">{caption}</span>}
    </label>
  );
}
