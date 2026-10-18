import {
  energyMap,
  lowestSeam,
  paintProtection,
  Raster,
  removeSeam,
  sampleImage,
} from "../seams";

describe("vertical seam carving", () => {
  it("finds the global minimum rather than greedily choosing each row", () => {
    const energy = new Float64Array([
      0, 4, 4, 4, 100, 100, 1, 1, 0, 100, 100, 0,
    ]);
    const seam = lowestSeam(energy, 4, 3)!;
    let best = Infinity;
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++)
        for (let c = 0; c < 4; c++)
          if (Math.abs(a - b) <= 1 && Math.abs(b - c) <= 1)
            best = Math.min(best, energy[a] + energy[4 + b] + energy[8 + c]);
    expect(seam.reduce((sum, x, y) => sum + energy[y * 4 + x], 0)).toBe(best);
    expect(seam).toHaveLength(3);
    seam
      .slice(1)
      .forEach((x, y) => expect(Math.abs(x - seam[y])).toBeLessThanOrEqual(1));
  });
  it("uses zero energy for a flat image and infinite energy for protection", () => {
    const image: Raster = {
      width: 3,
      height: 3,
      pixels: new Uint8ClampedArray(36).fill(255),
      protected: new Uint8Array(9),
    };
    expect(Array.from(energyMap(image))).toEqual(new Array(9).fill(0));
    const protectedImage = paintProtection(image, 1, 1, 0, true);
    expect(energyMap(protectedImage)[4]).toBe(Infinity);
    expect(image.protected[4]).toBe(0);
    expect(lowestSeam(energyMap(protectedImage), 3, 3)?.[1]).not.toBe(1);
  });
  it("stops when a fully protected row blocks every path", () => {
    expect(
      lowestSeam(
        new Float64Array([0, 0, 0, Infinity, Infinity, Infinity, 0, 0, 0]),
        3,
        3
      )
    ).toBeNull();
    expect(lowestSeam(new Float64Array(3), 1, 3)).toBeNull();
  });
  it("removes the exact pixel and carries protection with its source pixel", () => {
    const image: Raster = {
      width: 3,
      height: 2,
      pixels: Uint8ClampedArray.from({ length: 24 }, (_, i) => i),
      protected: new Uint8Array([0, 0, 1, 0, 1, 0]),
    };
    const next = removeSeam(image, [1, 0]);
    expect(next.width).toBe(2);
    expect(Array.from(next.pixels)).toEqual([
      ...image.pixels.slice(0, 4),
      ...image.pixels.slice(8, 12),
      ...image.pixels.slice(16),
    ]);
    expect(Array.from(next.protected)).toEqual([0, 1, 1, 0]);
    expect(image.width).toBe(3);
  });
  it("rejects disconnected and out-of-bounds seams", () => {
    const image = sampleImage();
    expect(() => removeSeam(image, [1])).toThrow();
    expect(() =>
      removeSeam(image, new Array(image.height).fill(240))
    ).toThrow();
    const seam = new Array(image.height).fill(0);
    seam[1] = 5;
    expect(() => removeSeam(image, seam)).toThrow();
  });
  it("protects and erases without changing source pixels", () => {
    const image = sampleImage(),
      painted = paintProtection(image, 170, 80, 8, true);
    expect(painted.protected.some(Boolean)).toBe(true);
    expect(painted.pixels).toBe(image.pixels);
    expect(
      paintProtection(painted, 170, 80, 8, false).protected.some(Boolean)
    ).toBe(false);
    const seam = lowestSeam(energyMap(painted), painted.width, painted.height)!;
    seam.forEach((x, y) =>
      expect(painted.protected[y * painted.width + x]).toBe(0)
    );
  });
  it("recalculates after each removal and retains image dimensions", () => {
    let image = sampleImage(true);
    for (let i = 0; i < 10; i++) {
      image = removeSeam(
        image,
        lowestSeam(energyMap(image), image.width, image.height)!
      );
    }
    expect(image.width).toBe(230);
    expect(image.height).toBe(160);
    expect(image.pixels.length).toBe(230 * 160 * 4);
    expect(image.protected.length).toBe(230 * 160);
  });
  it("retains every protected pixel through repeated removals", () => {
    let image = paintProtection(sampleImage(true), 20, 80, 18, true);
    const protectedColors = (raster: Raster) =>
      Array.from(raster.protected).flatMap((value, i) =>
        value ? [Array.from(raster.pixels.slice(i * 4, i * 4 + 4))] : []
      );
    const initial = protectedColors(image);
    for (let i = 0; i < 67; i++) {
      const seam = lowestSeam(energyMap(image), image.width, image.height)!;
      expect(seam).not.toBeNull();
      seam.forEach((x, y) =>
        expect(image.protected[y * image.width + x]).toBe(0)
      );
      image = removeSeam(image, seam);
    }
    expect(image.width).toBe(173);
    expect(protectedColors(image)).toEqual(initial);
  });
});
