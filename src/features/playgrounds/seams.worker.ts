import { energyMap, lowestSeam, Raster, removeSeam } from "./seams";

self.onmessage = (event: MessageEvent<{ image: Raster; width: number }>) => {
  let image = event.data.image;
  const target = Math.max(
    Math.ceil(image.width / 2),
    Math.min(image.width, Math.round(event.data.width))
  );
  let removed = 0;
  while (image.width > target) {
    const seam = lowestSeam(energyMap(image), image.width, image.height);
    if (!seam) {
      self.postMessage({ image, done: true, blocked: true });
      return;
    }
    image = removeSeam(image, seam);
    if (++removed % 12 === 0)
      self.postMessage({ image, done: false, blocked: false });
  }
  self.postMessage({ image, done: true, blocked: false });
};
