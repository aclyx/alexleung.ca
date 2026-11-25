// Alternate poses are cut from the same 96px artwork as the board and HUD.
export const tileSize = 96;
export const animatedTerrain = new Set([3, 4, 13, 18, 19, 20, 21, 41, 50]);
export const switches = new Set([35, 36, 39, 40]);

export class SpriteMotion {
  private frames = new Map<number, HTMLCanvasElement>();

  constructor(private atlas: HTMLImageElement) {}

  frame(id: number, pose: number) {
    const key = id * 16 + pose;
    const cached = this.frames.get(key);
    if (cached) return cached;

    const tile = document.createElement("canvas");
    tile.width = tile.height = tileSize;
    const ctx = tile.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const left = (id % 16) * tileSize,
      top = Math.floor(id / 16) * tileSize;
    const cut = (
      x: number,
      y: number,
      w: number,
      h: number,
      dx = x,
      dy = y,
      dw = w,
      dh = h
    ) => ctx.drawImage(this.atlas, left + x, top + y, w, h, dx, dy, dw, dh);

    if (switches.has(id)) {
      // The button cap sinks into its fixed brass base.
      cut(0, 0, 96, 70, 0, 14, 96, 56);
      cut(0, 70, 96, 26);
    } else if (id >= 0x6c && id <= 0x6f) {
      const walking = pose >= 3;
      const stride = walking ? (pose < 5 ? 1 : -1) : 0;
      const lift = walking ? (pose % 2 ? 6 : 3) : 0;
      const bob = walking ? (pose % 2 ? 3 : 1) : pose;
      const side = id === 0x6d || id === 0x6f;
      // Both boots meet the chassis at row 74. The side-view artwork shows
      // one boot in front of the other, so separate complete silhouettes.
      if (side && walking) {
        ctx.filter = "brightness(0.65)";
        cut(0, 74, 96, 22, stride * lift, 74 - bob, 96, 22 + bob - lift);
        ctx.filter = "none";
        cut(0, 74, 96, 22, -stride * lift, 74 - bob, 96, 22 + bob);
      } else {
        cut(0, 74, 48, 22, 0, 74 - bob, 48, 22 + bob - (stride > 0 ? lift : 0));
        cut(
          48,
          74,
          48,
          22,
          48,
          74 - bob,
          48,
          22 + bob - (stride < 0 ? lift : 0)
        );
      }
      cut(0, 0, 96, 75, 0, -bob);
    } else if (id >= 0x40 && id <= 0x63) {
      const family = id & ~3;
      const walking = pose >= 8;
      const beat = walking ? [0, 3, 0, -3][pose - 8] : pose;
      if (family === 0x40 || family === 0x54 || family === 0x60) {
        // Bugs, Teeth and paramecia alternate the two sides of their gait.
        const lift = walking ? beat : 0;
        cut(0, 57, 48, 39, 0, 57, 48, 39 - Math.max(0, lift));
        cut(48, 57, 48, 39, 48, 57, 48, 39 + Math.min(0, lift));
        cut(0, 0, 96, 58, 0, -Math.abs(beat), 96, 58 + Math.abs(beat));
      } else if (family === 0x4c || family === 0x58) {
        // The steel chassis rides over a fixed wheelbase.
        cut(0, 62, 96, 34);
        cut(
          0,
          0,
          96,
          63,
          0,
          walking ? -Math.abs(beat) : 0,
          96,
          walking ? 63 + Math.abs(beat) : 63
        );
      } else if (family === 0x5c) {
        // Blobs spread sideways as they compress against the floor.
        cut(0, 0, 96, 96, -beat, beat * 2, 96 + beat * 2, 96 - beat * 2);
      } else {
        // Fireballs, bouncing balls and gliders stay aloft.
        cut(0, 0, 96, 96, 0, -Math.abs(beat), 96, 96 - Math.abs(beat));
      }
    } else {
      cut(0, 0, 96, 96);
      if (id === 3) {
        // Bend the wave crests while keeping the two edges against the rim.
        const angle = (pose * Math.PI) / 4;
        for (let x = 4; x < 92; x += 2) {
          const taper = Math.sin(((x - 4) / 88) * Math.PI);
          const offset = Math.round(7 * taper * Math.sin(angle + x / 18));
          cut(x + offset, 4, 2, 88, x, 4);
        }
      } else if (id === 4) {
        // The fire bends above the grate. The base of the flame stays anchored.
        const angle = (pose * Math.PI) / 4;
        for (let y = 7; y < 61; y += 2) {
          const height = (61 - y) / 54;
          const dx = Math.round(4 * height * Math.sin(angle + y / 10));
          const dy = Math.round(3 * height * Math.cos(angle * 2 + y / 15));
          cut(14 - dx, Math.max(4, y + dy), 68, 2, 14, y);
        }
      } else if (id === 13 || (id >= 18 && id <= 20)) {
        const vertical = id === 13 || id === 18;
        const positive = id === 13 || id === 19;
        const shift = (positive ? pose : 8 - pose) * 2;
        // Scroll the two exposed tread lanes while the arrow and chassis stay fixed.
        for (const lane of [18, 72]) {
          if (vertical) {
            cut(lane, 20, 6, 56 - shift, lane, 20 + shift);
            cut(lane, 76 - shift, 6, shift, lane, 20);
          } else {
            cut(20, lane, 56 - shift, 6, 20 + shift, lane);
            cut(76 - shift, lane, shift, 6, 20, lane);
          }
          const seam = 20 + (positive ? pose : 7 - pose) * 7;
          ctx.fillStyle = "#648b76";
          if (vertical) ctx.fillRect(lane, seam, 6, 2);
          else ctx.fillRect(seam, lane, 2, 6);
        }
      } else if (id === 21) {
        ctx.fillStyle = `rgba(255, 219, 118, ${Math.sin((pose * Math.PI) / 8) * 0.5})`;
        ctx.fillRect(38, 10, 20, 4);
        ctx.fillRect(42, 20, 12, 2);
      } else if (id === 41) {
        const r = 5 + pose * 2;
        ctx.strokeStyle = `rgba(91, 227, 255, ${(8 - pose) / 10})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(48, 48, r, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (id === 50) {
        // The random belt's four lamps chase without promising a direction.
        const [x, y] = [
          [46, 10],
          [82, 46],
          [46, 82],
          [10, 46],
        ][pose >> 1];
        ctx.fillStyle = "#ffefab";
        ctx.fillRect(x, y, 4, 4);
      }
    }
    this.frames.set(key, tile);
    return tile;
  }
}
