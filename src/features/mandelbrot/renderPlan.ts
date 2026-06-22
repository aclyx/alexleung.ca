import {
  shouldUseNumberIteration,
  shouldUsePerturbationIteration,
} from "@/features/mandelbrot/mandelbrot";
import {
  MandelbrotSettings,
  PreciseViewport,
} from "@/features/mandelbrot/types";

type RenderPhase = "preview" | "refining";

type MandelbrotRenderPass = {
  phase: RenderPhase;
  scale: number;
  settings: MandelbrotSettings;
  message: string;
};

type MandelbrotRenderPlan = {
  passes: MandelbrotRenderPass[];
  completionMessage: string;
};

const DEEP_ZOOM_PREVIEW_SCALE = 0.05;
const DEEP_ZOOM_MAX_ITERATIONS = 100;
const PERTURBATION_BASE_EXPONENT = 14;
const PERTURBATION_BASE_ITERATIONS = 2000;
const PERTURBATION_ITERATIONS_PER_MAGNITUDE = 100;
const PERTURBATION_ITERATION_STEP = 25;
const PERTURBATION_MAX_ITERATIONS = 12000;
const PERTURBATION_AUTO_ITERATION_SCALE = 0.5;

function widthExponent(width: PreciseViewport["width"]): number {
  const [, exponentText = "0"] = width.toExponential().split("e");

  return Number.parseInt(exponentText, 10);
}

function recommendedPerturbationIterations(
  width: PreciseViewport["width"]
): number {
  const zoomDepth = Math.max(
    0,
    Math.abs(widthExponent(width)) - PERTURBATION_BASE_EXPONENT
  );
  const rawIterations =
    PERTURBATION_BASE_ITERATIONS +
    zoomDepth * PERTURBATION_ITERATIONS_PER_MAGNITUDE;
  const steppedIterations =
    Math.ceil(rawIterations / PERTURBATION_ITERATION_STEP) *
    PERTURBATION_ITERATION_STEP;

  return Math.min(steppedIterations, PERTURBATION_MAX_ITERATIONS);
}

export function createMandelbrotRenderPlan(
  viewport: PreciseViewport,
  settings: MandelbrotSettings
): MandelbrotRenderPlan {
  if (shouldUsePerturbationIteration(viewport.width)) {
    const maxIterations = Math.max(
      settings.maxIterations,
      recommendedPerturbationIterations(viewport.width)
    );
    const scale =
      maxIterations > settings.maxIterations
        ? Math.min(settings.resolutionScale, PERTURBATION_AUTO_ITERATION_SCALE)
        : settings.resolutionScale;
    const effectiveSettings =
      maxIterations === settings.maxIterations
        ? settings
        : {
            ...settings,
            maxIterations,
          };

    return {
      passes: [
        {
          phase: "refining",
          scale,
          settings: effectiveSettings,
          message: "Rendering perturbation deep-zoom frame...",
        },
      ],
      completionMessage: `Ready at ${Math.round(scale * 100)}% perturbation deep-zoom render (${maxIterations} iterations).`,
    };
  }

  if (!shouldUseNumberIteration(viewport.width)) {
    const scale = Math.min(settings.resolutionScale, DEEP_ZOOM_PREVIEW_SCALE);
    const maxIterations = Math.min(
      settings.maxIterations,
      DEEP_ZOOM_MAX_ITERATIONS
    );

    return {
      passes: [
        {
          phase: "refining",
          scale,
          settings: {
            ...settings,
            maxIterations,
          },
          message: `Rendering ${Math.round(scale * 100)}% deep-zoom preview...`,
        },
      ],
      completionMessage: `Ready at ${Math.round(
        scale * 100
      )}% deep-zoom preview (${maxIterations} iterations).`,
    };
  }

  const previewScale = Math.min(settings.resolutionScale * 0.5, 0.4);
  const scales =
    settings.resolutionScale - previewScale >= 0.15
      ? [previewScale, settings.resolutionScale]
      : [settings.resolutionScale];

  return {
    passes: scales.map((scale, index) => {
      const phase = index === 0 && scales.length > 1 ? "preview" : "refining";

      return {
        phase,
        scale,
        settings,
        message:
          phase === "preview"
            ? "Rendering preview..."
            : `Rendering ${Math.round(scale * 100)}% frame...`,
      };
    }),
    completionMessage: `Ready at ${Math.round(
      settings.resolutionScale * 100
    )}% render scale.`,
  };
}
