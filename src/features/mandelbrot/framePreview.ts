import { PixelSize, PreciseViewport } from "@/features/mandelbrot/types";
import { configurePrecisionForWidth } from "@/features/mandelbrot/viewport";

const MAX_PREVIEW_SCALE = 64;

type ViewportFramePlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function hasVisibleOverlap(
  placement: ViewportFramePlacement,
  targetSize: PixelSize
): boolean {
  return (
    placement.x < targetSize.width &&
    placement.y < targetSize.height &&
    placement.x + placement.width > 0 &&
    placement.y + placement.height > 0
  );
}

export function calculateViewportFramePlacement({
  sourceSize,
  sourceViewport,
  targetSize,
  targetViewport,
}: {
  sourceSize: PixelSize;
  sourceViewport: PreciseViewport;
  targetSize: PixelSize;
  targetViewport: PreciseViewport;
}): ViewportFramePlacement | null {
  configurePrecisionForWidth(
    sourceViewport.width.lt(targetViewport.width)
      ? sourceViewport.width
      : targetViewport.width
  );

  const sourceLeft = sourceViewport.centerX.sub(sourceViewport.width.div(2));
  const sourceTop = sourceViewport.centerY.add(sourceViewport.height.div(2));
  const targetLeft = targetViewport.centerX.sub(targetViewport.width.div(2));
  const targetTop = targetViewport.centerY.add(targetViewport.height.div(2));
  const x = sourceLeft
    .sub(targetLeft)
    .div(targetViewport.width)
    .mul(targetSize.width)
    .toNumber();
  const y = targetTop
    .sub(sourceTop)
    .div(targetViewport.height)
    .mul(targetSize.height)
    .toNumber();
  const width = sourceViewport.width
    .div(targetViewport.width)
    .mul(targetSize.width)
    .toNumber();
  const height = sourceViewport.height
    .div(targetViewport.height)
    .mul(targetSize.height)
    .toNumber();
  const placement = {
    x,
    y,
    width,
    height,
  };
  const scaleX = Math.abs(width) / Math.max(1, sourceSize.width);
  const scaleY = Math.abs(height) / Math.max(1, sourceSize.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    scaleX > MAX_PREVIEW_SCALE ||
    scaleY > MAX_PREVIEW_SCALE ||
    !hasVisibleOverlap(placement, targetSize)
  ) {
    return null;
  }

  return placement;
}
