import { useEffect, useRef } from "react";
import AudioMotionAnalyzer from "audiomotion-analyzer";
import type { NoiseEngine } from "../audio";

interface Props {
  engine: NoiseEngine;
  active: boolean; // Advanced mode + playing — only then is there a signal to analyse
}

// The live spectrum, rendered by audioMotion-analyzer. It reuses the engine's
// AudioContext and taps the engine's analyser node, so it shares one audio graph
// with Tone.js rather than routing sound of its own (connectSpeakers: false).
export function Spectrum({ engine, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = engine.getAnalyserSource();
    const container = containerRef.current;
    if (!active || !source || !container) return;

    const analyzer = new AudioMotionAnalyzer(container, {
      audioCtx: source.context,
      source: source.node,
      connectSpeakers: false,
      mode: 5, // 1/4-octave bands
      frequencyScale: "log",
      minFreq: 20,
      maxFreq: 20000,
      barSpace: 0.25,
      smoothing: 0.72,
      showScaleX: true,
      showScaleY: false,
      showPeaks: true,
      overlay: true,
      showBgColor: false,
    });
    analyzer.registerGradient("sleep", {
      dir: "h", // color by frequency: warm/brown low → bright/near-white high
      colorStops: [
        { pos: 0, color: "#a9713b" },
        { pos: 0.5, color: "#d69a52" },
        { pos: 1, color: "#ece4d6" },
      ],
    });
    analyzer.gradient = "sleep";

    return () => analyzer.destroy();
  }, [engine, active]);

  return <div ref={containerRef} className="spectrum" />;
}
