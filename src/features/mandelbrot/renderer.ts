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
  EscapeResult,
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
const DEFAULT_PERTURBATION_TILE_SIZE = 160;
const DEEP_PERTURBATION_TILE_SIZE = 32;
const DEEP_PERTURBATION_TILE_EXPONENT = -24;

type RenderExecutionResult = {
  completed: boolean;
  backend: RenderBackend;
  gpuFallbackReason?: string;
};

type DecimalCoordinate = RenderRequest["viewport"]["centerX"];
type PerturbationReferenceOrbit = ReturnType<
  typeof createPerturbationReferenceOrbit
>;

type PerturbationTileReference = {
  deltaXStartNumber: number;
  deltaYStartNumber: number;
  orbit: PerturbationReferenceOrbit;
  startX: number;
  startY: number;
};

type PerturbationTileGrid = {
  tileSize: number;
  tiles: PerturbationTileReference[][];
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

function perturbationTileSizeForWidth(width: DecimalCoordinate): number {
  const [, exponentText = "0"] = width.toExponential().split("e");
  const exponent = Number.parseInt(exponentText, 10);

  return exponent <= DEEP_PERTURBATION_TILE_EXPONENT
    ? DEEP_PERTURBATION_TILE_SIZE
    : DEFAULT_PERTURBATION_TILE_SIZE;
}

function mapPixelCenterFromGrid(
  left: DecimalCoordinate,
  top: DecimalCoordinate,
  stepX: DecimalCoordinate,
  stepY: DecimalCoordinate,
  x: number,
  y: number
) {
  return {
    real: left.add(stepX.mul(x + 0.5)),
    imaginary: top.sub(stepY.mul(y + 0.5)),
  };
}

function tileReferenceCandidates(
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const maxX = endX - 1;
  const maxY = endY - 1;
  const centerX = Math.floor((startX + maxX) / 2);
  const centerY = Math.floor((startY + maxY) / 2);
  const candidates = [
    { x: centerX, y: centerY },
    { x: startX, y: startY },
    { x: maxX, y: startY },
    { x: startX, y: maxY },
    { x: maxX, y: maxY },
  ];
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = `${candidate.x}:${candidate.y}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function selectPerturbationReference(
  left: DecimalCoordinate,
  top: DecimalCoordinate,
  stepX: DecimalCoordinate,
  stepY: DecimalCoordinate,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  maxIterations: number
) {
  let best: {
    point: ReturnType<typeof mapPixelCenterFromGrid>;
    orbit: PerturbationReferenceOrbit;
    score: number;
  } | null = null;

  for (const candidate of tileReferenceCandidates(startX, startY, endX, endY)) {
    const point = mapPixelCenterFromGrid(
      left,
      top,
      stepX,
      stepY,
      candidate.x,
      candidate.y
    );
    const orbit = createPerturbationReferenceOrbit(
      point.real,
      point.imaginary,
      maxIterations
    );
    const score = orbit.usable ? orbit.points.length - 1 : -1;

    if (!best || score > best.score) {
      best = {
        point,
        orbit,
        score,
      };
    }

    if (orbit.usable && orbit.escapedAt === null) {
      break;
    }
  }

  return best;
}

async function createPerturbationTileGrid({
  left,
  top,
  stepX,
  stepY,
  safeWidth,
  safeHeight,
  maxIterations,
  tileSize,
  signal,
}: {
  left: DecimalCoordinate;
  top: DecimalCoordinate;
  stepX: DecimalCoordinate;
  stepY: DecimalCoordinate;
  safeWidth: number;
  safeHeight: number;
  maxIterations: number;
  tileSize: number;
  signal?: AbortSignal;
}): Promise<PerturbationTileGrid | null> {
  const tiles: PerturbationTileReference[][] = [];

  for (let startY = 0; startY < safeHeight; startY += tileSize) {
    if (signal?.aborted) {
      return null;
    }

    const endY = Math.min(startY + tileSize, safeHeight);
    const tileRow: PerturbationTileReference[] = [];

    for (let startX = 0; startX < safeWidth; startX += tileSize) {
      if (signal?.aborted) {
        return null;
      }

      const endX = Math.min(startX + tileSize, safeWidth);
      const reference = selectPerturbationReference(
        left,
        top,
        stepX,
        stepY,
        startX,
        startY,
        endX,
        endY,
        maxIterations
      );

      if (!reference) {
        return null;
      }

      const firstPixel = mapPixelCenterFromGrid(
        left,
        top,
        stepX,
        stepY,
        startX,
        startY
      );
      const deltaXStartNumber = firstPixel.real
        .sub(reference.point.real)
        .toNumber();
      const deltaYStartNumber = firstPixel.imaginary
        .sub(reference.point.imaginary)
        .toNumber();

      if (
        !Number.isFinite(deltaXStartNumber) ||
        !Number.isFinite(deltaYStartNumber)
      ) {
        return null;
      }

      tileRow.push({
        deltaXStartNumber,
        deltaYStartNumber,
        orbit: reference.orbit,
        startX,
        startY,
      });
    }

    tiles.push(tileRow);
    await nextFrame();
  }

  return {
    tileSize,
    tiles,
  };
}

function perturbationTileForPixel(
  tileGrid: PerturbationTileGrid,
  x: number,
  y: number
) {
  return tileGrid.tiles[Math.floor(y / tileGrid.tileSize)]?.[
    Math.floor(x / tileGrid.tileSize)
  ];
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
  const perturbationTileSize = perturbationTileSizeForWidth(viewport.width);
  const perturbationTileGrid = usePerturbationIteration
    ? await createPerturbationTileGrid({
        left,
        top,
        stepX,
        stepY,
        safeWidth,
        safeHeight,
        maxIterations: settings.maxIterations,
        tileSize: perturbationTileSize,
        signal,
      })
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

        let result: EscapeResult;

        if (usePerturbationIteration && perturbationTileGrid) {
          const tile = perturbationTileForPixel(perturbationTileGrid, x, y);
          const perturbationResult = tile
            ? iterateMandelbrotPerturbation(
                tile.deltaXStartNumber + stepXNumber * (x - tile.startX),
                tile.deltaYStartNumber - stepYNumber * (y - tile.startY),
                tile.orbit,
                settings.maxIterations,
                () => ({
                  cx: leftNumber + stepXNumber * (x + 0.5),
                  cy: topNumber - stepYNumber * (y + 0.5),
                })
              )
            : null;

          result =
            perturbationResult ??
            renderDecimalPixel(viewport, size, x, y, settings.maxIterations);
        } else {
          result = useNumberIteration
            ? iterateMandelbrotNumber(
                leftNumber + stepXNumber * (x + 0.5),
                topNumber - stepYNumber * (y + 0.5),
                settings.maxIterations
              )
            : renderDecimalPixel(viewport, size, x, y, settings.maxIterations);
        }
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
