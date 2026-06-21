import Decimal from "decimal.js";

import { EscapeResult } from "@/features/mandelbrot/types";

const ESCAPE_RADIUS_SQUARED = new Decimal(4);
const ESCAPE_RADIUS_SQUARED_NUMBER = 4;
const NUMBER_RENDER_WIDTH_THRESHOLD = new Decimal("1e-12");
const PERTURBATION_RENDER_WIDTH_FLOOR = new Decimal("1e-300");
const LOG_2 = Math.log(2);

type PerturbationOrbitPoint = {
  real: number;
  imaginary: number;
};

type PerturbationReferenceOrbit = {
  points: PerturbationOrbitPoint[];
  usable: boolean;
};

function smoothEscapeValue(
  iterations: number,
  magnitudeSquared: Decimal
): number {
  const magnitudeSquaredText = magnitudeSquared.toExponential();
  const magnitudeSquaredNumber = Number.parseFloat(magnitudeSquaredText);

  if (!Number.isFinite(magnitudeSquaredNumber) || magnitudeSquaredNumber <= 1) {
    return iterations;
  }

  return (
    iterations +
    1 -
    Math.log(Math.log(Math.sqrt(magnitudeSquaredNumber))) / LOG_2
  );
}

function smoothEscapeValueNumber(
  iterations: number,
  magnitudeSquared: number
): number {
  if (!Number.isFinite(magnitudeSquared) || magnitudeSquared <= 1) {
    return iterations;
  }

  return (
    iterations + 1 - Math.log(Math.log(Math.sqrt(magnitudeSquared))) / LOG_2
  );
}

function escapedResultNumber(
  iterations: number,
  magnitudeSquared: number
): EscapeResult {
  return {
    escaped: true,
    iterations,
    smoothIteration: smoothEscapeValueNumber(iterations, magnitudeSquared),
  };
}

export function iterateMandelbrot(
  cx: Decimal,
  cy: Decimal,
  maxIterations: number
): EscapeResult {
  let zx = new Decimal(0);
  let zy = new Decimal(0);
  let magnitudeSquared = new Decimal(0);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const zxSquared = zx.mul(zx);
    const zySquared = zy.mul(zy);
    const nextZy = zx.mul(zy).mul(2).add(cy);
    const nextZx = zxSquared.sub(zySquared).add(cx);

    zx = nextZx;
    zy = nextZy;
    magnitudeSquared = zx.mul(zx).add(zy.mul(zy));

    if (magnitudeSquared.gt(ESCAPE_RADIUS_SQUARED)) {
      return {
        escaped: true,
        iterations: iteration + 1,
        smoothIteration: smoothEscapeValue(iteration + 1, magnitudeSquared),
      };
    }
  }

  return {
    escaped: false,
    iterations: maxIterations,
    smoothIteration: maxIterations,
  };
}

export function iterateMandelbrotNumber(
  cx: number,
  cy: number,
  maxIterations: number
): EscapeResult {
  let zx = 0;
  let zy = 0;
  let magnitudeSquared = 0;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const zxSquared = zx * zx;
    const zySquared = zy * zy;
    const nextZy = 2 * zx * zy + cy;
    const nextZx = zxSquared - zySquared + cx;

    zx = nextZx;
    zy = nextZy;
    magnitudeSquared = zx * zx + zy * zy;

    if (magnitudeSquared > ESCAPE_RADIUS_SQUARED_NUMBER) {
      return escapedResultNumber(iteration + 1, magnitudeSquared);
    }
  }

  return {
    escaped: false,
    iterations: maxIterations,
    smoothIteration: maxIterations,
  };
}

export function createPerturbationReferenceOrbit(
  cx: Decimal,
  cy: Decimal,
  maxIterations: number
): PerturbationReferenceOrbit {
  let zx = new Decimal(0);
  let zy = new Decimal(0);
  const points: PerturbationOrbitPoint[] = [{ real: 0, imaginary: 0 }];

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const zxSquared = zx.mul(zx);
    const zySquared = zy.mul(zy);
    const nextZy = zx.mul(zy).mul(2).add(cy);
    const nextZx = zxSquared.sub(zySquared).add(cx);
    const real = nextZx.toNumber();
    const imaginary = nextZy.toNumber();

    if (!Number.isFinite(real) || !Number.isFinite(imaginary)) {
      return {
        points,
        usable: false,
      };
    }

    zx = nextZx;
    zy = nextZy;
    points.push({ real, imaginary });

    const magnitudeSquared = zx.mul(zx).add(zy.mul(zy));

    if (magnitudeSquared.gt(ESCAPE_RADIUS_SQUARED)) {
      return {
        points,
        usable: true,
      };
    }
  }

  return {
    points,
    usable: true,
  };
}

export function iterateMandelbrotPerturbation(
  deltaCx: number,
  deltaCy: number,
  referenceOrbit: PerturbationReferenceOrbit,
  maxIterations: number
): EscapeResult {
  if (!referenceOrbit.usable || referenceOrbit.points.length < 2) {
    return {
      escaped: false,
      iterations: maxIterations,
      smoothIteration: maxIterations,
    };
  }

  let deltaZx = 0;
  let deltaZy = 0;
  const iterationLimit = Math.min(
    maxIterations,
    referenceOrbit.points.length - 1
  );

  for (let iteration = 0; iteration < iterationLimit; iteration += 1) {
    const referenceZ = referenceOrbit.points[iteration];
    const referenceNextZ = referenceOrbit.points[iteration + 1];
    const deltaZxSquared = deltaZx * deltaZx;
    const deltaZySquared = deltaZy * deltaZy;
    const nextDeltaZx =
      2 * (referenceZ.real * deltaZx - referenceZ.imaginary * deltaZy) +
      deltaZxSquared -
      deltaZySquared +
      deltaCx;
    const nextDeltaZy =
      2 * (referenceZ.real * deltaZy + referenceZ.imaginary * deltaZx) +
      2 * deltaZx * deltaZy +
      deltaCy;

    deltaZx = nextDeltaZx;
    deltaZy = nextDeltaZy;

    const zx = referenceNextZ.real + deltaZx;
    const zy = referenceNextZ.imaginary + deltaZy;
    const magnitudeSquared = zx * zx + zy * zy;

    if (!Number.isFinite(magnitudeSquared)) {
      return escapedResultNumber(iteration + 1, Number.MAX_VALUE);
    }

    if (magnitudeSquared > ESCAPE_RADIUS_SQUARED_NUMBER) {
      return escapedResultNumber(iteration + 1, magnitudeSquared);
    }
  }

  return {
    escaped: false,
    iterations: maxIterations,
    smoothIteration: maxIterations,
  };
}

export function shouldUseNumberIteration(width: Decimal): boolean {
  return width.greaterThanOrEqualTo(NUMBER_RENDER_WIDTH_THRESHOLD);
}

export function shouldUsePerturbationIteration(width: Decimal): boolean {
  return (
    width.lessThan(NUMBER_RENDER_WIDTH_THRESHOLD) &&
    width.greaterThanOrEqualTo(PERTURBATION_RENDER_WIDTH_FLOOR)
  );
}
