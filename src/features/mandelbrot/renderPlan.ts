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
};

type MandelbrotRenderPlan = {
  passes: MandelbrotRenderPass[];
};

const DEEP_ZOOM_PREVIEW_SCALE = 0.05;
const DEEP_ZOOM_MAX_ITERATIONS = 100;
const PERTURBATION_MAX_RENDER_SCALE = 0.35;
const PERTURBATION_REFERENCE_ITERATIONS = 1600;

export function createMandelbrotRenderPlan(
  viewport: PreciseViewport,
  settings: MandelbrotSettings
): MandelbrotRenderPlan {
  if (shouldUsePerturbationIteration(viewport.width)) {
    const iterationBoundedScale =
      PERTURBATION_MAX_RENDER_SCALE *
      Math.sqrt(
        PERTURBATION_REFERENCE_ITERATIONS /
          Math.max(PERTURBATION_REFERENCE_ITERATIONS, settings.maxIterations)
      );
    const scale = Math.min(settings.resolutionScale, iterationBoundedScale);

    return {
      passes: [
        {
          phase: "refining",
          scale,
          settings,
        },
      ],
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
        },
      ],
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
      };
    }),
  };
}
