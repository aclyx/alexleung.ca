import {
  canRenderViewportWithWebGpu,
  detectWebGpuAvailability,
  renderMandelbrotWithWebGpu,
} from "@/features/mandelbrot/gpu";
import {
  createPerturbationReferenceOrbit,
  iterateMandelbrot,
  iterateMandelbrotNumber,
  iterateMandelbrotPerturbation,
  shouldUseNumberIteration,
  shouldUsePerturbationIteration,
} from "@/features/mandelbrot/mandelbrot";
import { colorEscapeResult } from "@/features/mandelbrot/palettes";
import {
  RenderBackend,
  RenderBackendPreference,
  RenderRequest,
} from "@/features/mandelbrot/types";
import {
  configurePrecisionForWidth,
  mapPixelCenterToComplex,
  precise,
} from "@/features/mandelbrot/viewport";

const DECIMAL_ROWS_PER_CHUNK = 1;
const NUMBER_ROWS_PER_CHUNK = 20;

type RenderExecutionResult = {
  completed: boolean;
  backend: RenderBackend;
  gpuFallbackReason?: string;
};

export function shouldAttemptWebGpu(
  request: Pick<RenderRequest, "viewport" | "size">,
  backendPreference: RenderBackendPreference = "auto"
): boolean {
  if (backendPreference === "cpu") {
    return false;
  }

  if (backendPreference === "webgpu") {
    return true;
  }

  return (
    shouldUseNumberIteration(request.viewport.width) &&
    canRenderViewportWithWebGpu(request.viewport, request.size)
  );
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });
}

async function renderMandelbrot({
  viewport,
  size,
  settings,
  signal,
  onChunk,
  onProgress,
}: RenderRequest): Promise<boolean> {
  configurePrecisionForWidth(viewport.width);

  const safeWidth = Math.max(1, Math.round(size.width));
  const safeHeight = Math.max(1, Math.round(size.height));
  const useNumberIteration = shouldUseNumberIteration(viewport.width);
  const shouldUsePerturbation =
    !useNumberIteration && shouldUsePerturbationIteration(viewport.width);
  const rowsPerChunk =
    useNumberIteration || shouldUsePerturbation
      ? NUMBER_ROWS_PER_CHUNK
      : DECIMAL_ROWS_PER_CHUNK;
  const left = viewport.centerX.sub(viewport.width.div(2));
  const top = viewport.centerY.add(viewport.height.div(2));
  const stepX = viewport.width.div(safeWidth);
  const stepY = viewport.height.div(safeHeight);
  const leftNumber = left.toNumber();
  const topNumber = top.toNumber();
  const stepXNumber = stepX.toNumber();
  const stepYNumber = stepY.toNumber();
  const deltaXStartNumber = viewport.width
    .neg()
    .div(2)
    .add(stepX.div(2))
    .toNumber();
  const deltaYStartNumber = viewport.height.div(2).sub(stepY.div(2)).toNumber();
  const usePerturbationIteration =
    shouldUsePerturbation &&
    Number.isFinite(deltaXStartNumber) &&
    Number.isFinite(deltaYStartNumber) &&
    Number.isFinite(stepXNumber) &&
    Number.isFinite(stepYNumber) &&
    stepXNumber > 0 &&
    stepYNumber > 0;
  const perturbationReferenceOrbit = usePerturbationIteration
    ? createPerturbationReferenceOrbit(
        viewport.centerX,
        viewport.centerY,
        settings.maxIterations
      )
    : null;
  let row = 0;

  while (row < safeHeight) {
    if (signal?.aborted) {
      return false;
    }

    const rowCount = Math.min(rowsPerChunk, safeHeight - row);
    const pixels = new Uint8ClampedArray(safeWidth * rowCount * 4);

    for (let rowOffset = 0; rowOffset < rowCount; rowOffset += 1) {
      if (signal?.aborted) {
        return false;
      }

      const y = row + rowOffset;

      for (let x = 0; x < safeWidth; x += 1) {
        if (signal?.aborted) {
          return false;
        }

        const result =
          usePerturbationIteration && perturbationReferenceOrbit?.usable
            ? iterateMandelbrotPerturbation(
                deltaXStartNumber + stepXNumber * x,
                deltaYStartNumber - stepYNumber * y,
                perturbationReferenceOrbit,
                settings.maxIterations
              )
            : useNumberIteration
              ? iterateMandelbrotNumber(
                  leftNumber + stepXNumber * (x + 0.5),
                  topNumber - stepYNumber * (y + 0.5),
                  settings.maxIterations
                )
              : renderDecimalPixel(
                  viewport,
                  size,
                  x,
                  y,
                  settings.maxIterations
                );
        const [red, green, blue, alpha] = colorEscapeResult(
          result,
          settings.maxIterations,
          settings.paletteId,
          settings.coloringMode
        );
        const pixelIndex = (rowOffset * safeWidth + x) * 4;

        pixels[pixelIndex] = red;
        pixels[pixelIndex + 1] = green;
        pixels[pixelIndex + 2] = blue;
        pixels[pixelIndex + 3] = alpha;
      }
    }

    onChunk({
      startRow: row,
      rowCount,
      pixels,
    });
    row += rowCount;
    onProgress?.(row / safeHeight);

    await nextFrame();
  }

  return true;
}

export async function renderMandelbrotWithStrategy(
  request: RenderRequest,
  backendPreference: RenderBackendPreference = "auto"
): Promise<RenderExecutionResult> {
  if (shouldAttemptWebGpu(request, backendPreference)) {
    const gpuAvailability = await detectWebGpuAvailability();

    if (gpuAvailability.isAvailable) {
      const gpuRenderResult = await renderMandelbrotWithWebGpu(request);

      if (gpuRenderResult.rendered) {
        return {
          completed: gpuRenderResult.completed,
          backend: "webgpu",
          gpuFallbackReason: gpuRenderResult.fallbackReason,
        };
      }

      if (request.signal?.aborted) {
        return {
          completed: false,
          backend: "cpu",
          gpuFallbackReason: gpuRenderResult.fallbackReason,
        };
      }

      const completedWithCpu = await renderMandelbrot(request);

      return {
        completed: completedWithCpu,
        backend: "cpu",
        gpuFallbackReason:
          gpuRenderResult.fallbackReason ??
          "WebGPU rendering failed, so the CPU renderer took over.",
      };
    }

    const completedWithCpu = await renderMandelbrot(request);

    return {
      completed: completedWithCpu,
      backend: "cpu",
      gpuFallbackReason: gpuAvailability.reason,
    };
  }

  const completedWithCpu = await renderMandelbrot(request);

  return {
    completed: completedWithCpu,
    backend: "cpu",
    gpuFallbackReason: undefined,
  };
}

function renderDecimalPixel(
  viewport: RenderRequest["viewport"],
  size: RenderRequest["size"],
  x: number,
  y: number,
  maxIterations: number
) {
  const point = mapPixelCenterToComplex(viewport, size, { x, y });

  return iterateMandelbrot(
    precise(point.real),
    precise(point.imaginary),
    maxIterations
  );
}
