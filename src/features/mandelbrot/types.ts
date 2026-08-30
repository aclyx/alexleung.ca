import Decimal from "decimal.js";

type PreciseDecimal = Decimal;

export type ComplexPoint = {
  real: PreciseDecimal;
  imaginary: PreciseDecimal;
};

export type PreciseViewport = {
  centerX: PreciseDecimal;
  centerY: PreciseDecimal;
  width: PreciseDecimal;
  height: PreciseDecimal;
};

export type PixelSize = {
  width: number;
  height: number;
};

export type CanvasPoint = {
  x: number;
  y: number;
};

export type PaletteId = "oceanic" | "ember" | "glacier";
export type RenderBackend = "cpu" | "webgpu";
export type RenderBackendPreference = "auto" | "cpu" | "webgpu";

export type MandelbrotSettings = {
  maxIterations: number;
  paletteId: PaletteId;
  resolutionScale: number;
  renderBackendPreference: RenderBackendPreference;
};

export type EscapeResult = {
  escaped: boolean;
  iterations: number;
  smoothIteration: number;
};

type RenderChunk = {
  startRow: number;
  rowCount: number;
  pixels: Uint8ClampedArray<ArrayBuffer>;
};

export type RenderRequest = {
  viewport: PreciseViewport;
  size: PixelSize;
  settings: MandelbrotSettings;
  gpuTargetCanvas?: HTMLCanvasElement | null;
  signal?: AbortSignal;
  onChunk: (chunk: RenderChunk) => void;
};
