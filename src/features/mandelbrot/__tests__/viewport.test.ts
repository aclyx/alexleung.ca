import {
  createDefaultViewport,
  createViewport,
  magnificationFromViewport,
  mapViewportPoint,
  panViewport,
  precisionForWidth,
  zoomViewportAtPoint,
} from "@/features/mandelbrot/viewport";

const size = { width: 800, height: 400 };

describe("mandelbrot viewport math", () => {
  it("maps pixels into the complex plane using arbitrary-precision viewport state", () => {
    const viewport = createDefaultViewport(size);
    const centerPoint = mapViewportPoint(viewport, size, { x: 400, y: 200 });
    const topLeftPoint = mapViewportPoint(viewport, size, { x: 0, y: 0 });

    expect(centerPoint.real.toString()).toBe("-0.75");
    expect(centerPoint.imaginary.toString()).toBe("0");
    expect(topLeftPoint.real.toString()).toBe("-2.5");
    expect(topLeftPoint.imaginary.toString()).toBe("0.875");
  });

  it("zooms around the selected pixel while preserving its mapped coordinate", () => {
    const viewport = createDefaultViewport(size);
    const pointer = { x: 600, y: 100 };
    const before = mapViewportPoint(viewport, size, pointer);
    const zoomed = zoomViewportAtPoint(viewport, size, pointer, 0.5);
    const after = mapViewportPoint(zoomed, size, pointer);

    expect(zoomed.width.toString()).toBe("1.75");
    expect(zoomed.height.toString()).toBe("0.875");
    expect(after.real.toString()).toBe(before.real.toString());
    expect(after.imaginary.toString()).toBe(before.imaginary.toString());
  });

  it("pans by translating the viewport center in screen space", () => {
    const viewport = createDefaultViewport(size);
    const panned = panViewport(viewport, size, { x: 80, y: 40 });

    expect(panned.centerX.toString()).toBe("-1.1");
    expect(panned.centerY.toString()).toBe("0.175");
  });

  it("accepts the minimum width and clamps further zooming at that floor", () => {
    const deepViewport = createViewport({
      centerX: "-0.743643887037151",
      centerY: "0.13182590420533",
      width: "1e-40",
      size,
    });
    const zoomed = zoomViewportAtPoint(
      deepViewport,
      size,
      { x: 400, y: 200 },
      0.5
    );

    expect(precisionForWidth(zoomed.width)).toBe(72);
    expect(zoomed.width.toExponential()).toBe("1e-40");
    expect(magnificationFromViewport(zoomed).toExponential()).toBe("3.5e+40");
  });

  it("accepts the maximum width and clamps zooming out at that ceiling", () => {
    const widestViewport = createViewport({
      centerX: "-0.75",
      centerY: "0",
      width: "8",
      size,
    });
    const zoomed = zoomViewportAtPoint(
      widestViewport,
      size,
      { x: 400, y: 200 },
      2
    );

    expect(zoomed.width.toString()).toBe("8");
    expect(zoomed.centerX.toString()).toBe("-0.75");
    expect(zoomed.centerY.toString()).toBe("0");
  });

  it.each(["0", "-1", "1e-41", "8.0000001", "Infinity"])(
    "rejects the out-of-range viewport width %s",
    (width) => {
      expect(() =>
        createViewport({
          centerX: "0",
          centerY: "0",
          width,
          size,
        })
      ).toThrow(/Viewport width must be between .* and 8/);
    }
  );
});
