import { iterateMandelbrotNumber } from "@/features/mandelbrot/mandelbrot";
import {
  colorEscapeResult,
  normalizedEscapeValue,
  PALETTE_OPTIONS,
} from "@/features/mandelbrot/palettes";

function luminance([red, green, blue]: readonly number[]): number {
  const linear = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

describe("Mandelbrot palette contrast", () => {
  it.each(PALETTE_OPTIONS)(
    "separates a fast exterior point from the interior in $label",
    ({ id }) => {
      const maxIterations = 2000;
      const exterior = iterateMandelbrotNumber(0.5, 0.5, maxIterations);
      const interior = iterateMandelbrotNumber(0, 0, maxIterations);
      const exteriorColor = colorEscapeResult(exterior, maxIterations, id);
      const interiorColor = colorEscapeResult(interior, maxIterations, id);

      expect(interiorColor).toEqual([4, 8, 22, 255]);
      expect(
        (luminance(exteriorColor) + 0.05) / (luminance(interiorColor) + 0.05)
      ).toBeGreaterThan(3);
    }
  );

  it("retains a range of shades for slow escapes at deep zoom", () => {
    const values = [2800, 3000, 3200, 3400, 3600, 3800].map(
      (smoothIteration) => ({
        escaped: true,
        iterations: Math.floor(smoothIteration),
        smoothIteration,
      })
    );
    const positions = values.map((result) =>
      normalizedEscapeValue(result, 4000)
    );

    expect(Math.max(...positions) - Math.min(...positions)).toBeGreaterThan(
      0.5
    );
    for (const { id } of PALETTE_OPTIONS) {
      const colors = values.map((result) =>
        colorEscapeResult(result, 4000, id).join(",")
      );
      expect(new Set(colors).size).toBe(values.length);
    }
  });

  it("keeps an escaped point's color stable when the iteration budget increases", () => {
    const result = iterateMandelbrotNumber(0.5, 0.5, 100);
    for (const { id } of PALETTE_OPTIONS) {
      expect(colorEscapeResult(result, 4000, id)).toEqual(
        colorEscapeResult(result, 100, id)
      );
    }
  });
});
