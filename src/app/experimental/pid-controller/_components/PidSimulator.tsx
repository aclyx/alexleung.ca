"use client";

import { useMemo, useRef, useState } from "react";

import { actionClassNames } from "@/components/controlStyles";
import {
  DisclosureIndicator,
  disclosureSummaryClassNames,
} from "@/components/Disclosure";
import { PidGains, PLANT_PRESETS } from "@/features/pid-simulator/plants";
import {
  DEFAULT_CONFIG,
  simulate,
  SimulationConfig,
  SimulationResult,
} from "@/features/pid-simulator/simulation";
import { trackExperimentInteraction } from "@/lib/analytics";

import { ResponsePlayback } from "./ResponsePlayback";

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
type Snapshot = { config: SimulationConfig; response: SimulationResult };

export function PidSimulator() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
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
  const preset = PLANT_PRESETS.find((item) => item.plant.id === plant.id)!;

  function trackOnce(action: string) {
    if (trackedActions.current.has(action)) return;
    trackedActions.current.add(action);
    trackExperimentInteraction("pid-controller", action);
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
      format: (run) => seconds(run.riseTime),
      detail: "10–90% of requested step",
    },
    {
      label: "Overshoot",
      format: (run) => percent(run.overshoot),
      detail: "% of requested step",
    },
    {
      label: "Settling time",
      format: (run) => seconds(run.settlingTime),
      detail: "Within the 2% band",
    },
    {
      label: "Final error",
      format: (run) => `${Number(run.finalError.toFixed(3))} ${plant.unit}`,
      detail: "Target − output at 20 s",
    },
  ];

  return (
    <section
      aria-label="Interactive PID simulator"
      className="border-y border-line"
    >
      <div className="py-6">
        <div className="grid items-start gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
          <div>
            <label htmlFor="pid-plant" className="text-sm font-medium">
              Plant
            </label>
            <select
              id="pid-plant"
              value={plant.id}
              className="mt-2 block min-h-11 w-full rounded-sm border border-control-border bg-paper px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-link"
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
                trackOnce(`plant_${selected.plant.id}`);
              }}
            >
              {PLANT_PRESETS.map((item) => (
                <option key={item.plant.id} value={item.plant.id}>
                  {item.plant.name}
                </option>
              ))}
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
              y: {plant.unit} · u: {plant.controlUnit} ({plant.outputMin} to{" "}
              {plant.outputMax}) · t: seconds
              {plant.order === 2 ? " · v = dy/dt" : ""}
            </p>
          </div>
        </div>
      </div>
      <div className="grid border-t border-line">
        <div id="pid-response" className="min-w-0 py-6">
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
            <>
              <ResponsePlayback
                key={`${plant.id}-${config.kp}-${config.ki}-${config.kd}`}
                response={response}
                saved={snapshot?.response ?? null}
                plant={plant}
                onInteract={trackOnce}
              />
              {snapshot ? (
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Snapshot: Kp {snapshot.config.kp}, Ki {snapshot.config.ki}, Kd{" "}
                  {snapshot.config.kd}.
                </p>
              ) : null}
            </>
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
        <div className="border-t border-line py-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-editorial-heading">Controller</h2>
            <button
              type="button"
              className={actionClassNames({ variant: "quiet", size: "sm" })}
              onClick={() => {
                setConfig({
                  ...preset.controllers[1],
                  plant,
                });
                setSnapshot(null);
                trackOnce("reset_gains");
              }}
            >
              Reset gains
            </button>
          </div>
          <div
            role="group"
            aria-label="Controller presets"
            className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
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
          <div className="mt-6 grid gap-6 md:grid-cols-3 md:gap-8">
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
                    className="min-h-11 w-20 rounded-sm border border-control-border bg-paper px-2 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-link"
                  />
                </div>
                <input
                  id={`pid-${control.key}`}
                  type="range"
                  value={config[control.key]}
                  min={Math.min(0, config[control.key])}
                  max={Math.max(preset.gainMax, config[control.key])}
                  step="any"
                  onKeyDown={(event) => {
                    const direction =
                      event.key === "ArrowRight" || event.key === "ArrowUp"
                        ? 1
                        : event.key === "ArrowLeft" || event.key === "ArrowDown"
                          ? -1
                          : 0;
                    if (!direction) return;
                    event.preventDefault();
                    const input = event.currentTarget;
                    const next = Number(
                      (
                        config[control.key] +
                        direction * preset.gainStep
                      ).toFixed(10)
                    );
                    updateGain(
                      control.key,
                      Math.max(
                        Number(input.min),
                        Math.min(Number(input.max), next)
                      )
                    );
                  }}
                  onChange={(event) =>
                    updateGain(
                      control.key,
                      Number(Number(event.target.value).toFixed(3))
                    )
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
              className: "mt-4 md:hidden",
            })}
          >
            View response ↑
          </a>
        </div>
        {response ? (
          <div className="border-t border-line py-6">
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
            u = Kp·error + Ki·∫error dt − Kd·dy/dt. The derivative acts on
            measured output with a 0.1 s filter; anti-windup limits integral
            accumulation when the actuator saturates.
          </p>
          <p>
            Idealized models: no noise, delay, or tank overflow. The controller
            updates every 0.01 s; RK4 advances the plant between updates.
            Extreme gains can make fixed-step results unreliable. Drawings scale
            to each run. These presets are not tuning advice for real equipment.
          </p>
          <p>
            Settling requires staying within the 2% band through 20 s, for at
            least 1 s. Final error is rounded to three decimal places.
          </p>
        </div>
      </details>
    </section>
  );
}
