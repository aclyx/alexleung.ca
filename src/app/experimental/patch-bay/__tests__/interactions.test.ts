import { readFileSync } from "node:fs";

import { benchTest } from "../campaign";
import { BoardDisplay, loadEngine, startBoard, type Engine } from "../engine";

const wasm = Uint8Array.from(
  readFileSync("public/assets/patch-bay/ms-engine.wasm")
);
let engine: Engine;
beforeAll(async () => {
  const originalFetch = global.fetch;
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, arrayBuffer: async () => wasm.buffer });
  try {
    engine = await loadEngine();
  } finally {
    global.fetch = originalFetch;
  }
});

// The workbench's top layer is uncompressed. Put each device directly east of Chip.
const spawn = 15 * 32 + 13;
function approach(...tiles: number[]) {
  const board = benchTest();
  board.record.set(tiles, 10 + spawn + 1);
  startBoard(engine, board);
  engine.step(8);
  return engine.sounds();
}

it("sounds the green switch when Chip presses it or pushes a block onto it", () => {
  expect(approach(0x23, 0, 0x25) & (1 << 26)).toBeTruthy();
  expect(engine.cell(spawn + 3) & 255).toBe(0x26);
  engine.step(0);
  expect(engine.sounds() & (1 << 26)).toBe(0);
  const pushed = approach(0x0a, 0x23, 0x25);
  expect(pushed & (1 << 18)).toBeTruthy();
  expect(pushed & (1 << 26)).toBeTruthy();
  expect(engine.cell(spawn + 3) & 255).toBe(0x26);
});

it("sounds the switch when a tank drives onto it while Chip stands still", () => {
  const board = benchTest();
  const record = new Uint8Array(board.record.length + 4);
  record.set(board.record);
  record.set([0x4f, 0x23, 0x25], 10 + spawn + 1); // East-facing tank, switch, wall.
  record.set([4, 0, 10, 2, 14, 15], board.record.length - 2); // Windows ordered actor list.
  startBoard(engine, { ...board, record });
  for (let tick = 0; tick <= 4; tick++) engine.step(0);
  expect(engine.position()).toBe(spawn);
  expect(engine.cell(spawn + 3) & 255).toBe(0x26);
  expect(engine.sounds() & (1 << 26)).toBeTruthy();
});

it.each(["Chip", "tank"])(
  "draws the fallen robot and its attacker when %s moves into the collision",
  (mover) => {
    const board = benchTest();
    const record = new Uint8Array(board.record.length + 4);
    record.set(board.record);
    record[10 + spawn + 1] = 0x4d; // West-facing tank beside Chip.
    record.set([4, 0, 10, 2, 14, 15], board.record.length - 2);
    startBoard(engine, { ...board, record });
    if (mover === "Chip") engine.step(8);
    else for (let t = 0; t <= 4; t++) engine.step(0);
    expect(engine.cause()).toBe(5);

    const atlas = new Image();
    const canvas = document.createElement("canvas");
    const terrain = canvas.getContext("2d")!;
    const screen = canvas.getContext("2d")!;
    screen.strokeRect = jest.fn();
    jest
      .mocked(HTMLCanvasElement.prototype.getContext)
      .mockReturnValueOnce(terrain)
      .mockReturnValueOnce(screen);
    new BoardDisplay(canvas, atlas).draw(engine, 0, true, true);

    // The workbench collision is in the center tile of the 9 × 9 display.
    const tile = 96;
    const spriteAtImpact = (id: number) => [
      atlas,
      (id % 16) * tile,
      Math.floor(id / 16) * tile,
      tile,
      tile,
      4 * tile,
      4 * tile,
      tile,
      tile,
    ];
    expect(terrain.drawImage).toHaveBeenCalledWith(...spriteAtImpact(0x4d));
    expect(screen.drawImage).toHaveBeenLastCalledWith(...spriteAtImpact(0x36));
    for (const id of [0x6c, 0x6d, 0x6e, 0x6f])
      expect(terrain.drawImage).not.toHaveBeenCalledWith(...spriteAtImpact(id));
  }
);

it("draws the blast casualty after Chip steps onto a bomb", () => {
  approach(0x2a);
  expect(engine.cause()).toBe(3);
  const screen = document.createElement("canvas").getContext("2d")!;
  screen.strokeRect = jest.fn();
  const atlas = new Image();
  jest
    .mocked(HTMLCanvasElement.prototype.getContext)
    .mockReturnValueOnce(screen)
    .mockReturnValueOnce(screen);
  new BoardDisplay(document.createElement("canvas"), atlas).draw(
    engine,
    0,
    true,
    true
  );
  expect(screen.drawImage).toHaveBeenLastCalledWith(
    atlas,
    5 * 96,
    3 * 96,
    96,
    96,
    4 * 96,
    4 * 96,
    96,
    96
  );
});

it.each<[string, number, number]>([
  ["blue button", 0x28, 12],
  ["red button", 0x24, 12],
  ["brown button", 0x27, 12],
  ["hint", 0x2f, 27],
  ["dirt", 0x0b, 13],
  ["passable blue wall", 0x1e, 13],
  ["recessed wall", 0x2e, 14],
  ["hidden wall", 0x2c, 14],
  ["bear trap", 0x2b, 15],
  ["water", 0x03, 17],
  ["fire", 0x04, 25],
  ["ice", 0x0c, 19],
  ["force floor", 0x13, 21],
  ["bomb", 0x2a, 16],
  ["chip", 0x02, 6],
  ["key", 0x65, 7],
  ["thief", 0x21, 8],
  ["wall bump", 0x01, 5],
])("emits the %s cue on contact", (_name, tile, bit) => {
  expect(approach(tile) & (1 << bit)).toBeTruthy();
});
