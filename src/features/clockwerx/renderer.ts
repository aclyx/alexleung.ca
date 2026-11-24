import type { Point } from "./geometry";
import {
  closedSegment,
  handSegment,
  QUARTER,
  sparkPosition,
  visible,
  type World,
} from "./world";

export const skins = {
  rail: {
    name: "Last Local",
    field: "#071d22",
    edge: "#102a30",
    grid: "#193239",
    line: "#416067",
    peg: "#dce0c8",
    gold: "#ffbf43",
    pale: "#fff3bb",
    goal: "#71e5ce",
    danger: "#ff675b",
    blue: "#85c2ee",
    violet: "#e69ac9",
  },
  brass: {
    name: "Brass",
    field: "#142e30",
    edge: "#0d2326",
    grid: "#294243",
    line: "#55706c",
    peg: "#bdd0ba",
    gold: "#f6c86a",
    pale: "#fff0b4",
    goal: "#80e8c4",
    danger: "#fa766c",
    blue: "#90bedf",
    violet: "#ce96d0",
  },
  blueprint: {
    name: "Blueprint",
    field: "#122944",
    edge: "#0d2037",
    grid: "#24405c",
    line: "#476c8a",
    peg: "#b0d9f1",
    gold: "#fff4b3",
    pale: "#ffffff",
    goal: "#7ae6ff",
    danger: "#ff9d8d",
    blue: "#9db5ff",
    violet: "#f4b3eb",
  },
};
export type Skin = keyof typeof skins;
export function isSkin(value: string | null): value is Skin {
  return value !== null && Object.hasOwn(skins, value);
}
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  w: World,
  skin: Skin,
  reducedMotion: boolean,
  pixelRatio = 1,
  detail?: Point & { span: number }
) {
  const c = skins[skin],
    width = ctx.canvas.width,
    height = ctx.canvas.height;
  const practice = w.practiceStep !== null;
  const scale = detail
    ? width / detail.span
    : practice
      ? Math.min(width / 4.4, height / 2.8)
      : Math.min(width / 12.4, height / 9.4);
  // Warp letters stay inside a single peg cell even on a narrow display.
  const warpFont = Math.min(0.95, Math.max(0.31, (12 * pixelRatio) / scale));
  const warpRadius = Math.min(0.43, 0.51 * warpFont + 0.025);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (skin === "rail") {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = c.field;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.setTransform(
    scale,
    0,
    0,
    scale,
    width / 2 - (detail?.x ?? (practice ? 4.5 : 5)) * scale,
    height / 2 - (detail?.y ?? (practice ? 4 : 3.5)) * scale
  );
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const line = (
    x: number,
    y: number,
    ex: number,
    ey: number,
    color: string,
    weight: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.stroke();
  };
  const circle = (x: number, y: number, r: number, fill: string) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const ring = (
    x: number,
    y: number,
    r: number,
    color: string,
    weight: number
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.stroke();
  };
  function ripple(
    p: Point,
    at: number | undefined,
    kind: "bonus" | "checkpoint"
  ) {
    if (reducedMotion || at === undefined) return;
    const station = kind === "checkpoint";
    const progress = (w.tick - at) / (station ? 42 : 16);
    if (progress >= 1) return;
    ctx.save();
    ctx.globalAlpha = 0.9 * (1 - progress);
    const radius = station ? 0.23 + 0.3 * progress : 0.15 + 0.27 * progress;
    ring(p.x, p.y, radius, station ? c.goal : c.gold, 0.042);
    ctx.restore();
  }
  const path = (points: number[][], fill: string) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const diamond = (x: number, y: number, r: number, color: string) =>
    path(
      [
        [x, y - r],
        [x + r, y],
        [x, y + r],
        [x - r, y],
      ],
      color
    );
  const colors = [c.danger, c.goal, c.blue];
  // The field is drawn in peg spacings. Resizing changes only this transform.
  for (let x = 0; x < 11; x++) line(x, -0.5, x, 7.5, c.grid, 0.012);
  for (let y = 0; y < 8; y++) line(-0.5, y, 10.5, y, c.grid, 0.012);
  for (let x = 0; x < 11; x++)
    for (let y = 0; y < 8; y++) circle(x, y, 0.023, c.line);
  if (practice) {
    const hand = w.hands[0];
    const { x, y } = w.pegs[hand.peg];
    ctx.save();
    ctx.setLineDash([0.035, 0.085]);
    ring(x, y, 1, c.line, 0.015);
    ctx.restore();
    const d = hand.direction;
    path(
      [
        [x + d * 0.09, y - 1],
        [x - d * 0.065, y - 1.055],
        [x - d * 0.065, y - 0.945],
      ],
      c.gold
    );
  }
  for (const r of w.rails) {
    const a = w.pegs[r.from],
      b = w.pegs[r.to];
    if (a && b) {
      line(a.x, a.y, b.x, b.y, c.line, 0.15);
      line(a.x, a.y, b.x, b.y, c.edge, 0.06);
    }
  }
  for (const b of w.barriers) {
    if (b.destroyed) continue;
    const s = closedSegment(b);
    if (b.group >= 0) {
      line(b.a.x, b.a.y, b.b.x, b.b.y, c.line, 0.03);
      for (const end of [b.a, b.b]) {
        circle(end.x, end.y, 0.095, colors[b.group]);
        for (let mark = 0; mark <= b.group; mark++)
          circle(end.x + (mark - b.group / 2) * 0.044, end.y, 0.016, c.edge);
      }
    }
    if (b.open >= 1) continue;
    line(s.a.x, s.a.y, s.b.x, s.b.y, c.edge, 0.14);
    line(
      s.a.x,
      s.a.y - 0.025,
      s.b.x,
      s.b.y - 0.025,
      b.group < 0 ? c.peg : colors[b.group],
      0.08
    );
  }
  for (const p of w.pegs) {
    ripple(p, p.collectedAt, "bonus");
    if (!visible(w, p)) {
      if (p.flags && p.lift && w.liftDepth[p.lift - 1] < QUARTER)
        ring(
          p.x,
          p.y,
          0.1 * (1 - w.liftDepth[p.lift - 1] / QUARTER),
          c.line,
          0.02
        );
      continue;
    }
    const { x, y, flags } = p;
    if (flags & 4) {
      const age = w.tick + w.previewTicks;
      const pulse =
        !reducedMotion && age < 60 ? Math.sin((Math.PI * age) / 60) ** 2 : 0;
      ctx.save();
      ctx.shadowColor = c.goal;
      ctx.shadowBlur = scale * (0.12 + 0.3 * pulse);
      diamond(x, y, 0.33, c.goal);
      ctx.restore();
      diamond(x, y, 0.265, c.field);
      diamond(x, y, 0.18, c.goal);
      diamond(x, y, 0.095, c.field);
      continue;
    }
    const warp = w.warps.has(p.id);
    const mark = warp
      ? c.violet
      : flags & 64
        ? c.goal
        : flags & 0x2000
          ? c.danger
          : c.peg;
    if (warp) {
      circle(x, y, warpRadius, c.field);
      ring(x, y, warpRadius, c.violet, 0.03);
      ctx.fillStyle = c.violet;
      ctx.font = `bold ${warpFont}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String.fromCharCode(65 + p.warpGroup), x, y);
    } else {
      circle(x + 0.025, y + 0.04, 0.1, c.edge);
      circle(x, y, 0.078, mark);
      circle(x - 0.018, y - 0.02, 0.025, c.pale);
    }
    if (flags & 2 && !p.collected) {
      ring(x, y, warp ? warpRadius + 0.055 : 0.14, c.gold, 0.025);
      if (!warp) circle(x, y, 0.043, c.gold);
    }
    if (flags & 8) ring(x, y, 0.115, mark, 0.025);
    if (flags & 0x2000) {
      ctx.strokeStyle = c.danger;
      ctx.lineWidth = 0.025;
      ctx.strokeRect(x - 0.105, y - 0.105, 0.21, 0.21);
    }
    if (flags & 32)
      path(
        [
          [x, y - 0.14],
          [x + 0.1, y + 0.1],
          [x - 0.1, y + 0.1],
        ],
        c.blue
      );
    if (flags & 64) ring(x, y, 0.22, c.goal, 0.04);
    if (p.lift)
      for (let k = 0; k < p.lift; k++)
        circle(x - 0.07 + k * 0.07, y + 0.15, 0.024, c.violet);
    for (let k = 0; k < 3; k++)
      if ((p.mask >> (4 * (k + 1))) & (1 << w.difficulty))
        line(
          x - 0.065 + k * 0.056,
          y + 0.13,
          x - 0.035 + k * 0.056,
          y + 0.13,
          colors[k],
          0.035
        );
  }
  for (const r of w.stations) {
    const p = w.pegs[r[0] * 11 + r[1]];
    const active = w.checkpoint?.peg === p.id;
    ripple(p, p.activatedAt, "checkpoint");
    ring(p.x, p.y, active ? 0.25 : 0.19, c.goal, active ? 0.045 : 0.032);
    if (active) {
      circle(p.x, p.y, 0.1, c.goal);
      circle(p.x, p.y, 0.045, c.pale);
    }
  }
  for (const s of w.switches) {
    const col = colors[s.group];
    ctx.fillStyle = c.edge;
    ctx.fillRect(s.x - 0.14, s.y - 0.14, 0.28, 0.28);
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.03;
    ctx.strokeRect(s.x - 0.14, s.y - 0.14, 0.28, 0.28);
    if (s.kind === "lift")
      line(s.x - 0.1, s.y - 0.085, s.x + 0.1, s.y - 0.085, col, 0.025);
    if (s.kind === "gun") ring(s.x, s.y, 0.12, col, 0.02);
    for (let j = 0; j <= s.group; j++)
      circle(s.x + (j - s.group / 2) * 0.075, s.y, 0.025, col);
  }
  function spike(p: Point) {
    const points = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6,
        r = i % 2 ? 0.075 : 0.16;
      return [p.x + Math.cos(a) * r, p.y + Math.sin(a) * r];
    });
    path(points, c.danger);
    circle(p.x, p.y, 0.048, c.edge);
  }
  for (const s of w.spikes) if (s.active) spike(s);
  for (const o of w.oil)
    if (o.active) {
      circle(o.x, o.y, 0.15, c.edge);
      ring(o.x, o.y, 0.15, c.violet, 0.025);
      circle(o.x - 0.045, o.y - 0.04, 0.035, c.violet);
    }
  for (let i = 0; i < w.fuses.length; i++) {
    const f = w.fuses[i],
      n = w.fuses[i + 1];
    if (f.spent) continue;
    if (n && f.kind >= 4 && n.kind < 10)
      line(f.x, f.y, n.x, n.y, c.gold, 0.035);
    if (f.kind < 4) {
      circle(f.x, f.y, 0.18, c.danger);
      circle(f.x, f.y, 0.1, c.edge);
    }
    if (f.kind >= 10) diamond(f.x, f.y, 0.13, c.gold);
    if (f.burn >= 0) {
      const spark = sparkPosition(w, i);
      circle(spark.x, spark.y, 0.1, c.pale);
    }
  }
  for (const g of w.glasses) {
    ripple(g, g.collectedAt, "bonus");
    if (g.active) {
      path(
        [
          [g.x - 0.12, g.y - 0.15],
          [g.x + 0.12, g.y - 0.15],
          [g.x - 0.12, g.y + 0.15],
          [g.x + 0.12, g.y + 0.15],
        ],
        c.gold
      );
    }
  }
  for (const g of w.guns) {
    circle(g.x, g.y, 0.14, colors[g.group]);
    for (let j = 0; j < 4; j++)
      if (g.barrels & (1 << j))
        line(
          g.x,
          g.y,
          g.x + 0.22 * Math.cos((j * Math.PI) / 2),
          g.y + 0.22 * Math.sin((j * Math.PI) / 2),
          colors[g.group],
          0.09
        );
  }
  for (const b of w.bullets) circle(b.x, b.y, 0.072, c.danger);
  for (let i = w.hands.length - 1; i >= 0; i--) {
    const h = w.hands[i],
      { a, b } = handSegment(w, h);
    if (h.kind === 4 || h.kind === 5) {
      if (h.respawn > w.tick) continue;
      const mid = h.flight ?? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (h.kind === 4) spike(mid);
      else {
        circle(mid.x, mid.y, 0.12, c.peg);
        ring(mid.x, mid.y, 0.17, c.blue, 0.03);
      }
      continue;
    }
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
    const col = h.kind ? colors[h.kind - 1] : c.gold;
    if (!h.kind) ring(0, 0, 0.21, c.gold, 0.022);
    path(
      [
        [-0.1, 0],
        [0.12, -0.115],
        [0.79, -0.063],
        [1.04, 0],
        [0.79, 0.063],
        [0.12, 0.115],
      ],
      col
    );
    path(
      [
        [0.16, -0.045],
        [0.81, 0],
        [0.16, 0.045],
      ],
      h.kind ? c.edge : c.pale
    );
    circle(0, 0, 0.11, col);
    circle(0, 0, 0.055, c.edge);
    const grabAge = w.tick - w.lastGrabTick;
    if (!h.kind && !reducedMotion && w.lastGrabTick >= 0 && grabAge < 12) {
      ctx.globalAlpha = 1 - grabAge / 12;
      ring(0, 0, 0.21, c.pale, 0.045);
      circle(0, 0, 0.1, c.pale);
    }
    ctx.restore();
  }
}
