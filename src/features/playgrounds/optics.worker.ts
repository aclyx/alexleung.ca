import {
  displayChannel,
  RENDER_HEIGHT,
  RENDER_WIDTH,
  RenderSettings,
  traceSample,
} from "./optics";

let settings: RenderSettings;
let sums = new Float32Array(RENDER_WIDTH * RENDER_HEIGHT * 3);
let samples = 0,
  limit = 32,
  paused = false;
let timer: ReturnType<typeof setTimeout> | undefined;
function render() {
  if (paused || samples >= limit) return;
  for (let y = 0; y < RENDER_HEIGHT; y++)
    for (let x = 0; x < RENDER_WIDTH; x++) {
      const result = traceSample(x, y, samples, settings);
      const at = (y * RENDER_WIDTH + x) * 3;
      for (let channel = 0; channel < 3; channel++)
        sums[at + channel] += result.color[channel];
    }
  samples++;
  if (samples <= 8 || samples % 4 === 0 || samples === limit) {
    const pixels = new Uint8ClampedArray(RENDER_WIDTH * RENDER_HEIGHT * 4);
    for (let i = 0; i < RENDER_WIDTH * RENDER_HEIGHT; i++) {
      for (let channel = 0; channel < 3; channel++)
        pixels[i * 4 + channel] = displayChannel(
          sums[i * 3 + channel] / samples
        );
      pixels[i * 4 + 3] = 255;
    }
    self.postMessage(
      { pixels, samples, done: samples >= limit },
      { transfer: [pixels.buffer] }
    );
  }
  timer = setTimeout(render, 0);
}
self.onmessage = (
  event: MessageEvent<
    | { type: "start"; settings: RenderSettings }
    | { type: "pause" | "resume" | "refine" }
  >
) => {
  clearTimeout(timer);
  if (event.data.type === "start") {
    settings = event.data.settings;
    sums = new Float32Array(RENDER_WIDTH * RENDER_HEIGHT * 3);
    samples = 0;
    limit = 32;
    paused = false;
  }
  if (event.data.type === "pause") paused = true;
  if (event.data.type === "resume") paused = false;
  if (event.data.type === "refine") {
    limit = 128;
    paused = false;
  }
  if (settings) timer = setTimeout(render, 0);
};
