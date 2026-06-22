import Decimal from "decimal.js";

import {
  createPerturbationReferenceOrbit,
  iterateMandelbrot,
  iterateMandelbrotNumber,
  iterateMandelbrotPerturbation,
  shouldUseNumberIteration,
  shouldUsePerturbationIteration,
} from "@/features/mandelbrot/mandelbrot";
import { normalizedEscapeValue } from "@/features/mandelbrot/palettes";
import { configurePrecisionForWidth } from "@/features/mandelbrot/viewport";

describe("mandelbrot escape-time logic", () => {
  it("keeps well-known interior points bounded", () => {
    const origin = iterateMandelbrot(new Decimal(0), new Decimal(0), 128);
    const interiorRealAxisPoint = iterateMandelbrot(
      new Decimal("-1.1"),
      new Decimal(0),
      128
    );

    expect(origin.escaped).toBe(false);
    expect(interiorRealAxisPoint.escaped).toBe(false);
  });

  it("escapes clearly exterior points quickly", () => {
    const point = iterateMandelbrot(new Decimal("0.5"), new Decimal("0.5"), 64);

    expect(point.escaped).toBe(true);
    expect(point.iterations).toBeLessThan(10);
  });

  it("stays stable for a boundary-adjacent inside/outside pair", () => {
    const inside = iterateMandelbrot(new Decimal("-0.75"), new Decimal(0), 300);
    const outside = iterateMandelbrot(
      new Decimal("-0.75"),
      new Decimal("0.1"),
      300
    );

    expect(inside.escaped).toBe(false);
    expect(outside.escaped).toBe(true);
    expect(outside.iterations).toBeGreaterThan(20);
  });

  it("produces smooth-color values that differ from simple banding", () => {
    const point = iterateMandelbrot(new Decimal("0.5"), new Decimal("0.5"), 64);
    const smoothValue = normalizedEscapeValue(point, 64, "smooth");
    const bandedValue = normalizedEscapeValue(point, 64, "bands");

    expect(smoothValue).toBeGreaterThan(0);
    expect(smoothValue).toBeLessThan(1);
    expect(smoothValue).not.toBe(bandedValue);
  });

  it("matches the fast number path for ordinary zoom levels", () => {
    const decimalResult = iterateMandelbrot(
      new Decimal("0.5"),
      new Decimal("0.5"),
      128
    );
    const numberResult = iterateMandelbrotNumber(0.5, 0.5, 128);

    expect(numberResult.escaped).toBe(decimalResult.escaped);
    expect(numberResult.iterations).toBe(decimalResult.iterations);
    expect(numberResult.smoothIteration).toBeCloseTo(
      decimalResult.smoothIteration,
      10
    );
  });

  it("matches the decimal path for tiny perturbations around a reference orbit", () => {
    const centerX = new Decimal("-0.743643887037151");
    const centerY = new Decimal("0.13182590420533");
    const width = new Decimal("1e-13");
    const height = new Decimal("6.25e-14");
    const size = { width: 9, height: 5 };
    const maxIterations = 300;

    configurePrecisionForWidth(width);

    const orbit = createPerturbationReferenceOrbit(
      centerX,
      centerY,
      maxIterations
    );
    const stepX = width.div(size.width);
    const stepY = height.div(size.height);
    const samplePixels = [
      { x: 0, y: 0 },
      { x: 4, y: 2 },
      { x: 8, y: 4 },
    ];

    expect(orbit.usable).toBe(true);

    for (const point of samplePixels) {
      const deltaReal = width
        .neg()
        .div(2)
        .add(stepX.mul(point.x + 0.5));
      const deltaImaginary = height.div(2).sub(stepY.mul(point.y + 0.5));
      const decimalResult = iterateMandelbrot(
        centerX.add(deltaReal),
        centerY.add(deltaImaginary),
        maxIterations
      );
      const perturbationResult = iterateMandelbrotPerturbation(
        deltaReal.toNumber(),
        deltaImaginary.toNumber(),
        orbit,
        maxIterations
      );

      expect(perturbationResult.escaped).toBe(decimalResult.escaped);
      expect(perturbationResult.iterations).toBe(decimalResult.iterations);

      if (decimalResult.escaped) {
        expect(perturbationResult.smoothIteration).toBeCloseTo(
          decimalResult.smoothIteration,
          8
        );
      }
    }
  });

  it("continues iterating when a pixel outlives its reference orbit", () => {
    const orbit = createPerturbationReferenceOrbit(
      new Decimal("0.5"),
      new Decimal("0.5"),
      64
    );
    const originFromEscapingReference = iterateMandelbrotPerturbation(
      -0.5,
      -0.5,
      orbit,
      64
    );

    expect(orbit.escapedAt).toBeLessThan(64);
    expect(originFromEscapingReference.escaped).toBe(false);
    expect(originFromEscapingReference.iterations).toBe(64);
  });

  it("switches to the decimal escape path only once zoom depth is small enough", () => {
    expect(shouldUseNumberIteration(new Decimal("1e-6"))).toBe(true);
    expect(shouldUseNumberIteration(new Decimal("1e-15"))).toBe(false);
  });

  it("uses perturbation rendering for practical deep zoom widths", () => {
    expect(shouldUsePerturbationIteration(new Decimal("1e-13"))).toBe(true);
    expect(shouldUsePerturbationIteration(new Decimal("1e-80"))).toBe(true);
    expect(shouldUsePerturbationIteration(new Decimal("1e-320"))).toBe(false);
  });
});
