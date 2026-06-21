import Decimal from "decimal.js";

import { createMandelbrotRenderPlan } from "@/features/mandelbrot/renderPlan";
import {
  MandelbrotSettings,
  PreciseViewport,
} from "@/features/mandelbrot/types";

const defaultSettings: MandelbrotSettings = {
  maxIterations: 2000,
  paletteId: "oceanic",
  coloringMode: "smooth",
  resolutionScale: 1,
  renderBackendPreference: "auto",
};

function createViewport(width: string): PreciseViewport {
  return {
    centerX: new Decimal("-0.743643887037151"),
    centerY: new Decimal("0.13182590420533"),
    width: new Decimal(width),
    height: new Decimal(width).div(16).mul(9),
  };
}

describe("createMandelbrotRenderPlan", () => {
  it("keeps the existing preview and refinement passes for ordinary zooms", () => {
    const plan = createMandelbrotRenderPlan(
      createViewport("3.5"),
      defaultSettings
    );

    expect(plan.passes).toEqual([
      {
        phase: "preview",
        scale: 0.4,
        settings: defaultSettings,
        message: "Rendering preview...",
      },
      {
        phase: "refining",
        scale: 1,
        settings: defaultSettings,
        message: "Rendering 100% frame...",
      },
    ]);
    expect(plan.completionMessage).toBe("Ready at 100% render scale.");
  });

  it("uses a capped deep-zoom preview once Decimal iteration is required", () => {
    const plan = createMandelbrotRenderPlan(
      createViewport("1e-13"),
      defaultSettings
    );

    expect(plan.passes).toHaveLength(1);
    expect(plan.passes[0]).toEqual({
      phase: "refining",
      scale: 0.05,
      settings: {
        ...defaultSettings,
        maxIterations: 100,
      },
      message: "Rendering 5% deep-zoom preview...",
    });
    expect(plan.completionMessage).toBe(
      "Ready at 5% deep-zoom preview (100 iterations)."
    );
  });

  it("does not raise a lower user iteration budget for deep zooms", () => {
    const settings = {
      ...defaultSettings,
      maxIterations: 80,
      resolutionScale: 0.5,
    };
    const plan = createMandelbrotRenderPlan(createViewport("1e-80"), settings);

    expect(plan.passes[0]?.scale).toBe(0.05);
    expect(plan.passes[0]?.settings.maxIterations).toBe(80);
    expect(plan.completionMessage).toBe(
      "Ready at 5% deep-zoom preview (80 iterations)."
    );
  });
});
