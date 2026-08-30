import {
  MandelbrotSettings,
  PaletteId,
  PixelSize,
  PreciseViewport,
  RenderBackendPreference,
} from "@/features/mandelbrot/types";
import { createViewport } from "@/features/mandelbrot/viewport";

type QueryRecord = Record<string, string | string[] | undefined>;

const VALID_PALETTES: Readonly<Record<PaletteId, true>> = {
  oceanic: true,
  ember: true,
  glacier: true,
};
const VALID_RENDER_BACKENDS: Readonly<Record<RenderBackendPreference, true>> = {
  auto: true,
  webgpu: true,
  cpu: true,
};
const MAX_DECIMAL_QUERY_LENGTH = 128;
const DECIMAL_QUERY_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const VALID_RESOLUTION_SCALES = new Set([0.5, 0.75, 1]);

function isStrictDecimalQuery(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_DECIMAL_QUERY_LENGTH &&
    DECIMAL_QUERY_PATTERN.test(value)
  );
}

function parseStrictInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseStrictResolutionScale(value: unknown): number | null {
  if (typeof value !== "string" || !DECIMAL_QUERY_PATTERN.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && VALID_RESOLUTION_SCALES.has(parsed)
    ? parsed
    : null;
}

function isPaletteId(value: string): value is PaletteId {
  return Object.hasOwn(VALID_PALETTES, value);
}

function isRenderBackendPreference(
  value: string
): value is RenderBackendPreference {
  return Object.hasOwn(VALID_RENDER_BACKENDS, value);
}

export function parseViewportFromQuery(
  searchParams: QueryRecord,
  size: PixelSize
): PreciseViewport | null {
  const centerX = searchParams.cx;
  const centerY = searchParams.cy;
  const width = searchParams.w;

  if (
    !isStrictDecimalQuery(centerX) ||
    !isStrictDecimalQuery(centerY) ||
    !isStrictDecimalQuery(width)
  ) {
    return null;
  }

  try {
    return createViewport({
      centerX,
      centerY,
      width,
      size,
    });
  } catch {
    return null;
  }
}

export function parseSettingsFromQuery(
  searchParams: QueryRecord,
  fallback: MandelbrotSettings
): MandelbrotSettings {
  const maxIterations = parseStrictInteger(searchParams.iter);
  const resolutionScale = parseStrictResolutionScale(searchParams.quality);
  const paletteId = searchParams.palette;
  const renderBackendPreference = searchParams.backend;

  return {
    maxIterations:
      maxIterations !== null && maxIterations >= 25
        ? Math.min(maxIterations, 4000)
        : fallback.maxIterations,
    paletteId:
      typeof paletteId === "string" && isPaletteId(paletteId)
        ? paletteId
        : fallback.paletteId,
    resolutionScale:
      resolutionScale !== null ? resolutionScale : fallback.resolutionScale,
    renderBackendPreference:
      typeof renderBackendPreference === "string" &&
      isRenderBackendPreference(renderBackendPreference)
        ? renderBackendPreference
        : fallback.renderBackendPreference,
  };
}
