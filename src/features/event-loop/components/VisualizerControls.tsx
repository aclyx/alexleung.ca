type VisualizerControlsProps = {
  isPlaying: boolean;
  isComplete: boolean;
  speedMs: number;
  onPlayPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speedMs: number) => void;
};

const SPEED_OPTIONS = [
  { label: "Slow", value: 1000 },
  { label: "Normal", value: 600 },
  { label: "Fast", value: 300 },
];

const controlButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors";

export function VisualizerControls({
  isPlaying,
  isComplete,
  speedMs,
  onPlayPause,
  onStep,
  onReset,
  onSpeedChange,
}: VisualizerControlsProps) {
  return (
    <section className="rounded-lg border border-gray-700 bg-gray-900/70 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-200">
        Controls
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`${controlButtonClassName} border-sky-500 text-sky-100 hover:bg-sky-900/50 disabled:opacity-40`}
          onClick={onPlayPause}
          disabled={isComplete}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className={`${controlButtonClassName} border-gray-500 text-white hover:bg-gray-800 disabled:opacity-40`}
          onClick={onStep}
          disabled={isComplete}
        >
          Step forward
        </button>
        <button
          type="button"
          className={`${controlButtonClassName} border-gray-500 text-white hover:bg-gray-800`}
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-medium text-gray-300">
          Playback speed
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`inline-flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors ${
                speedMs === option.value
                  ? "border-emerald-400 bg-emerald-900/30 text-emerald-100"
                  : "border-gray-600 text-gray-200 hover:bg-gray-800"
              }`}
              onClick={() => onSpeedChange(option.value)}
              aria-pressed={speedMs === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
