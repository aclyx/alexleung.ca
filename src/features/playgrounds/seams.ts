export type Raster = {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  protected: Uint8Array;
};
export function energyMap(image: Raster) {
  const { width, height, pixels } = image;
  const energy = new Float64Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (image.protected[index]) {
        energy[index] = Infinity;
        continue;
      }
      const left = (y * width + Math.max(0, x - 1)) * 4,
        right = (y * width + Math.min(width - 1, x + 1)) * 4;
      const up = (Math.max(0, y - 1) * width + x) * 4,
        down = (Math.min(height - 1, y + 1) * width + x) * 4;
      for (let channel = 0; channel < 3; channel++)
        energy[index] +=
          Math.abs(pixels[right + channel] - pixels[left + channel]) +
          Math.abs(pixels[down + channel] - pixels[up + channel]);
    }
  return energy;
}
export function lowestSeam(
  energy: Float64Array,
  width: number,
  height: number
): number[] | null {
  if (width < 2 || height < 1 || energy.length !== width * height) return null;
  const costs = new Float64Array(energy),
    parents = new Int32Array(width * height);
  for (let y = 1; y < height; y++)
    for (let x = 0; x < width; x++) {
      let best = x;
      for (
        let previous = Math.max(0, x - 1);
        previous <= Math.min(width - 1, x + 1);
        previous++
      )
        if (costs[(y - 1) * width + previous] < costs[(y - 1) * width + best])
          best = previous;
      costs[y * width + x] += costs[(y - 1) * width + best];
      parents[y * width + x] = best;
    }
  let x = 0;
  for (let col = 1; col < width; col++)
    if (costs[(height - 1) * width + col] < costs[(height - 1) * width + x])
      x = col;
  if (!Number.isFinite(costs[(height - 1) * width + x])) return null;
  const seam = new Array<number>(height);
  for (let y = height - 1; y >= 0; y--) {
    seam[y] = x;
    x = parents[y * width + x];
  }
  return seam;
}
export function removeSeam(image: Raster, seam: number[]): Raster {
  const { width, height } = image;
  if (
    width < 2 ||
    seam.length !== height ||
    seam.some(
      (x, y) =>
        !Number.isInteger(x) ||
        x < 0 ||
        x >= width ||
        (y > 0 && Math.abs(x - seam[y - 1]) > 1)
    )
  )
    throw new Error("Invalid vertical seam");
  const pixels = new Uint8ClampedArray((width - 1) * height * 4),
    mask = new Uint8Array((width - 1) * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width - 1; x++) {
      const source = y * width + x + (x >= seam[y] ? 1 : 0),
        target = y * (width - 1) + x;
      pixels.set(image.pixels.subarray(source * 4, source * 4 + 4), target * 4);
      mask[target] = image.protected[source];
    }
  return { width: width - 1, height, pixels, protected: mask };
}
export function paintProtection(
  image: Raster,
  cx: number,
  cy: number,
  radius: number,
  protect: boolean
): Raster {
  const mask = new Uint8Array(image.protected);
  for (
    let y = Math.max(0, cy - radius);
    y <= Math.min(image.height - 1, cy + radius);
    y++
  )
    for (
      let x = Math.max(0, cx - radius);
      x <= Math.min(image.width - 1, cx + radius);
      x++
    )
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius)
        mask[y * image.width + x] = protect ? 1 : 0;
  return { ...image, protected: mask };
}
export function sampleImage(pattern = false): Raster {
  const width = 240,
    height = 160,
    pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let color = [197 - y / 7, 218 - y / 9, 228 - y / 11];
      if (y > 92) color = [49 + y / 6, 119 + y / 10, 142 + y / 12];
      if (y > 130 - x * 0.18) color = [102, 129, 101];
      if (x > 156 && x < 183 && y > 37 && y < 128)
        color = y % 28 < 14 ? [228, 224, 207] : [173, 69, 53];
      if (x > 151 && x < 188 && y >= 27 && y <= 39) color = [43, 57, 66];
      if (x > 161 && x < 178 && y > 13 && y < 27) color = [247, 202, 103];
      if (x > 155 && x < 184 && y > 8 && y <= 13) color = [173, 69, 53];
      if (pattern) {
        color = [207, 191, 166];
        if (x % 40 > 5 && x % 40 < 34 && y % 40 > 6 && y % 40 < 33)
          color = [51, 80, 99];
        if (x % 40 === 20 || y % 40 === 20) color = [235, 221, 194];
      }
      const index = (y * width + x) * 4;
      pixels.set([...color, 255], index);
    }
  return { width, height, pixels, protected: new Uint8Array(width * height) };
}
