import { useId, useMemo } from "react";

import { Plant } from "@/features/pid-simulator/plants";
import {
  DURATION,
  ResponseSample,
  SimulationResult,
} from "@/features/pid-simulator/simulation";

export function ResponseChart({
  response,
  saved,
  plant,
  sample,
}: {
  response: SimulationResult;
  saved: SimulationResult | null;
  plant: Plant;
  sample: ResponseSample;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const width = 640,
    height = 320,
    left = 75,
    right = 16,
    top = 20,
    bottom = 36;
  const { minimum, maximum, tickStep, x, y, currentPath, savedPath } =
    useMemo(() => {
      const values = [
        plant.target,
        ...response.samples.map((sample) => sample.value),
        ...(saved?.samples.map((sample) => sample.value) ?? []),
      ];
      const low = Math.min(...values),
        high = Math.max(...values);
      const span = Math.max(
        high - low || Math.max(1, Math.abs(high) * 0.1),
        1e-12
      );
      const roughStep = (span * 1.1) / 4;
      const magnitude = 10 ** Math.floor(Math.log10(roughStep));
      const tickStep =
        ([1, 2, 5, 10].find((factor) => factor * magnitude >= roughStep) ??
          10) * magnitude;
      const minimum = Math.floor((low - span * 0.05) / tickStep) * tickStep;
      const maximum = Math.ceil((high + span * 0.05) / tickStep) * tickStep;
      const x = (time: number) =>
        left + (time / DURATION) * (width - left - right);
      const y = (value: number) =>
        height -
        bottom -
        ((value - minimum) / (maximum - minimum)) * (height - top - bottom);
      const path = (samples: ResponseSample[]) =>
        samples
          .map(
            (sample, index) =>
              `${index === 0 ? "M" : "L"}${x(sample.time).toFixed(2)},${y(sample.value).toFixed(2)}`
          )
          .join(" ");
      return {
        minimum,
        maximum,
        tickStep,
        x,
        y,
        currentPath: path(response.samples),
        savedPath: saved ? path(saved.samples) : null,
      };
    }, [plant, response, saved]);
  const format = (value: number) => Number(value.toPrecision(3)).toString();
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      className="block w-full overflow-visible"
    >
      <title id={titleId}>PID step response · {plant.name}</title>
      <desc id={descriptionId}>
        Output over 20 seconds, starting at {plant.initialValue} {plant.unit}.
        The target is {plant.target} {plant.unit}. The current response ends at{" "}
        {format(response.samples.at(-1)!.value)} {plant.unit}.
        {saved ? " A dotted line shows the snapshot." : ""} Response metrics are
        listed below the chart.
      </desc>
      {Array.from(
        { length: Math.round((maximum - minimum) / tickStep) + 1 },
        (_, tick) => {
          const value = minimum + tick * tickStep;
          return (
            <g key={tick}>
              <line
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
                className="stroke-line"
              />
              <text
                x={left - 10}
                y={y(value) + 4}
                textAnchor="end"
                className="fill-muted font-mono text-[22px] lg:text-[14px]"
              >
                {format(value)}
              </text>
            </g>
          );
        }
      )}
      {[0, 5, 10, 15, 20].map((time) => (
        <text
          key={time}
          x={x(time)}
          y={height - 10}
          textAnchor={time === 20 ? "end" : time === 0 ? "start" : "middle"}
          className="fill-muted font-mono text-[22px] lg:text-[14px]"
        >
          {time}s
        </text>
      ))}
      <line
        x1={left}
        x2={width - right}
        y1={y(plant.target)}
        y2={y(plant.target)}
        className="stroke-ink"
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />
      {saved ? (
        <path
          d={savedPath!}
          fill="none"
          className="stroke-muted"
          strokeWidth="2.5"
          strokeDasharray="2 5"
        />
      ) : null}
      <path
        data-testid="pid-response-curve"
        d={currentPath}
        fill="none"
        className="stroke-accent-link"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line
        x1={x(sample.time)}
        x2={x(sample.time)}
        y1={top}
        y2={height - bottom}
        className="stroke-control-border"
        strokeDasharray="3 4"
      />
      <circle
        data-testid="response-playhead"
        data-time={sample.time}
        data-value={sample.value}
        cx={x(sample.time)}
        cy={y(sample.value)}
        r="5"
        className="fill-accent-link stroke-paper"
        strokeWidth="2"
      />
    </svg>
  );
}
