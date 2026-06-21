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

export function createMandelbrotRenderPlan(
  viewport: PreciseViewport,
  settings: MandelbrotSettings
): MandelbrotRenderPlan {
  if (shouldUsePerturbationIteration(viewport.width)) {
    return {
      passes: [
        {
          phase: "refining",
          scale: settings.resolutionScale,
          settings,
          message: "Rendering perturbation deep-zoom frame...",
        },
      ],
      completionMessage: `Ready at ${Math.round(
        settings.resolutionScale * 100
      )}% perturbation deep-zoom render (${settings.maxIterations} iterations).`,
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
