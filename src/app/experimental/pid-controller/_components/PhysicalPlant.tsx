import { useId, useMemo } from "react";

import { Plant } from "@/features/pid-simulator/plants";
import {
  ResponseSample,
  SimulationResult,
} from "@/features/pid-simulator/simulation";

const format = (value: number) => Number(value.toPrecision(3)).toString();

export function PhysicalPlant({
  plant,
  sample,
  response,
}: {
  plant: Plant;
  sample: ResponseSample;
  response: SimulationResult;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const range = useMemo(() => {
    const values = response.samples.map(({ value }) => value);
    return {
      low: Math.min(plant.initialValue, plant.target, ...values),
      high: Math.max(plant.initialValue, plant.target, ...values),
    };
  }, [plant, response]);
  const fraction = (value: number) =>
    (value - range.low) / Math.max(range.high - range.low, 1);
  const position = (value: number) => 125 + fraction(value) * 180;
  const mass = position(sample.value);
  const coilEnd = mass - 30;
  const spring = Array.from(
    { length: 13 },
    (_, i) =>
      `${35 + (i / 12) * (coilEnd - 35)},${i === 0 || i === 12 ? 105 : i % 2 ? 95 : 115}`
  ).join(" ");
  const tankScale = Math.max(plant.target * 1.4, range.high * 1.1);
  const level = (value: number) => 190 - (Math.max(0, value) / tankScale) * 140;
  const temperature = (value: number) => 185 - fraction(value) * 130;
  const outputLabel =
    plant.id === "spring"
      ? "Position"
      : plant.id === "tank"
        ? "Water level"
        : "Temperature";
  const inputLabel =
    plant.id === "spring"
      ? "Force"
      : plant.id === "tank"
        ? "Pump flow"
        : "Heating / cooling";

  return (
    <figure className="min-w-0">
      <h3 className="text-sm font-medium">{plant.name}</h3>
      <svg
        viewBox="0 0 360 240"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="mx-auto block w-full max-w-sm"
        data-testid="physical-plant"
        data-plant={plant.id}
      >
        <title id={titleId}>Physical view · {plant.name}</title>
        <desc id={descriptionId}>
          {outputLabel}: {format(sample.value)} {plant.unit} at{" "}
          {sample.time.toFixed(2)} seconds. Target: {plant.target} {plant.unit}.{" "}
          {inputLabel}: {format(sample.control)} {plant.controlUnit}. The dashed
          marker shows the target. The drawing uses the same samples as the
          response curve.
        </desc>
        {plant.id === "spring" ? (
          <>
            <path
              d="M25 65 V160 H340 M25 105 H35"
              fill="none"
              className="stroke-control-border"
              strokeWidth="2"
            />
            <line
              x1={position(plant.target)}
              x2={position(plant.target)}
              y1="50"
              y2="175"
              className="stroke-ink"
              strokeDasharray="5 4"
            />
            <text
              x={position(plant.target)}
              y="36"
              textAnchor="middle"
              className="fill-muted text-[16px] lg:text-xs"
            >
              Target {plant.target} m
            </text>
            <polyline
              points={spring}
              fill="none"
              className="stroke-muted"
              strokeWidth="2"
            />
            <path
              d={`M25 133 H55 M55 125 V141 H80 V125 Z M65 129 V137 M65 133 H${coilEnd}`}
              fill="none"
              className="stroke-muted"
              strokeWidth="2"
            />
            <g transform={`translate(${mass}, 0)`} data-testid="plant-mass">
              <rect
                x="-28"
                y="80"
                width="56"
                height="65"
                rx="3"
                className="fill-accent-secondary-soft stroke-accent-link"
                strokeWidth="2"
              />
              <text
                x="0"
                y="117"
                textAnchor="middle"
                className="fill-ink text-[18px] lg:text-sm"
              >
                1 kg
              </text>
              <circle
                cx="-17"
                cy="153"
                r="6"
                className="fill-paper stroke-muted"
                strokeWidth="2"
              />
              <circle
                cx="17"
                cy="153"
                r="6"
                className="fill-paper stroke-muted"
                strokeWidth="2"
              />
              {Math.abs(sample.control) > 0.01 ? (
                <path
                  d={`M0 65 h${Math.sign(sample.control) * 28} l${-Math.sign(sample.control) * 7} -5 m0 10 l${Math.sign(sample.control) * 7} -5`}
                  fill="none"
                  className="stroke-accent-link"
                  strokeWidth="2"
                />
              ) : null}
            </g>
            <text
              x={position(0)}
              y="190"
              textAnchor="middle"
              className="fill-muted text-[16px] lg:text-xs"
            >
              0 m
            </text>
            <text
              x="180"
              y="221"
              textAnchor="middle"
              className="fill-muted text-[16px] lg:text-xs"
            >
              Spring 1 N/m · damping 0.6 N·s/m
            </text>
          </>
        ) : plant.id === "tank" ? (
          <>
            <path
              d="M35 66 V35 H125 V55"
              fill="none"
              className="stroke-control-border"
              strokeWidth="5"
            />
            {sample.control > 0.001 ? (
              <path
                d={`M125 55 V${Math.max(60, level(sample.value))}`}
                className="stroke-accent-link"
                strokeWidth={1 + 5 * sample.control}
              />
            ) : null}
            <circle
              cx="35"
              cy="81"
              r="15"
              className="fill-paper stroke-control-border"
              strokeWidth="2"
            />
            <path d="m29 86 6-12 6 12Z" className="fill-accent-link" />
            <rect
              x="86"
              y={level(sample.value)}
              width="168"
              height={190 - level(sample.value)}
              className="fill-accent-secondary-soft"
            />
            <line
              x1="86"
              x2="254"
              y1={level(sample.value)}
              y2={level(sample.value)}
              className="stroke-accent-link"
              strokeWidth="2"
              data-testid="plant-waterline"
            />
            <path
              d="M85 45 V191 H255 V45 M255 190 H293 V204"
              fill="none"
              className="stroke-control-border"
              strokeWidth="2"
            />
            {sample.value > 0.001 ? (
              <path
                d="M257 190 H293 V211"
                fill="none"
                className="stroke-accent-link"
                strokeWidth={Math.min(6, 1 + 2 * Math.sqrt(sample.value))}
              />
            ) : null}
            <line
              x1="76"
              x2="265"
              y1={level(plant.target)}
              y2={level(plant.target)}
              className="stroke-ink"
              strokeDasharray="5 4"
            />
            <text
              x="270"
              y={level(plant.target) + 4}
              className="fill-muted text-[16px] lg:text-xs"
            >
              {plant.target} m
            </text>
            <text
              x="170"
              y="221"
              textAnchor="middle"
              className="fill-muted text-[16px] lg:text-xs"
            >
              1 m² area · scale {format(tankScale)} m
            </text>
          </>
        ) : (
          <>
            <rect
              x="55"
              y="75"
              width="160"
              height="90"
              rx="5"
              className="fill-accent-secondary-soft stroke-control-border"
              strokeWidth="2"
            />
            <rect
              x="56"
              y="76"
              width="158"
              height="88"
              rx="4"
              className="fill-accent-link"
              opacity={0.08 + fraction(sample.value) * 0.45}
              data-testid="plant-temperature"
            />
            <path
              d="M80 147 V95 H107 V147 H134 V95 H161 V147 H188 V95"
              fill="none"
              className="stroke-ink"
              strokeWidth="2"
            />
            <path
              d="M265 45 V185"
              className="stroke-line"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d={`M265 185 V${temperature(sample.value)}`}
              className="stroke-accent-link"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="265" cy="185" r="10" className="fill-accent-link" />
            <line
              x1="245"
              x2="285"
              y1={temperature(plant.target)}
              y2={temperature(plant.target)}
              className="stroke-ink"
              strokeDasharray="5 4"
            />
            <text
              x="290"
              y={temperature(plant.target) + 4}
              className="fill-muted text-[16px] lg:text-xs"
            >
              {plant.target}°C
            </text>
            <text
              x="135"
              y="57"
              textAnchor="middle"
              className="fill-muted text-[16px] lg:text-xs"
            >
              Metal plate · 20 J/K
            </text>
            <text
              x="180"
              y="221"
              textAnchor="middle"
              className="fill-muted text-[16px] lg:text-xs"
            >
              20°C room · heat loss 10 W/K
            </text>
          </>
        )}
      </svg>
      <figcaption className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs text-muted">
        <span>
          {outputLabel}
          <span
            className="mt-1 block font-mono text-sm tabular-nums text-ink"
            data-testid="plant-output"
          >
            {format(sample.value)} {plant.unit}
          </span>
        </span>
        <span>
          {inputLabel}
          <span
            className="mt-1 block font-mono text-sm tabular-nums text-ink"
            data-testid="plant-input"
          >
            {format(sample.control)} {plant.controlUnit}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
