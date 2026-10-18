import Decimal from "decimal.js";

import {
  CanvasPoint,
  ComplexPoint,
  PixelSize,
  PreciseViewport,
} from "@/features/mandelbrot/types";

const DEFAULT_PRECISION = 72;
const PRECISION_PADDING = 24;
const MIN_RENDERABLE_VIEWPORT_WIDTH = new Decimal("1e-40");
const MAX_RENDERABLE_VIEWPORT_WIDTH = new Decimal(8);

type ViewportInput = {
  centerX: Decimal.Value;
  centerY: Decimal.Value;
  width: Decimal.Value;
  size: PixelSize;
};

function getExponent(value: Decimal): number {
  const [, exponentText = "0"] = value.toExponential().split("e");
  return Number.parseInt(exponentText, 10);
}

export function precisionForWidth(width: Decimal): number {
  const safeWidth = Decimal.max(width.abs(), new Decimal("1e-9999"));
  return Math.max(
    DEFAULT_PRECISION,
    Math.abs(getExponent(safeWidth)) + PRECISION_PADDING
  );
}

export function configurePrecisionForWidth(width: Decimal) {
  Decimal.set({
    precision: precisionForWidth(width),
    rounding: Decimal.ROUND_HALF_UP,
    toExpNeg: -200,
    toExpPos: 200,
  });
}

export function precise(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

export function cloneViewport(viewport: PreciseViewport): PreciseViewport {
  configurePrecisionForWidth(viewport.width);

  return {
    centerX: precise(viewport.centerX),
    centerY: precise(viewport.centerY),
    width: precise(viewport.width),
    height: precise(viewport.height),
  };
}

function viewportHeightForSize(width: Decimal.Value, size: PixelSize): Decimal {
  const preciseWidth = precise(width);
  configurePrecisionForWidth(preciseWidth);

  const safeWidth = Math.max(1, Math.round(size.width));
  const safeHeight = Math.max(1, Math.round(size.height));

  return preciseWidth.mul(safeHeight).div(safeWidth);
}

export function createViewport({
  centerX,
  centerY,
  width,
  size,
}: ViewportInput): PreciseViewport {
  const preciseWidth = precise(width);
  const preciseCenterX = precise(centerX);
  const preciseCenterY = precise(centerY);

  if (!preciseCenterX.isFinite() || !preciseCenterY.isFinite()) {
    throw new Error("Viewport center coordinates must be finite.");
  }

  if (
    !preciseWidth.isFinite() ||
    preciseWidth.lt(MIN_RENDERABLE_VIEWPORT_WIDTH) ||
    preciseWidth.gt(MAX_RENDERABLE_VIEWPORT_WIDTH)
  ) {
    throw new Error(
      `Viewport width must be between ${MIN_RENDERABLE_VIEWPORT_WIDTH.toString()} and ${MAX_RENDERABLE_VIEWPORT_WIDTH.toString()}.`
    );
  }
  configurePrecisionForWidth(preciseWidth);

  return {
    centerX: preciseCenterX,
    centerY: preciseCenterY,
    width: preciseWidth,
    height: viewportHeightForSize(preciseWidth, size),
  };
}

export function createDefaultViewport(size: PixelSize): PreciseViewport {
  return createViewport({
    centerX: "-0.75",
    centerY: "0",
    width: "3.5",
    size,
  });
}

export function resizeViewport(
  viewport: PreciseViewport,
  nextSize: PixelSize
): PreciseViewport {
  configurePrecisionForWidth(viewport.width);

  return {
    centerX: precise(viewport.centerX),
    centerY: precise(viewport.centerY),
    width: precise(viewport.width),
    height: viewportHeightForSize(viewport.width, nextSize),
  };
}

export function mapViewportPoint(
  viewport: PreciseViewport,
  size: PixelSize,
  point: CanvasPoint
): ComplexPoint {
  configurePrecisionForWidth(viewport.width);

  const safeWidth = Math.max(1, Math.round(size.width));
  const safeHeight = Math.max(1, Math.round(size.height));
  const boundedX = Math.min(Math.max(point.x, 0), safeWidth);
  const boundedY = Math.min(Math.max(point.y, 0), safeHeight);

  const left = viewport.centerX.sub(viewport.width.div(2));
  const top = viewport.centerY.add(viewport.height.div(2));
  const relativeX = precise(boundedX).div(safeWidth);
  const relativeY = precise(boundedY).div(safeHeight);

  return {
    real: left.add(viewport.width.mul(relativeX)),
    imaginary: top.sub(viewport.height.mul(relativeY)),
  };
}

export function mapPixelCenterToComplex(
  viewport: PreciseViewport,
  size: PixelSize,
  point: CanvasPoint
): ComplexPoint {
  return mapViewportPoint(viewport, size, {
    x: point.x + 0.5,
    y: point.y + 0.5,
  });
}

export function zoomViewportAtPoint(
  viewport: PreciseViewport,
  size: PixelSize,
  point: CanvasPoint,
  zoomMultiplier: number
): PreciseViewport {
  configurePrecisionForWidth(viewport.width);

  const safeMultiplier = precise(Math.min(Math.max(zoomMultiplier, 1e-6), 1e6));
  const target = mapViewportPoint(viewport, size, point);
  const safeWidth = Math.max(1, Math.round(size.width));
  const safeHeight = Math.max(1, Math.round(size.height));
  const relativeX = precise(point.x).div(safeWidth);
  const relativeY = precise(point.y).div(safeHeight);
  const requestedWidth = viewport.width.mul(safeMultiplier);
  const nextWidth = Decimal.min(
    MAX_RENDERABLE_VIEWPORT_WIDTH,
    Decimal.max(MIN_RENDERABLE_VIEWPORT_WIDTH, requestedWidth)
  );
  const effectiveMultiplier = nextWidth.div(viewport.width);
  const nextHeight = viewport.height.mul(effectiveMultiplier);
  const nextLeft = target.real.sub(nextWidth.mul(relativeX));
  const nextTop = target.imaginary.add(nextHeight.mul(relativeY));

  return {
    centerX: nextLeft.add(nextWidth.div(2)),
    centerY: nextTop.sub(nextHeight.div(2)),
    width: nextWidth,
    height: nextHeight,
  };
}

export function panViewport(
  viewport: PreciseViewport,
  size: PixelSize,
  delta: CanvasPoint
): PreciseViewport {
  configurePrecisionForWidth(viewport.width);

  const safeWidth = Math.max(1, Math.round(size.width));
  const safeHeight = Math.max(1, Math.round(size.height));

  return {
    centerX: viewport.centerX.sub(viewport.width.mul(delta.x).div(safeWidth)),
    centerY: viewport.centerY.add(viewport.height.mul(delta.y).div(safeHeight)),
    width: precise(viewport.width),
    height: precise(viewport.height),
  };
}

export function magnificationFromViewport(
  viewport: PreciseViewport,
  referenceWidth: Decimal.Value = "3.5"
): Decimal {
  configurePrecisionForWidth(viewport.width);

  return precise(referenceWidth).div(viewport.width);
}

export function viewportsEqual(
  left: PreciseViewport,
  right: PreciseViewport
): boolean {
  return (
    left.centerX.eq(right.centerX) &&
    left.centerY.eq(right.centerY) &&
    left.width.eq(right.width) &&
    left.height.eq(right.height)
  );
}
