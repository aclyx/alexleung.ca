import { useEffect, useRef, useState } from "react";

import { actionClassNames } from "@/components/controlStyles";
import { Plant } from "@/features/pid-simulator/plants";
import {
  DURATION,
  SimulationResult,
} from "@/features/pid-simulator/simulation";

import { PhysicalPlant } from "./PhysicalPlant";
import { ResponseChart } from "./ResponseChart";

export function ResponsePlayback({
  plant,
  response,
  saved,
  onInteract,
}: {
  plant: Plant;
  response: SimulationResult;
  saved: SimulationResult | null;
  onInteract: (action: string) => void;
}) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const elapsed = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let frame: number;
    let previous: number | null = null;
    function tick(now: number) {
      // A background tab must not skip the rest of the demonstration on return.
      if (previous !== null)
        elapsed.current = Math.min(
          DURATION,
          elapsed.current + Math.min((now - previous) / 1000, 0.1)
        );
      previous = now;
      setTime(elapsed.current);
      if (elapsed.current >= DURATION) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const sample =
    response.samples[
      Math.round((time / DURATION) * (response.samples.length - 1))
    ];

  return (
    <div className="mt-5">
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-8">
        <PhysicalPlant plant={plant} sample={sample} response={response} />
        <figure className="min-w-0">
          <div
            className="mb-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"
            aria-hidden="true"
          >
            <span className="flex items-center gap-2">
              <span className="w-5 border-t-[3px] border-accent-link" />
              Output ({plant.unit})
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 border-t-2 border-dashed border-ink" />
              Target
            </span>
            {saved ? (
              <span className="flex items-center gap-2">
                <span className="w-5 border-t-2 border-dotted border-muted" />
                Snapshot
              </span>
            ) : null}
          </div>
          <ResponseChart
            response={response}
            saved={saved}
            plant={plant}
            sample={sample}
          />
          <figcaption className="mt-2 text-xs leading-relaxed text-muted">
            The dot and physical view show the same instant. Dashed lines mark
            the target.
          </figcaption>
        </figure>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
        <button
          type="button"
          className={actionClassNames({
            variant: "secondary",
            size: "sm",
            className: "min-w-24",
          })}
          onClick={() => {
            if (playing) setPlaying(false);
            else {
              if (elapsed.current >= DURATION) {
                elapsed.current = 0;
                setTime(0);
              }
              setPlaying(true);
              onInteract("play_response");
            }
          }}
        >
          {playing ? "Pause" : time >= DURATION ? "Replay" : "Play"}
        </button>
        <label htmlFor="pid-time" className="text-sm">
          Time
        </label>
        <span
          className="font-mono text-sm tabular-nums"
          data-testid="playback-time"
        >
          {sample.time.toFixed(2)} / 20 s
        </span>
        <input
          id="pid-time"
          type="range"
          min="0"
          max={DURATION}
          step="0.01"
          value={time}
          aria-valuetext={`${sample.time.toFixed(2)} seconds`}
          className="h-11 w-full min-w-0 cursor-pointer accent-accent-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-link sm:w-auto sm:flex-1"
          onChange={(event) => {
            setPlaying(false);
            elapsed.current = Number(event.target.value);
            setTime(elapsed.current);
            onInteract("scrub_response");
          }}
        />
      </div>
    </div>
  );
}
