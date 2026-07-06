import { SimulationSample } from "@/features/pid-simulator/types";

type PidChartProps = {
  samples: SimulationSample[];
};

type LegendItem = {
  label: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  value: number;
};

const WIDTH = 880;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 48 };
const LEGEND_SWATCH_WIDTH = 28;
const LEGEND_SWATCH_HEIGHT = 10;

const toPath = (
  samples: SimulationSample[],
  readValue: (sample: SimulationSample) => number,
  scaleX: (value: number) => number,
  scaleY: (value: number) => number
): string =>
  samples
    .map((sample, index) => {
      const prefix = index === 0 ? "M" : "L";
      return `${prefix}${scaleX(sample.timeSeconds)} ${scaleY(readValue(sample))}`;
    })
    .join(" ");

export function PidChart({ samples }: PidChartProps) {
  if (samples.length < 2) {
    return (
      <figure className="rounded-lg border border-gray-700 bg-black/65 p-3">
        <figcaption
          className="text-body-sm mb-3 text-gray-200"
          role="img"
          aria-label="PID simulator response chart"
        >
          Response over time (collecting samples...)
        </figcaption>
      </figure>
    );
  }

  const minX = samples[0].timeSeconds;
  const maxX = samples.at(-1)?.timeSeconds ?? minX + 1;

  const values = samples.flatMap((sample) => [
    sample.setpoint,
    sample.processVariable,
    sample.controllerOutput,
    sample.error,
  ]);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const yPadding = Math.max((maxY - minY) * 0.1, 0.2);

  const xSpan = Math.max(maxX - minX, 1);
  const ySpan = Math.max(maxY - minY, 0.1) + yPadding * 2;

  const chartWidth = WIDTH - MARGIN.left - MARGIN.right;
  const chartHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const scaleX = (value: number): number =>
    MARGIN.left + ((value - minX) / xSpan) * chartWidth;
  const scaleY = (value: number): number =>
    MARGIN.top + ((maxY + yPadding - value) / ySpan) * chartHeight;

  const setpointPath = toPath(
    samples,
    (sample) => sample.setpoint,
    scaleX,
    scaleY
  );
  const pvPath = toPath(
    samples,
    (sample) => sample.processVariable,
    scaleX,
    scaleY
  );
  const outputPath = toPath(
    samples,
    (sample) => sample.controllerOutput,
    scaleX,
    scaleY
  );
  const errorPath = toPath(samples, (sample) => sample.error, scaleX, scaleY);
  const latestSample = samples.at(-1) ?? samples[0];
  const legendItems: ReadonlyArray<LegendItem> = [
    {
      label: "Setpoint",
      stroke: "#f59e0b",
      strokeWidth: 2,
      value: latestSample.setpoint,
    },
    {
      label: "Process variable",
      stroke: "#22d3ee",
      strokeWidth: 2,
      value: latestSample.processVariable,
    },
    {
      label: "Controller output",
      stroke: "#a78bfa",
      strokeWidth: 2,
      value: latestSample.controllerOutput,
    },
    {
      label: "Error",
      stroke: "#fb7185",
      strokeWidth: 1.5,
      strokeDasharray: "5 3",
      value: latestSample.error,
    },
  ];

  return (
    <figure className="rounded-lg border border-gray-700 bg-black/65 p-3">
      <figcaption className="text-body-sm mb-3 text-gray-200">
        Response over time (fixed-step simulation)
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="PID simulator response chart"
      >
        <line
          x1={MARGIN.left}
          y1={MARGIN.top + chartHeight}
          x2={MARGIN.left + chartWidth}
          y2={MARGIN.top + chartHeight}
          stroke="#4b5563"
          strokeWidth={1}
        />
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left}
          y2={MARGIN.top + chartHeight}
          stroke="#4b5563"
          strokeWidth={1}
        />

        <path d={setpointPath} stroke="#f59e0b" strokeWidth={2} fill="none" />
        <path d={pvPath} stroke="#22d3ee" strokeWidth={2} fill="none" />
        <path d={outputPath} stroke="#a78bfa" strokeWidth={2} fill="none" />
        <path
          d={errorPath}
          stroke="#fb7185"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          fill="none"
        />
      </svg>
      <div className="mt-3 grid gap-2 text-gray-300 sm:grid-cols-2 xl:grid-cols-4">
        {legendItems.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-gray-800 bg-gray-950/60 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <svg
                width={LEGEND_SWATCH_WIDTH}
                height={LEGEND_SWATCH_HEIGHT}
                viewBox={`0 0 ${LEGEND_SWATCH_WIDTH} ${LEGEND_SWATCH_HEIGHT}`}
                aria-hidden="true"
                className="shrink-0"
              >
                <line
                  x1={1}
                  y1={LEGEND_SWATCH_HEIGHT / 2}
                  x2={LEGEND_SWATCH_WIDTH - 1}
                  y2={LEGEND_SWATCH_HEIGHT / 2}
                  stroke={item.stroke}
                  strokeWidth={item.strokeWidth}
                  strokeDasharray={item.strokeDasharray}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-body-sm leading-snug">{item.label}</span>
            </div>
            <span className="mt-1 block pl-9 text-body-sm font-mono text-gray-100">
              {item.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
