"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PidChart } from "@/app/experimental/pid-controller/_components/PidChart";
import { PidControls } from "@/app/experimental/pid-controller/_components/PidControls";
import { createFirstOrderPlant } from "@/features/pid-simulator/firstOrderPlant";
import { PidController } from "@/features/pid-simulator/pidController";
import {
  getPresetById,
  PID_SIMULATOR_PRESETS,
} from "@/features/pid-simulator/presets";
import {
  computeControlBehaviorMetrics,
  createInitialSimulationState,
  stepSimulation,
} from "@/features/pid-simulator/simulationEngine";
import {
  PidControllerConfig,
  SimulationSample,
  SimulatorPresetId,
} from "@/features/pid-simulator/types";
import { roundTo } from "@/features/pid-simulator/utils";
import { trackExperimentInteraction } from "@/lib/analytics";

const FIXED_DT_SECONDS = 1 / 60;
const EXPERIMENT_ID = "pid_controller_simulator";
const MAX_ELAPSED_SECONDS = 0.25;
const MAX_CATCH_UP_STEPS_PER_FRAME = 12;
const DEFAULT_MAX_TIME_SECONDS = 20;
const TIME_EPSILON = FIXED_DT_SECONDS / 2;

const firstPreset = PID_SIMULATOR_PRESETS[0];
const plant = createFirstOrderPlant({
  gain: 1,
  timeConstantSeconds: 1.1,
  initialOutput: 0,
});

const buildControllerConfig = (
  kp: number,
  ki: number,
  kd: number
): PidControllerConfig => ({
  gains: { kp, ki, kd },
  outputMin: -2,
  outputMax: 2,
  integralMin: -4,
  integralMax: 4,
});

export function PidSimulatorWorkspace() {
  const [presetId, setPresetId] = useState<SimulatorPresetId>(firstPreset.id);
  const [kp, setKp] = useState(firstPreset.gains.kp);
  const [ki, setKi] = useState(firstPreset.gains.ki);
  const [kd, setKd] = useState(firstPreset.gains.kd);
  const [setpoint, setSetpoint] = useState(firstPreset.setpoint);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [maxTimeSeconds, setMaxTimeSeconds] = useState(
    DEFAULT_MAX_TIME_SECONDS
  );
  const [isRunning, setIsRunning] = useState(true);

  const controllerRef = useRef(
    new PidController(buildControllerConfig(kp, ki, kd))
  );
  const [simulationState, setSimulationState] = useState(() =>
    createInitialSimulationState(plant, {
      setpoint,
      timeStepSeconds: FIXED_DT_SECONDS,
      maxTimeSeconds,
    })
  );
  const simulationStateRef = useRef(simulationState);
  const metricSamplesRef = useRef<SimulationSample[]>(simulationState.samples);

  useEffect(() => {
    controllerRef.current.setConfig(buildControllerConfig(kp, ki, kd));
  }, [kp, ki, kd]);

  const initializeSimulation = (
    nextSetpoint: number,
    nextMaxTimeSeconds: number,
    nextIsRunning = isRunning
  ) => {
    controllerRef.current.reset();
    const resetState = createInitialSimulationState(plant, {
      setpoint: nextSetpoint,
      timeStepSeconds: FIXED_DT_SECONDS,
      maxTimeSeconds: nextMaxTimeSeconds,
    });

    simulationStateRef.current = resetState;
    metricSamplesRef.current = resetState.samples;
    setSimulationState(resetState);
    setIsRunning(nextIsRunning);
  };

  const applySimulationParameters = ({
    nextPresetId = presetId,
    nextKp = kp,
    nextKi = ki,
    nextKd = kd,
    nextSetpoint = setpoint,
    nextMaxTimeSeconds = maxTimeSeconds,
    nextIsRunning = true,
  }: {
    nextPresetId?: SimulatorPresetId;
    nextKp?: number;
    nextKi?: number;
    nextKd?: number;
    nextSetpoint?: number;
    nextMaxTimeSeconds?: number;
    nextIsRunning?: boolean;
  }) => {
    setPresetId(nextPresetId);
    setKp(nextKp);
    setKi(nextKi);
    setKd(nextKd);
    setSetpoint(nextSetpoint);
    setMaxTimeSeconds(nextMaxTimeSeconds);
    controllerRef.current.setConfig(
      buildControllerConfig(nextKp, nextKi, nextKd)
    );
    initializeSimulation(nextSetpoint, nextMaxTimeSeconds, nextIsRunning);
  };

  const resetSimulation = (nextIsRunning = isRunning) => {
    controllerRef.current.setConfig(buildControllerConfig(kp, ki, kd));
    initializeSimulation(setpoint, maxTimeSeconds, nextIsRunning);
  };

  const hasReachedMaxTime =
    simulationState.timeSeconds >= maxTimeSeconds - TIME_EPSILON;

  useEffect(() => {
    let rafId: number;
    let lastFrame = performance.now();
    let accumulator = 0;

    const tick = (now: number) => {
      const elapsedSeconds = Math.min(
        Math.max((now - lastFrame) / 1000, 0),
        MAX_ELAPSED_SECONDS
      );
      lastFrame = now;

      if (isRunning) {
        accumulator += elapsedSeconds * simulationSpeed;

        let stepsToRun = 0;
        while (
          accumulator >= FIXED_DT_SECONDS &&
          stepsToRun < MAX_CATCH_UP_STEPS_PER_FRAME
        ) {
          accumulator -= FIXED_DT_SECONDS;
          stepsToRun += 1;
        }

        accumulator = Math.min(
          accumulator,
          FIXED_DT_SECONDS * MAX_CATCH_UP_STEPS_PER_FRAME
        );

        if (stepsToRun > 0) {
          let next = simulationStateRef.current;
          const nextMetricSamples = [...metricSamplesRef.current];
          let shouldPause = false;

          for (let index = 0; index < stepsToRun; index += 1) {
            if (next.timeSeconds >= maxTimeSeconds - TIME_EPSILON) {
              shouldPause = true;
              break;
            }

            next = stepSimulation(next, plant, controllerRef.current, {
              setpoint,
              timeStepSeconds: FIXED_DT_SECONDS,
              maxTimeSeconds,
            });

            const latestSample = next.samples.at(-1);
            if (latestSample) {
              nextMetricSamples.push(latestSample);
            }

            if (next.timeSeconds >= maxTimeSeconds - TIME_EPSILON) {
              shouldPause = true;
              break;
            }
          }

          simulationStateRef.current = next;
          metricSamplesRef.current = nextMetricSamples;
          setSimulationState(next);

          if (shouldPause) {
            setIsRunning(false);
            accumulator = 0;
          }
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isRunning, maxTimeSeconds, setpoint, simulationSpeed]);

  useEffect(() => {
    simulationStateRef.current = simulationState;
  }, [simulationState]);

  const metrics = useMemo(
    () => computeControlBehaviorMetrics(metricSamplesRef.current, setpoint),
    [setpoint, simulationState.timeSeconds]
  );
  const trackPidInteraction = (
    action: string,
    params: Record<string, string | number> = {}
  ) => {
    trackExperimentInteraction(EXPERIMENT_ID, action, params);
  };

  return (
    <section className="space-y-6 rounded-xl border border-gray-700 bg-gray-900/60 p-6 shadow-sm">
      <div>
        <h2 className="text-heading-sm text-white">PID Controller Simulator</h2>
        <p className="text-body mt-2 text-gray-300">
          This model uses a first-order plant and a deterministic fixed timestep
          of {FIXED_DT_SECONDS.toFixed(4)}s. The PID control law is u(t) =
          Kp·e(t) + Ki·∫e(t)dt + Kd·de(t)/dt.
        </p>
        <p className="text-body-sm mt-2 text-gray-400">
          Timeline: {roundTo(simulationState.timeSeconds, 2)}s /{" "}
          {maxTimeSeconds.toFixed(0)}s
        </p>
        <p className="text-body-sm mt-2 text-gray-400">
          Changing gains or setpoint restarts the run so the full step response
          stays in view.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <PidChart samples={simulationState.samples} />

        <PidControls
          kp={kp}
          ki={ki}
          kd={kd}
          setpoint={setpoint}
          simulationSpeed={simulationSpeed}
          maxTimeSeconds={maxTimeSeconds}
          activePresetId={presetId}
          presets={PID_SIMULATOR_PRESETS}
          isRunning={isRunning}
          hasReachedMaxTime={hasReachedMaxTime}
          onPresetChange={(nextPresetId) => {
            const preset = getPresetById(nextPresetId);
            if (!preset) {
              return;
            }

            trackPidInteraction("change_preset", {
              preset_id: preset.id,
            });
            applySimulationParameters({
              nextPresetId: preset.id,
              nextKp: preset.gains.kp,
              nextKi: preset.gains.ki,
              nextKd: preset.gains.kd,
              nextSetpoint: preset.setpoint,
            });
          }}
          onKpChange={(value) => {
            trackPidInteraction("change_gain", { gain: "kp", value });
            applySimulationParameters({
              nextKp: value,
            });
          }}
          onKiChange={(value) => {
            trackPidInteraction("change_gain", { gain: "ki", value });
            applySimulationParameters({
              nextKi: value,
            });
          }}
          onKdChange={(value) => {
            trackPidInteraction("change_gain", { gain: "kd", value });
            applySimulationParameters({
              nextKd: value,
            });
          }}
          onSetpointChange={(value) => {
            trackPidInteraction("change_setpoint", { value });
            applySimulationParameters({
              nextSetpoint: value,
            });
          }}
          onSimulationSpeedChange={(value) => {
            trackPidInteraction("change_simulation_speed", { value });
            setSimulationSpeed(value);
          }}
          onMaxTimeChange={(value) => {
            trackPidInteraction("change_max_time", { value });
            applySimulationParameters({
              nextMaxTimeSeconds: value,
            });
          }}
          onToggleRunning={() => {
            trackPidInteraction(
              hasReachedMaxTime ? "restart_after_complete" : "toggle_running"
            );
            if (hasReachedMaxTime) {
              resetSimulation(true);
              return;
            }

            setIsRunning((current) => !current);
          }}
          onReset={() => {
            trackPidInteraction("reset");
            resetSimulation();
          }}
        />
      </div>

      <section className="grid gap-3 rounded-lg border border-gray-700 bg-black/40 p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-gray-400">Rise time (10%→90%)</p>
          <p className="text-lg text-white">
            {metrics.riseTimeSeconds === null
              ? "—"
              : `${roundTo(metrics.riseTimeSeconds, 2)} s`}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Settling time (±2%)</p>
          <p className="text-lg text-white">
            {metrics.settlingTimeSeconds === null
              ? "—"
              : `${roundTo(metrics.settlingTimeSeconds, 2)} s`}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Overshoot</p>
          <p className="text-lg text-white">
            {metrics.overshootPercent === null
              ? "—"
              : `${roundTo(Math.max(metrics.overshootPercent, 0), 1)} %`}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Steady-state error</p>
          <p className="text-lg text-white">
            {roundTo(metrics.steadyStateError, 3)}
          </p>
        </div>
      </section>
    </section>
  );
}
