import { EscapeResult, PaletteId } from "@/features/mandelbrot/types";

type Rgb = readonly [number, number, number];

const INTERIOR_COLOR: Rgb = [4, 8, 22];
const PALETTES: Record<PaletteId, readonly Rgb[]> = {
  oceanic: [
    [7, 12, 28],
    [15, 44, 78],
    [24, 88, 138],
    [53, 136, 186],
    [155, 209, 229],
    [246, 246, 210],
  ],
  ember: [
    [24, 7, 30],
    [76, 15, 56],
    [145, 36, 49],
    [212, 86, 38],
    [247, 157, 61],
    [255, 233, 148],
  ],
  glacier: [
    [7, 14, 28],
    [23, 54, 87],
    [45, 105, 134],
    [92, 165, 168],
    [170, 219, 202],
    [243, 250, 244],
  ],
};

function interpolate(left: number, right: number, amount: number): number {
  return Math.round(left + (right - left) * amount);
}

function paletteColorAt(paletteId: PaletteId, value: number): Rgb {
  const palette = PALETTES[paletteId];
  const clamped = Math.min(Math.max(value, 0), 1);
  const scaled = clamped * (palette.length - 1);
  const leftIndex = Math.floor(scaled);
  const rightIndex = Math.min(leftIndex + 1, palette.length - 1);
  const amount = scaled - leftIndex;
  const left = palette[leftIndex];
  const right = palette[rightIndex];

  return [
    interpolate(left[0], right[0], amount),
    interpolate(left[1], right[1], amount),
    interpolate(left[2], right[2], amount),
  ];
}

export function normalizedEscapeValue(
  result: EscapeResult,
  maxIterations: number
): number {
  if (!result.escaped) {
    return 0;
  }

  return result.smoothIteration / maxIterations;
}

export function colorEscapeResult(
  result: EscapeResult,
  maxIterations: number,
  paletteId: PaletteId
): [number, number, number, number] {
  if (!result.escaped) {
    return [...INTERIOR_COLOR, 255];
  }

  const [red, green, blue] = paletteColorAt(
    paletteId,
    normalizedEscapeValue(result, maxIterations)
  );

  return [red, green, blue, 255];
}

export const PALETTE_OPTIONS: ReadonlyArray<{
  id: PaletteId;
  label: string;
}> = [
  { id: "oceanic", label: "Oceanic" },
  { id: "ember", label: "Ember" },
  { id: "glacier", label: "Glacier" },
];
