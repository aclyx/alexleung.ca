import type { Board } from "./campaign";
import {
  animatedTerrain,
  SpriteMotion,
  switches,
  tileSize,
} from "./spriteMotion";

export interface Engine {
  memory: WebAssembly.Memory;
  buffer(): number;
  start(length: number, seed: number, phase: number): number;
  step(command: number): number;
  inputPending(): number;
  cell(pos: number): number;
  position(): number;
  chips(): number;
  ticks(): number;
  equipment(slot: number): number;
  hint(): number;
  cause(): number;
  sounds(): number;
}
function isEngine(value: object): value is Engine {
  return (
    "memory" in value &&
    value.memory instanceof WebAssembly.Memory &&
    [
      "buffer",
      "start",
      "step",
      "inputPending",
      "cell",
      "position",
      "chips",
      "ticks",
      "equipment",
      "hint",
      "cause",
      "sounds",
    ].every((name) => typeof Reflect.get(value, name) === "function")
  );
}
export async function loadEngine(): Promise<Engine> {
  const response = await fetch("/assets/patch-bay/ms-engine.wasm");
  if (!response.ok) throw Error("The rules engine could not be loaded.");
  const { instance } = await WebAssembly.instantiate(
    await response.arrayBuffer()
  );
  if (!isEngine(instance.exports)) throw Error("Invalid rules engine.");
  return instance.exports;
}
export function startBoard(engine: Engine, board: Board) {
  const [seed, phase] = crypto.getRandomValues(new Uint32Array(2));
  new Uint8Array(
    engine.memory.buffer,
    engine.buffer(),
    board.record.length
  ).set(board.record);
  if (!engine.start(board.record.length, seed, phase & 4))
    throw Error("This board could not be opened.");
}
const viewSize = 9;
// A fractional camera position can expose part of a tenth row and column.
const cacheSize = viewSize + 1;
const glideMs = 145;
const idlePoses = [0, 0, 1, 2, 2, 1, 0, 0];
const collisionSprite = 0x36; // Windows leaves this tile ID unused.
const cameraOrigin = (value: number) =>
  Math.round(Math.max(0, Math.min(32 - viewSize, value - 4)) * tileSize) /
  tileSize;

export class BoardDisplay {
  private previous = new Int32Array(cacheSize * cacheSize).fill(-1);
  private occupants = new Int16Array(1024).fill(-1);
  private arrivals = new Float64Array(1024);
  private context: CanvasRenderingContext2D;
  private terrain: CanvasRenderingContext2D;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  private cell = -1;
  private fromX = 0;
  private fromY = 0;
  private started = -Infinity;
  private duration = glideMs;
  private cacheLeft = -1;
  private cacheTop = -1;
  private playerSprite = 0;
  private phase = -1;
  private playerPose = 0;
  private stride = false;
  private motion: SpriteMotion;
  moving = false;

  constructor(
    canvas: HTMLCanvasElement,
    private atlas: HTMLImageElement
  ) {
    const layer = document.createElement("canvas");
    layer.width = layer.height = cacheSize * tileSize;
    const terrain = layer.getContext("2d", { alpha: false });
    const context = canvas.getContext("2d", { alpha: false });
    if (!terrain || !context)
      throw Error("A 2D canvas is needed to draw the board.");
    this.motion = new SpriteMotion(atlas);
    this.terrain = terrain;
    this.context = context;
  }

  private sprite(
    ctx: CanvasRenderingContext2D,
    id: number,
    x: number,
    y: number,
    pose = 0
  ) {
    if (pose) {
      ctx.drawImage(this.motion.frame(id, pose), x, y);
      return;
    }
    ctx.drawImage(
      this.atlas,
      (id % 16) * tileSize,
      Math.floor(id / 16) * tileSize,
      tileSize,
      tileSize,
      x,
      y,
      tileSize,
      tileSize
    );
  }

  draw(
    engine: Engine,
    now: number,
    refresh: boolean,
    snap = false,
    animate = true
  ) {
    const phase =
      animate && !this.reduced.matches ? Math.floor(now / 130) % 8 : 0;
    const phaseChanged = phase !== this.phase;
    if (!refresh && !snap && !this.moving && !phaseChanged) return;
    this.phase = phase;
    const next = engine.position(),
      destX = next % 32,
      destY = Math.floor(next / 32);
    const cause = engine.cause();
    const hitByCreature = cause === 5;
    const changed = next !== this.cell;
    const wasMoving = this.moving;
    if (changed) {
      const distance =
        Math.abs(destX - (this.cell % 32)) +
        Math.abs(destY - Math.floor(this.cell / 32));
      this.moving = this.cell >= 0 && distance === 1;
      if (this.moving && !snap) this.stride = !this.stride;
      // Finish the previous tile at a turn. A burst can change direction
      // faster than a normal glide, especially around a one-tile corner.
      this.fromX = this.cell % 32;
      this.fromY = Math.floor(this.cell / 32);
      this.duration = Math.min(glideMs, Math.max(1, now - this.started));
      this.started = now;
      this.cell = next;
    }
    if (snap || this.reduced.matches) this.moving = false;
    if (snap) this.started = -Infinity;
    const progress = this.moving
      ? Math.min(1, Math.max(0, (now - this.started) / this.duration))
      : 1;
    const blend = progress * progress * (3 - 2 * progress);
    const playerX = this.fromX + (destX - this.fromX) * blend;
    const playerY = this.fromY + (destY - this.fromY) * blend;
    this.moving = progress < 1;
    const cameraX = cameraOrigin(playerX),
      cameraY = cameraOrigin(playerY);
    const left = Math.floor(cameraX),
      top = Math.floor(cameraY);
    const shifted = left !== this.cacheLeft || top !== this.cacheTop;
    let dirty = changed || wasMoving || this.moving || snap || shifted;
    if (refresh || shifted || snap || phaseChanged) {
      if (shifted) this.previous.fill(-1);
      if (snap) this.occupants.fill(-1);
      this.cacheLeft = left;
      this.cacheTop = top;
      const upper = engine.cell(next) & 255;
      const swimmer = upper >= 0x3c && upper <= 0x3f;
      const player = swimmer || (upper >= 0x6c && upper <= 0x6f) ? upper : 0;
      const foreground = hitByCreature
        ? collisionSprite
        : cause === 3
          ? 0x35
          : player;
      dirty ||= foreground !== this.playerSprite;
      this.playerSprite = foreground;
      for (let i = 0; i < this.previous.length; i++) {
        const col = i % cacheSize,
          row = Math.floor(i / cacheSize),
          x = left + col,
          y = top + row;
        const pos = y * 32 + x;
        let cell = x < 32 && y < 32 ? engine.cell(pos) : 0;
        const occupant = cell & 255;
        const pressed =
          switches.has(cell >> 8) &&
          (pos === next ||
            occupant === 10 ||
            (occupant >= 14 && occupant <= 17) ||
            (occupant >= 0x40 && occupant <= 0x63));
        if (pos === next) {
          // The actor that moved last is on top. Show the creature under the
          // fallen robot in either order, without drawing the standing pose.
          if (cause === 3)
            cell = 0; // The blast consumed the bomb.
          else if (player) cell = swimmer && !hitByCreature ? 3 : cell >> 8;
          else if (hitByCreature) cell &= 255;
        }
        const id = cell & 255,
          under = cell >> 8;
        const wet = id >= 0x3c && id <= 0x3f;
        const family = id >= 0x40 && id <= 0x63 ? id & ~3 : 0;
        let topPose =
          pressed && switches.has(id) ? 1 : animatedTerrain.has(id) ? phase : 0;
        const bottomPose =
          pressed && switches.has(under)
            ? 1
            : wet || animatedTerrain.has(under)
              ? phase
              : 0;
        if (x < 32 && y < 32) {
          const previous = this.occupants[pos];
          if (family && previous !== family)
            this.arrivals[pos] = previous < 0 ? -Infinity : now;
          this.occupants[pos] = family;
          if (family && animate && !this.reduced.matches) {
            const age = now - this.arrivals[pos];
            topPose = age < 220 ? 8 + Math.floor(age / 55) : idlePoses[phase];
          }
        }
        const picture = cell | (bottomPose << 16) | (topPose << 20);
        if (picture === this.previous[i]) continue;
        this.previous[i] = picture;
        dirty = true;
        const px = col * tileSize,
          py = row * tileSize;
        this.terrain.fillStyle = "#123529";
        this.terrain.fillRect(px, py, tileSize, tileSize);
        this.sprite(this.terrain, 0, px, py);
        if (wet) this.sprite(this.terrain, 3, px, py, bottomPose);
        else if (under && (pressed || id >= 0x40 || (id >= 0x33 && id <= 0x35)))
          this.sprite(this.terrain, under, px, py, bottomPose);
        if (id) this.sprite(this.terrain, id, px, py, topPose);
      }
    }
    let pose = 0;
    if (
      animate &&
      !cause &&
      !this.reduced.matches &&
      this.playerSprite >= 0x6c &&
      this.playerSprite <= 0x6f
    ) {
      if (this.moving)
        pose = 3 + (this.stride ? 2 : 0) + (progress >= 0.5 ? 1 : 0);
      else pose = idlePoses[phase];
    }
    dirty ||= pose !== this.playerPose;
    this.playerPose = pose;
    if (!dirty) return;
    const size = viewSize * tileSize;
    this.context.drawImage(
      this.terrain.canvas,
      Math.round((cameraX - left) * tileSize),
      Math.round((cameraY - top) * tileSize),
      size,
      size,
      0,
      0,
      size,
      size
    );
    if (this.playerSprite)
      this.sprite(
        this.context,
        this.playerSprite,
        Math.round((playerX - cameraX) * tileSize),
        Math.round((playerY - cameraY) * tileSize),
        pose
      );
    if (cause) {
      // Mark the impact tile at its edges so both the hazard and sprite remain visible.
      const x = (destX - cameraX) * tileSize + 4;
      const y = (destY - cameraY) * tileSize + 4;
      for (const [color, width] of [
        ["#38231c", 7],
        ["#ffd0a3", 3],
      ] satisfies [string, number][]) {
        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        this.context.strokeRect(x, y, tileSize - 8, tileSize - 8);
      }
    }
  }
}
