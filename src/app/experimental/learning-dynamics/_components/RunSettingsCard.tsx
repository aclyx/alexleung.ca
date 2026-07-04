"use client";

import { OptimizerId, RunConfig } from "@/features/optimizer-lab/types";

const OPTIMIZER_OPTIONS: ReadonlyArray<{
  id: OptimizerId;
  label: string;
}> = [
  { id: "sgd", label: "SGD" },
  { id: "momentum", label: "Momentum" },
  { id: "rmsprop", label: "RMSProp" },
  { id: "adam", label: "Adam" },
];

function isOptimizerId(value: string): value is OptimizerId {
  return OPTIMIZER_OPTIONS.some((option) => option.id === value);
}

const fieldClassName =
  "min-h-11 rounded-md border border-white/12 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-300";

type RunSettingsCardProps = {
  config: RunConfig;
  onChange: (patch: Partial<RunConfig>) => void;
};

type NumberFieldProps = {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (nextValue: number) => void;
};

function NumberField({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-200">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        className={fieldClassName}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function RunSettingsCard({ config, onChange }: RunSettingsCardProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <div>
            <h3 className="text-heading-sm text-white">{config.label}</h3>
            <p className="text-sm text-slate-400">
              Configure and compare this trajectory.
            </p>
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            className="size-5"
            checked={config.enabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
          />
          Enabled
        </label>
      </div>

      <div className="mt-4 space-y-4">
        <label className="flex flex-col gap-1 text-sm text-slate-200">
          <span>{config.label} optimizer</span>
          <select
            value={config.optimizerId}
            className={fieldClassName}
            onChange={(event) => {
              const optimizerId = event.target.value;

              if (!isOptimizerId(optimizerId)) {
                return;
              }

              onChange({ optimizerId });
            }}
          >
            {OPTIMIZER_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label={`${config.label} learning rate`}
            value={config.learningRate}
            step={0.01}
            min={0}
            onChange={(learningRate) => onChange({ learningRate })}
          />

          {config.optimizerId === "momentum" ? (
            <NumberField
              label={`${config.label} momentum`}
              value={config.momentum}
              step={0.01}
              min={0}
              max={0.999}
              onChange={(momentum) => onChange({ momentum })}
            />
          ) : null}

          {config.optimizerId === "rmsprop" ? (
            <>
              <NumberField
                label={`${config.label} decay`}
                value={config.beta2}
                step={0.01}
                min={0}
                max={0.999}
                onChange={(beta2) => onChange({ beta2 })}
              />
              <NumberField
                label={`${config.label} epsilon`}
                value={config.epsilon}
                step={0.000001}
                min={0.000001}
                onChange={(epsilon) => onChange({ epsilon })}
              />
            </>
          ) : null}

          {config.optimizerId === "adam" ? (
            <>
              <NumberField
                label={`${config.label} beta1`}
                value={config.beta1}
                step={0.01}
                min={0}
                max={0.999}
                onChange={(beta1) => onChange({ beta1 })}
              />
              <NumberField
                label={`${config.label} beta2`}
                value={config.beta2}
                step={0.01}
                min={0}
                max={0.9999}
                onChange={(beta2) => onChange({ beta2 })}
              />
              <NumberField
                label={`${config.label} epsilon`}
                value={config.epsilon}
                step={0.000001}
                min={0.000001}
                onChange={(epsilon) => onChange({ epsilon })}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
