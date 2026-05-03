"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { LearningDynamicsPlot } from "@/app/experimental/learning-dynamics/_components/LearningDynamicsPlot";
import { MetricsPanel } from "@/app/experimental/learning-dynamics/_components/MetricsPanel";
import { RunSettingsCard } from "@/app/experimental/learning-dynamics/_components/RunSettingsCard";
import {
  createRunSet,
  hasAnyActiveRun,
  stepRun,
} from "@/features/optimizer-lab/simulation";
import {
  clampPointToSurfaceDomain,
  getSurfaceById,
  SURFACES,
} from "@/features/optimizer-lab/surfaces";
import {
  OptimizerId,
  RunConfig,
  RunId,
  RunSnapshot,
  SurfaceId,
  Vector2,
} from "@/features/optimizer-lab/types";
import { trackExperimentInteraction } from "@/lib/analytics";

const DEFAULT_SURFACE_ID: SurfaceId = "quadratic-elongated";
const EXPERIMENT_ID = "learning_dynamics_lab";
const DEFAULT_RUN_CONFIGS: RunConfig[] = [
  {
    id: "run-a",
    label: "Run A",
    color: "#22d3ee",
    enabled: true,
    optimizerId: "sgd",
    learningRate: 0.12,
    momentum: 0.9,
    beta1: 0.9,
    beta2: 0.99,
    epsilon: 0.000001,
  },
  {
    id: "run-b",
    label: "Run B",
    color: "#f97316",
    enabled: true,
    optimizerId: "adam",
    learningRate: 0.08,
    momentum: 0.9,
    beta1: 0.9,
    beta2: 0.99,
    epsilon: 0.000001,
  },
];

const OPTIMIZER_EXPLANATIONS: Record<OptimizerId, string> = {
  sgd: "SGD follows the raw gradient directly. It is easy to reason about, but it can zig-zag badly in narrow valleys and is sensitive to the learning rate.",
  momentum:
    "Momentum keeps a running velocity so the trajectory can build speed in consistent directions and smooth out noisy oscillations.",
  rmsprop:
    "RMSProp rescales each coordinate by a moving average of recent squared gradients, which helps when curvature is very different across dimensions.",
  adam: "Adam combines momentum with per-coordinate scaling. It usually settles quickly on these toy surfaces and makes adaptive behavior easy to compare.",
};

type NumberInputProps = {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
};

function NumberInput({ label, value, step, onChange }: NumberInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-200">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        className="rounded-md border border-white/12 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-300"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function getConfigById(configs: RunConfig[], runId: RunId): RunConfig {
  const config = configs.find((candidate) => candidate.id === runId);

  if (!config) {
    throw new Error(`Missing run config for ${runId}`);
  }

  return config;
}

function isSurfaceId(value: string): value is SurfaceId {
  return SURFACES.some((surface) => surface.id === value);
}

export function LearningDynamicsLab() {
  const [surfaceId, setSurfaceId] = useState<SurfaceId>(DEFAULT_SURFACE_ID);
  const surface = getSurfaceById(surfaceId);
  const [startPoint, setStartPoint] = useState<Vector2>(surface.defaultStart);
  const [stepsPerSecond, setStepsPerSecond] = useState(7);
  const [runConfigs, setRunConfigs] =
    useState<RunConfig[]>(DEFAULT_RUN_CONFIGS);
  const [runs, setRuns] = useState<RunSnapshot[]>(
    createRunSet(surface, DEFAULT_RUN_CONFIGS, surface.defaultStart)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const hasActiveRun = hasAnyActiveRun(runs, runConfigs);

  const trackLearningDynamicsInteraction = (
    action: string,
    params: Record<string, string | number> = {}
  ) => {
    trackExperimentInteraction(EXPERIMENT_ID, action, params);
  };

  const resetRuns = (
    nextSurface = surface,
    nextConfigs = runConfigs,
    nextStartPoint = startPoint
  ) => {
    setIsPlaying(false);
    setRuns(createRunSet(nextSurface, nextConfigs, nextStartPoint));
  };

  const handleRunConfigChange = (runId: RunId, patch: Partial<RunConfig>) => {
    trackLearningDynamicsInteraction("change_run_config", {
      fields: Object.keys(patch).join(","),
      run_id: runId,
    });
    const nextConfigs = runConfigs.map((config) =>
      config.id === runId ? { ...config, ...patch } : config
    );

    setRunConfigs(nextConfigs);
    resetRuns(surface, nextConfigs, startPoint);
  };

  const handleSurfaceChange = (nextSurfaceId: SurfaceId) => {
    trackLearningDynamicsInteraction("change_surface", {
      surface_id: nextSurfaceId,
    });
    const nextSurface = getSurfaceById(nextSurfaceId);
    const nextStartPoint = nextSurface.defaultStart;

    setSurfaceId(nextSurfaceId);
    setStartPoint(nextStartPoint);
    resetRuns(nextSurface, runConfigs, nextStartPoint);
  };

  const handleStartPointChange = (nextPoint: Vector2) => {
    const clampedPoint = clampPointToSurfaceDomain(surface, nextPoint);

    setStartPoint(clampedPoint);
    resetRuns(surface, runConfigs, clampedPoint);
  };

  const stepAllRuns = useEffectEvent(() => {
    setRuns((currentRuns) => {
      return currentRuns.map((run) =>
        stepRun(surface, getConfigById(runConfigs, run.id), run)
      );
    });
  });

  useEffect(() => {
    if (isPlaying && !hasActiveRun) {
      setIsPlaying(false);
    }
  }, [hasActiveRun, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let animationFrameId = 0;
    let accumulatorMs = 0;
    let previousTimestamp: number | null = null;
    const stepIntervalMs = 1000 / stepsPerSecond;

    const animate = (timestamp: number) => {
      if (previousTimestamp === null) {
        previousTimestamp = timestamp;
      }

      accumulatorMs += timestamp - previousTimestamp;
      previousTimestamp = timestamp;

      let safetyCounter = 0;
      while (accumulatorMs >= stepIntervalMs && safetyCounter < 12) {
        stepAllRuns();
        accumulatorMs -= stepIntervalMs;
        safetyCounter += 1;
      }

      animationFrameId = window.requestAnimationFrame(animate);
    };

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, stepAllRuns, stepsPerSecond]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <h2 className="text-heading text-white">Simulation controls</h2>
            <p className="mt-1 text-sm text-slate-400">
              Shared surface and playback settings for both runs.
            </p>

            <div className="mt-5 space-y-4">
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                <span>Loss surface</span>
                <select
                  value={surfaceId}
                  className="rounded-md border border-white/12 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-300"
                  onChange={(event) => {
                    const nextSurfaceId = event.target.value;

                    if (!isSurfaceId(nextSurfaceId)) {
                      return;
                    }

                    handleSurfaceChange(nextSurfaceId);
                  }}
                >
                  {SURFACES.map((candidateSurface) => (
                    <option
                      key={candidateSurface.id}
                      value={candidateSurface.id}
                    >
                      {candidateSurface.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <NumberInput
                  label="Start x"
                  value={startPoint.x}
                  step={0.1}
                  onChange={(x) => handleStartPointChange({ ...startPoint, x })}
                />
                <NumberInput
                  label="Start y"
                  value={startPoint.y}
                  step={0.1}
                  onChange={(y) => handleStartPointChange({ ...startPoint, y })}
                />
                <NumberInput
                  label="Steps per second"
                  value={stepsPerSecond}
                  step={1}
                  onChange={(nextValue) => {
                    setStepsPerSecond(Math.max(1, nextValue));
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/20"
                  onClick={() => {
                    trackLearningDynamicsInteraction(
                      isPlaying ? "pause" : "play"
                    );
                    setIsPlaying((currentValue) => !currentValue);
                  }}
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  onClick={() => {
                    trackLearningDynamicsInteraction("single_step");
                    setIsPlaying(false);
                    stepAllRuns();
                  }}
                >
                  Single-step
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  onClick={() => {
                    trackLearningDynamicsInteraction("reset");
                    resetRuns();
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          {runConfigs.map((config) => (
            <RunSettingsCard
              key={config.id}
              config={config}
              onChange={(patch) => handleRunConfigChange(config.id, patch)}
            />
          ))}
        </aside>

        <div className="space-y-6">
          <LearningDynamicsPlot
            surface={surface}
            runs={runs}
            startPoint={startPoint}
            onStartPointChange={handleStartPointChange}
          />
          <MetricsPanel runs={runs} />
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <h2 className="text-heading text-white">Surface notes</h2>
          <p className="mt-3 text-body text-slate-300">{surface.description}</p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <h2 className="text-heading text-white">Optimizer notes</h2>
          <div className="mt-4 space-y-4">
            {runs.map((run) => (
              <div key={run.id}>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: run.color }}
                  />
                  <h3 className="text-heading-sm text-white">
                    {run.label}: {run.optimizerId.toUpperCase()}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {OPTIMIZER_EXPLANATIONS[run.optimizerId]}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
