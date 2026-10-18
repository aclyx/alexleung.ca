import {
  DEFAULT_RENDER,
  displayChannel,
  glassDirection,
  intersectScene,
  projectPoint,
  reflect,
  traceSample,
} from "../optics";

describe("sampled 3D light transport", () => {
  it("reflects with equal angles and obeys Snell refraction", () => {
    const reflected = reflect([Math.SQRT1_2, -Math.SQRT1_2, 0], [0, 1, 0]);
    expect(reflected[0]).toBeCloseTo(Math.SQRT1_2);
    expect(reflected[1]).toBeCloseTo(Math.SQRT1_2);
    const transmitted = glassDirection(
      [0.5, -Math.sqrt(0.75), 0],
      [0, 1, 0],
      1 / 1.5,
      0.9
    );
    expect(transmitted.reflected).toBe(false);
    expect(transmitted.direction[0]).toBeCloseTo(1 / 3);
    expect(Math.hypot(...transmitted.direction)).toBeCloseTo(1);
  });
  it("reflects above the critical angle and samples Fresnel at normal incidence", () => {
    expect(
      glassDirection([Math.sqrt(0.75), -0.5, 0], [0, 1, 0], 1.5, 0.99).reflected
    ).toBe(true);
    expect(glassDirection([0, -1, 0], [0, 1, 0], 1 / 1.5, 0.01).reflected).toBe(
      true
    );
    expect(
      glassDirection([0, -1, 0], [0, 1, 0], 1 / 1.5, 0.5).direction
    ).toEqual([0, -1, 0]);
  });
  it("finds the closest surface, including sphere interiors and the finite lamp", () => {
    expect(
      intersectScene([-0.82, 0.68, 3], [0, 0, -1], DEFAULT_RENDER)?.name
    ).toBe("Mirror sphere");
    const inside = intersectScene(
      [0.75, 0.76, 0.45],
      [1, 0, 0],
      DEFAULT_RENDER
    );
    expect(inside?.material).toBe("glass");
    expect(inside?.front).toBe(false);
    expect(inside?.t).toBeCloseTo(0.76);
    expect(
      intersectScene([-0.5, 2, 0.2], [0, 1, 0], DEFAULT_RENDER)?.name
    ).toBe("Area light");
    expect(intersectScene([1.5, 2, 1.5], [0, 1, 0], DEFAULT_RENDER)?.name).toBe(
      "Ceiling"
    );
  });
  it("records exactly the sample being rendered without changing its color", () => {
    expect(traceSample(100, 150, 7, DEFAULT_RENDER, true).color).toEqual(
      traceSample(100, 150, 7, DEFAULT_RENDER).color
    );
    expect(traceSample(100, 150, 7, DEFAULT_RENDER)).toEqual(
      traceSample(100, 150, 7, DEFAULT_RENDER)
    );
  });
  it("keeps samples finite, nonnegative and bounded", () => {
    let total = 0;
    for (let y = 0; y < 240; y += 15)
      for (let x = 0; x < 320; x += 15) {
        const result = traceSample(x, y, 3, DEFAULT_RENDER, true);
        expect(result.segments.length).toBeLessThanOrEqual(14);
        for (const value of result.color) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          total += value;
        }
      }
    expect(total).toBeGreaterThan(1);
  });
  it("changes the light solution when materials and depth change", () => {
    const pixels = [
      [90, 160],
      [145, 180],
      [120, 100],
      [245, 150],
    ];
    const sum = (settings: typeof DEFAULT_RENDER) =>
      pixels.map(([x, y]) =>
        Array.from(
          { length: 8 },
          (_, sample) => traceSample(x, y, sample, settings).color
        )
      );
    expect(
      sum({ ...DEFAULT_RENDER, polished: false, lightX: 1.2, bounces: 1 })
    ).not.toEqual(sum(DEFAULT_RENDER));
    const p = projectPoint([
      DEFAULT_RENDER.lightX,
      2.96,
      DEFAULT_RENDER.lightZ,
    ]);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(320);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(240);
    expect(displayChannel(0)).toBe(0);
    expect(displayChannel(10)).toBeGreaterThan(displayChannel(1));
  });
});
