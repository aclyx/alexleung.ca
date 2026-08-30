import Decimal from "decimal.js";

import { createMandelbrotRenderPlan } from "@/features/mandelbrot/renderPlan";
import {
  MandelbrotSettings,
  PreciseViewport,
} from "@/features/mandelbrot/types";

const defaultSettings: MandelbrotSettings = {
  maxIterations: 2000,
  paletteId: "oceanic",
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
      },
      {
        phase: "refining",
        scale: 1,
        settings: defaultSettings,
      },
    ]);
  });

  it("reduces perturbation scale as a high iteration budget grows", () => {
    const plan = createMandelbrotRenderPlan(
      createViewport("1e-13"),
      defaultSettings
    );

    expect(plan.passes).toHaveLength(1);
    expect(plan.passes[0]).toEqual(
      expect.objectContaining({
        phase: "refining",
        settings: defaultSettings,
      })
    );
    expect(plan.passes[0]?.scale).toBeCloseTo(0.3130495168);
  });

  it("never raises the selected iteration budget for a deep render", () => {
    const settings = {
      ...defaultSettings,
      maxIterations: 80,
      resolutionScale: 0.5,
    };
    const plan = createMandelbrotRenderPlan(createViewport("1e-80"), settings);

    expect(plan.passes[0]?.scale).toBe(0.35);
    expect(plan.passes[0]?.settings.maxIterations).toBe(80);
  });

  it("uses the bounded scale and selected iterations for a 1e32x viewport", () => {
    const plan = createMandelbrotRenderPlan(
      createViewport(
        "0.0000000000000000000000000000000222402701568815166612313740442"
      ),
      defaultSettings
    );

    expect(plan.passes[0]?.scale).toBeCloseTo(0.3130495168);
    expect(plan.passes[0]?.settings.maxIterations).toBe(2000);
  });

  it("honors a selected scale below the perturbation cap at the zoom floor", () => {
    const settings = {
      ...defaultSettings,
      resolutionScale: 0.25,
    };
    const plan = createMandelbrotRenderPlan(createViewport("1e-40"), settings);

    expect(plan.passes[0]).toEqual({
      phase: "refining",
      scale: 0.25,
      settings,
    });
  });

  it("trades spatial resolution for a selected 4,000-iteration deep frame", () => {
    const settings = {
      ...defaultSettings,
      maxIterations: 4000,
    };
    const plan = createMandelbrotRenderPlan(createViewport("1e-32"), settings);

    expect(plan.passes[0]?.scale).toBeCloseTo(0.2213594362);
    expect(plan.passes[0]?.settings.maxIterations).toBe(4000);
  });
});
