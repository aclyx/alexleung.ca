import { ChangeEvent } from "react";

import { SimulatorPreset } from "@/features/pid-simulator/types";

type PidControlsProps = {
  kp: number;
  ki: number;
  kd: number;
  setpoint: number;
  simulationSpeed: number;
  maxTimeSeconds: number;
  activePresetId: string;
  presets: readonly SimulatorPreset[];
  isRunning: boolean;
  hasReachedMaxTime: boolean;
  onPresetChange: (presetId: string) => void;
  onKpChange: (value: number) => void;
  onKiChange: (value: number) => void;
  onKdChange: (value: number) => void;
  onSetpointChange: (value: number) => void;
  onSimulationSpeedChange: (value: number) => void;
  onMaxTimeChange: (value: number) => void;
  onToggleRunning: () => void;
  onReset: () => void;
};

const handleNumericChange = (
  event: ChangeEvent<HTMLInputElement>,
  onChange: (value: number) => void
) => {
  const value = Number.parseFloat(event.target.value);
  if (Number.isFinite(value)) {
    onChange(value);
  }
};

const SliderRow = ({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <div className="space-y-1">
    <label
      htmlFor={id}
      className="text-body-sm flex justify-between text-gray-200"
    >
      <span>{label}</span>
      <span>{value.toFixed(2)}</span>
    </label>
    <input
      id={id}
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      className="min-h-11 w-full"
      aria-label={label}
      onChange={(event) => handleNumericChange(event, onChange)}
    />
  </div>
);

export function PidControls({
  kp,
  ki,
  kd,
  setpoint,
  simulationSpeed,
  maxTimeSeconds,
  activePresetId,
  presets,
  isRunning,
  hasReachedMaxTime,
  onPresetChange,
  onKpChange,
  onKiChange,
  onKdChange,
  onSetpointChange,
  onSimulationSpeedChange,
  onMaxTimeChange,
  onToggleRunning,
  onReset,
}: PidControlsProps) {
  return (
    <section className="space-y-4 rounded-lg border border-gray-700 bg-black/40 p-4">
      <div>
        <label htmlFor="pid-preset" className="text-body-sm text-gray-200">
          Preset response
        </label>
        <select
          id="pid-preset"
          className="text-body mt-1 min-h-11 w-full rounded-md border border-gray-600 bg-gray-900 p-2 text-gray-100"
          value={activePresetId}
          onChange={(event) => onPresetChange(event.target.value)}
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <p className="text-body-sm mt-2 text-gray-400">
          {presets.find((preset) => preset.id === activePresetId)?.description}
        </p>
      </div>

      <SliderRow
        id="pid-kp"
        label="Kp"
        value={kp}
        min={0}
        max={6}
        step={0.05}
        onChange={onKpChange}
      />
      <SliderRow
        id="pid-ki"
        label="Ki"
        value={ki}
        min={0}
        max={3}
        step={0.05}
        onChange={onKiChange}
      />
      <SliderRow
        id="pid-kd"
        label="Kd"
        value={kd}
        min={0}
        max={3}
        step={0.05}
        onChange={onKdChange}
      />
      <SliderRow
        id="pid-setpoint"
        label="Setpoint"
        value={setpoint}
        min={0.2}
        max={2}
        step={0.05}
        onChange={onSetpointChange}
      />
      <SliderRow
        id="pid-speed"
        label="Simulation speed"
        value={simulationSpeed}
        min={0.25}
        max={4}
        step={0.25}
        onChange={onSimulationSpeedChange}
      />
      <SliderRow
        id="pid-max-time"
        label="Max time (s)"
        value={maxTimeSeconds}
        min={5}
        max={60}
        step={1}
        onChange={onMaxTimeChange}
      />
      <p className="text-body-sm text-gray-400">
        The run stops automatically at the selected max time.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-500 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-900/50"
          onClick={onToggleRunning}
        >
          {isRunning ? "Pause" : hasReachedMaxTime ? "Replay" : "Play"}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-500 px-3 py-2 text-sm text-gray-100 hover:bg-gray-800"
          onClick={onReset}
        >
          Reset simulation
        </button>
      </div>
    </section>
  );
}
