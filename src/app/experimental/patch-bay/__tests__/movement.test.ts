import { readFileSync } from "node:fs";

import { benchTest } from "../campaign";
import { Console } from "../console";
import { BoardDisplay, loadEngine } from "../engine";
import { SpriteMotion } from "../spriteMotion";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

async function openBench() {
  const wasm = Uint8Array.from(
    readFileSync("public/assets/patch-bay/ms-engine.wasm")
  );
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, arrayBuffer: async () => wasm.buffer });
  const engine = await loadEngine();
  const display = new BoardDisplay(
    document.createElement("canvas"),
    new Image()
  );
  const game = new Console(engine, display, jest.fn(), jest.fn());
  let now = 0,
    id = 0;
  const frames = new Map<number, FrameRequestCallback>();
  jest.spyOn(performance, "now").mockImplementation(() => now);
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((f) => {
    frames.set(++id, f);
    return id;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation((n) => {
    frames.delete(n);
  });
  const advance = (ms: number) => {
    const end = now + ms;
    while (now < end) {
      now = Math.min(end, now + 10);
      const pending = [...frames.values()];
      frames.clear();
      for (const f of pending) f(now);
    }
  };
  game.audio.configure(false, false);
  game.load(benchTest());
  return { game, engine, display, advance };
}

it("moves once on a short press at every movement phase, including a tap released before the first tick", async () => {
  const { game, engine, advance } = await openBench();
  for (const phase of [0, 55, 110, 165]) {
    for (const duration of [15, 130]) {
      game.load(benchTest());
      game.play();
      advance(phase);
      const start = engine.position();
      game.press("right", 8);
      advance(duration);
      game.release("right");
      advance(500);
      expect(engine.position()).toBe(start + 1);
    }
  }
});

it("repeats a held direction and stops on release without a trailing step", async () => {
  const { game, engine, advance } = await openBench(),
    start = engine.position();
  game.press("right", 8);
  advance(320);
  expect(engine.position()).toBe(start + 2);
  game.release("right");
  advance(500);
  expect(engine.position()).toBe(start + 2);
});

it("scales held touchpad moves to the drag distance without retriggering on pointer moves", async () => {
  const { game, engine, advance } = await openBench();
  const start = engine.position();
  game.press("thumb", 8, 0.25);
  advance(650);
  expect(engine.position()).toBe(start + 1);
  game.press("thumb", 8, 0.25);
  advance(350);
  expect(engine.position()).toBe(start + 2);
  game.press("thumb", 8, 1);
  advance(250);
  expect(engine.position()).toBe(start + 3);
  game.release("thumb");
  advance(1200);
  expect(engine.position()).toBe(start + 3);
});

it.each([0, 30, 80, 140])(
  "plays a burst of distinct presses in order at %i ms spacing",
  async (spacing) => {
    const { game, engine, advance } = await openBench();
    const start = engine.position();
    const steps: number[] = [];
    jest.spyOn(game.audio, "tick").mockImplementation((mask, moved) => {
      if (moved || mask & (1 << 5)) steps.push(engine.position() - start);
    });
    for (const dir of [8, 8, 8, 8, 2, 2]) {
      game.press("pad", dir);
      game.release("pad");
      advance(spacing);
    }
    advance(1600);
    expect(steps).toEqual([1, 2, 3, 3, 2, 1]);
    expect(engine.chips()).toBe(1);
    expect(engine.position()).toBe(start + 1);
  }
);

it("executes rapid corners on the first frame after each tap, with all intermediate world ticks", async () => {
  const { game, engine, display, advance } = await openBench();
  const directions = [8, 8, 1, 1, 2, 8, 8, 4, 4, 2];
  const offsets = [1, 2, -30, -62, -63, -62, -61, -29, 3, 2];
  const start = engine.position();
  for (const [i, dir] of directions.entries()) {
    game.press("right thumb", dir);
    game.release("right thumb");
    advance(10);
    expect(engine.position()).toBe(start + offsets[i]);
    expect(engine.ticks()).toBe(i * 4);
    advance(38);
  }
  // After release the picture settles and the world returns to its normal rate.
  advance(50);
  expect(display.moving).toBe(false);
  const tick = engine.ticks();
  advance(1100);
  expect(engine.ticks()).toBe(tick + 20);
  expect(engine.position()).toBe(start + 2);
});

it("clears the remaining burst on pause before a second frame can play it", async () => {
  const { game, engine, advance } = await openBench();
  const start = engine.position();
  for (const dir of [8, 8, 8]) game.tap(dir);
  advance(10);
  expect(engine.position()).toBe(start + 1);
  game.pause();
  game.play();
  advance(700);
  expect(engine.position()).toBe(start + 1);
  game.tap(8);
  advance(300);
  expect(engine.position()).toBe(start + 2);
});

it("glides after a step and settles before the next movement beat", async () => {
  const { game, engine, display, advance } = await openBench(),
    start = engine.position();
  game.press("right", 8);
  game.release("right");
  advance(60);
  expect(engine.position()).toBe(start + 1);
  expect(display.moving).toBe(true);
  advance(75);
  expect(display.moving).toBe(true);
  advance(80);
  expect(display.moving).toBe(false);
});

it("animates the ready board without starting the level timer and freezes on pause", async () => {
  const { game, engine, advance } = await openBench();
  const board = benchTest();
  board.record.set([3, 4, 13, 18, 19, 20, 50, 21], 10 + 14 * 32 + 10);
  const pose = jest.spyOn(SpriteMotion.prototype, "frame");
  game.load(board);
  const ticks = engine.ticks();
  advance(350);
  expect(engine.ticks()).toBe(ticks);
  for (const id of [3, 4, 13, 18, 19, 20, 50, 21, 0x6e])
    expect(pose).toHaveBeenCalledWith(id, 1);
  game.press("right", 8);
  game.release("right");
  advance(90);
  expect(pose.mock.calls.some(([id, n]) => id === 0x6f && n >= 3)).toBe(true);
  game.pause();
  pose.mockClear();
  advance(500);
  expect(pose).not.toHaveBeenCalled();
});
