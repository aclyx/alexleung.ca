"use client";

import { useMemo, useRef, useState } from "react";

import { actionClassNames } from "@/components/controlStyles";
import {
  DisclosureIndicator,
  disclosureSummaryClassNames,
} from "@/components/Disclosure";
import {
  PidGains,
  Plant,
  PLANT_PRESETS,
} from "@/features/pid-simulator/plants";
import {
  DEFAULT_CONFIG,
  simulate,
  SimulationConfig,
  SimulationResult,
} from "@/features/pid-simulator/simulation";
import { trackExperimentInteraction } from "@/lib/analytics";

import { PlantEditor } from "./PlantEditor";
import { ResponseChart } from "./ResponseChart";

const gainControls: readonly {
  key: keyof PidGains;
  label: string;
  symbol: string;
  description: string;
}[] = [
  {
    key: "kp",
    label: "Proportional",
    symbol: "Kp",
    description: "Reacts to the current error.",
  },
  {
    key: "ki",
    label: "Integral",
    symbol: "Ki",
    description: "Accumulates error to remove an offset.",
  },
  {
    key: "kd",
    label: "Derivative",
    symbol: "Kd",
    description: "Opposes rapid output changes.",
  },
];
const seconds = (value: number | null) =>
  value === null ? "Not reached" : `${value.toFixed(2)} s`;
const percent = (value: number | null) =>
  value === null ? "No step" : `${value.toFixed(1)}%`;
const number = (value: number) => Number(value.toPrecision(4)).toString();
type Snapshot = { config: SimulationConfig; response: SimulationResult };

export function PidSimulator() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [plantRevision, setPlantRevision] = useState(0);
  const trackedActions = useRef(new Set<string>());
  const result = useMemo(() => {
    try {
      return { response: simulate(config), error: null };
    } catch (cause) {
      return {
        response: null,
        error:
          cause instanceof Error
            ? cause.message
            : "Unable to simulate this plant.",
      };
    }
  }, [config]);
  const { response, error } = result;
  const { plant } = config;
  const preset = PLANT_PRESETS.find((item) => item.plant.id === plant.id);

  function trackOnce(action: string) {
    if (trackedActions.current.has(action)) return;
    trackedActions.current.add(action);
    trackExperimentInteraction("pid-controller", action);
  }
  function applyPlant(next: Plant) {
    setConfig({ ...config, plant: next });
    setSnapshot(null);
    setPlantRevision((revision) => revision + 1);
    trackOnce("apply_custom_plant");
  }
  function updateGain(key: keyof PidGains, value: number) {
    if (
      !Number.isFinite(value) ||
      Math.abs(value) > 1000 ||
      config[key] === value
    )
      return;
    setConfig({ ...config, [key]: value });
    trackOnce(`adjust_${key}`);
  }
  const metrics: {
    label: string;
    format: (run: SimulationResult) => string;
    detail: string;
  }[] = [
    {
      label: "Rise time",
      format: (run) =>
        plant.target === plant.initialValue ? "No step" : seconds(run.riseTime),
      detail: "10–90% of requested step",
    },
    {
      label: "Overshoot",
      format: (run) => percent(run.overshoot),
      detail: "% of requested step",
    },
    {
      label: "Settling time",
      format: (run) =>
        plant.target === plant.initialValue
          ? "No step"
          : seconds(run.settlingTime),
      detail: "Within the 2% band",
    },
    {
      label: "Final error",
      format: (run) => `${number(run.finalError)} ${plant.unit}`.trim(),
      detail: "Target − output at 20 s",
    },
  ];

  return (
    <section
      aria-label="Interactive PID simulator"
      className="border-y border-line"
    >
      <div className="pt-6">
        <div className="grid items-start gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
          <div>
            <label htmlFor="pid-plant" className="text-sm font-medium">
              Plant
            </label>
            <select
              id="pid-plant"
              value={plant.id}
              className="mt-2 block min-h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-link"
              onChange={(event) => {
                const selected = PLANT_PRESETS.find(
                  (item) => item.plant.id === event.target.value
                );
                if (!selected) return;
                setConfig({
                  ...selected.controllers[1],
                  plant: selected.plant,
                });
                setSnapshot(null);
                setPlantRevision((revision) => revision + 1);
                trackOnce(`plant_${selected.plant.id}`);
              }}
            >
              {PLANT_PRESETS.map((item) => (
                <option key={item.plant.id} value={item.plant.id}>
                  {item.plant.name}
                </option>
              ))}
              {plant.id === "custom" ? (
                <option value="custom">Custom plant</option>
              ) : null}
            </select>
          </div>
          <div>
            <p className="text-sm leading-relaxed text-muted">
              {plant.description}
            </p>
            <p className="mt-2 break-words font-mono text-sm">
              {plant.order === 1 ? "dy/dt" : "d²y/dt²"} = {plant.equation}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              y: {plant.unit || "output"} · u: {plant.controlUnit || "input"} (
              {plant.outputMin} to {plant.outputMax}) · t: seconds
              {plant.order === 2 ? " · v = dy/dt" : ""}
            </p>
          </div>
        </div>
        <PlantEditor key={plantRevision} plant={plant} onApply={applyPlant} />
      </div>
      <div className="grid border-t border-line lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div id="pid-response" className="min-w-0 py-6 lg:pr-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-editorial-heading">Step response</h2>
            <p className="font-mono text-xs text-muted">
              {plant.initialValue} → {plant.target} {plant.unit} · 20 seconds
            </p>
          </div>
          {error ? (
            <p
              role="alert"
              className="mt-5 border-l-2 border-ink pl-4 text-sm leading-relaxed"
            >
              {error}
            </p>
          ) : null}
          {response ? (
            <figure className="mt-5">
              <div
                className="mb-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"
                aria-hidden="true"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 border-t-[3px] border-accent-link" />
                  Output{plant.unit ? ` (${plant.unit})` : ""}
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-5 border-t-2 border-dashed border-ink" />
                  Target
                </span>
                {snapshot ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 border-t-2 border-dotted border-muted" />
                    Snapshot
                  </span>
                ) : null}
              </div>
              <ResponseChart
                response={response}
                saved={snapshot?.response ?? null}
                plant={plant}
              />
              <figcaption className="mt-2 text-sm leading-relaxed text-muted">
                {snapshot
                  ? `Snapshot: Kp ${snapshot.config.kp}, Ki ${snapshot.config.ki}, Kd ${snapshot.config.kd}.`
                  : "Take a snapshot, then change the gains to compare."}
              </figcaption>
            </figure>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!response}
              className={actionClassNames({ variant: "secondary", size: "sm" })}
              onClick={() => {
                if (!response) return;
                setSnapshot({ config, response });
                trackOnce("take_snapshot");
              }}
            >
              {snapshot ? "Update snapshot" : "Take snapshot"}
            </button>
            {snapshot ? (
              <button
                type="button"
                className={actionClassNames({ variant: "quiet", size: "sm" })}
                onClick={() => setSnapshot(null)}
              >
                Clear snapshot
              </button>
            ) : null}
          </div>
        </div>
        <div className="border-t border-line py-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l lg:pl-7">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-editorial-heading">Controller</h2>
            <button
              type="button"
              className={actionClassNames({ variant: "quiet", size: "sm" })}
              onClick={() => {
                setConfig({
                  ...(preset?.controllers[1] ?? { kp: 1, ki: 0, kd: 0 }),
                  plant,
                });
                setSnapshot(null);
                trackOnce("reset_gains");
              }}
            >
              Reset gains
            </button>
          </div>
          {preset ? (
            <div
              role="group"
              aria-label="Controller presets"
              className="mt-3 grid grid-cols-2 gap-2"
            >
              {preset.controllers.map((controller) => (
                <button
                  type="button"
                  key={controller.name}
                  aria-pressed={gainControls.every(
                    ({ key }) => config[key] === controller[key]
                  )}
                  className={actionClassNames({
                    variant: "secondary",
                    size: "sm",
                    className:
                      "min-w-11 aria-pressed:border-accent-link aria-pressed:bg-accent-secondary-soft aria-pressed:text-accent-link",
                  })}
                  onClick={() => {
                    setConfig({ ...controller, plant });
                    trackOnce(
                      `preset_${controller.name.toLowerCase().replaceAll(" ", "_")}`
                    );
                  }}
                >
                  {controller.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Tune the gains for your equation. Negative gains support
              reverse-acting plants.
            </p>
          )}
          <div className="mt-6 space-y-5">
            {gainControls.map((control) => (
              <div key={control.key}>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`pid-${control.key}`}
                    className="text-sm font-medium"
                  >
                    {control.label} · {control.symbol}
                  </label>
                  <input
                    type="number"
                    aria-label={`${control.symbol} value`}
                    key={config[control.key]}
                    defaultValue={config[control.key]}
                    min={-1000}
                    max={1000}
                    step="any"
                    title="Press Enter or leave the field to apply"
                    onBlur={(event) => {
                      const input = event.currentTarget;
                      if (
                        !Number.isFinite(input.valueAsNumber) ||
                        !input.checkValidity()
                      ) {
                        input.value = String(config[control.key]);
                        return;
                      }
                      updateGain(control.key, input.valueAsNumber);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    className="min-h-11 w-20 rounded-sm border border-line bg-paper px-2 font-mono text-sm"
                  />
                </div>
                <input
                  id={`pid-${control.key}`}
                  type="range"
                  value={config[control.key]}
                  min={Math.min(preset ? 0 : -100, config[control.key])}
                  max={Math.max(preset?.gainMax ?? 100, config[control.key])}
                  step={preset?.gainStep ?? 0.05}
                  onChange={(event) =>
                    updateGain(control.key, Number(event.target.value))
                  }
                  aria-describedby={`pid-${control.key}-help`}
                  className="block h-11 w-full cursor-pointer accent-accent-link focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-link"
                />
                <p
                  id={`pid-${control.key}-help`}
                  className="text-sm leading-relaxed text-muted"
                >
                  {control.description}
                </p>
              </div>
            ))}
          </div>
          <a
            href="#pid-response"
            className={actionClassNames({
              variant: "quiet",
              size: "sm",
              className: "mt-4 lg:hidden",
            })}
          >
            View response ↑
          </a>
        </div>
        {response ? (
          <div className="border-t border-line py-6 lg:col-start-1 lg:row-start-2 lg:mr-8">
            <dl
              aria-label="Response metrics"
              className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4"
            >
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs text-muted">{metric.label}</dt>
                  <dd className="mt-2 font-mono text-sm tabular-nums text-ink">
                    {metric.format(response)}
                  </dd>
                  {snapshot ? (
                    <dd className="mt-1 font-mono text-xs text-muted">
                      Snapshot: {metric.format(snapshot.response)}
                    </dd>
                  ) : null}
                  <dd className="mt-1 text-xs leading-relaxed text-muted">
                    {metric.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
      <details className="group border-t border-line">
        <summary className={disclosureSummaryClassNames({ className: "px-0" })}>
          Model & measurement notes
          <DisclosureIndicator />
        </summary>
        <div className="space-y-2 pb-5 text-sm leading-relaxed text-muted">
          <p>
            The controller uses u = Kp·error + Ki·∫error dt − Kd·dy/dt, with a
            0.1 s derivative filter and conditional anti-windup at the input
            limits.
          </p>
          <p>
            The plant runs for 20 s with a fixed 0.01 s RK4 step. No noise or
            delay is added. Very fast or stiff systems may need a smaller step
            than this tool supports.
          </p>
          <p>
            Settling means staying within 2% of the requested step for the rest
            of the run, for at least 1 s. Rise time, overshoot, and settling do
            not apply when the target equals the initial output.
          </p>
        </div>
      </details>
    </section>
  );
}
