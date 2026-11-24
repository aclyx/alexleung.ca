import { point, type Point, type Segment } from "./geometry";
import { COLS, type Level } from "./level";

export const difficulties: readonly string[] = [
  "Child",
  "Easy",
  "Medium",
  "Hard",
];
export type Difficulty = 0 | 1 | 2 | 3;
export function isDifficulty(value: number): value is Difficulty {
  return value === 0 || value === 1 || value === 2 || value === 3;
}
export const TICKS_PER_SECOND = 60;
export const QUARTER = 192;
export const TURN = 4 * QUARTER;
export const wrap = (n: number, m = TURN) => ((n % m) + m) % m;
export const stepSpeed = [4, 6, 8, 12];
// The Windows engine advances each enemy clock at a fraction of the player clock.
const relativeSpeed = [1, 1, 3 / 4, 1 / 2, 1 / 4, 2];
const timeFactor = [2.3, 1.66, 1.33, 1].map(Math.fround);
type Peg = Point & {
  id: number;
  flags: number;
  mask: number;
  path: string;
  origin: Point;
  hiddenUntil: number;
  collected: boolean;
  collectedAt?: number;
  activatedAt?: number;
  lift: number;
  warpGroup: number;
};
export type Hand = {
  peg: number;
  phase: number;
  direction: number;
  kind: number;
  path: string;
  index: number;
  speed: number;
  sliding: number;
  flight: (Point & { vx: number; vy: number }) | null;
  respawn: number;
};
type Barrier = Segment & {
  group: number;
  open: number;
  target: number;
  destroyed: boolean;
};
type Switch = Point & {
  group: number;
  kind: "door" | "lift" | "gun";
  pressed: boolean;
};
type Item = Point & { active: boolean };
type Oil = Item & {
  mode: "idle" | "chase";
  wait: number;
  from: Point;
  target: number;
};
type Fuse = Point & { kind: number; burn: number; spent: boolean };
export type World = ReturnType<typeof createWorld>;

const corner = (r: number[]) =>
  point(r[1] + (r[2] & 1) * 0.5, r[0] + ((r[2] >> 1) & 1) * 0.5);
function barrier(a: Point, b: Point, group = -1, open = 0): Barrier {
  return { a, b, group, open, target: open, destroyed: false };
}
export function createWorld(level: Level, difficulty: Difficulty) {
  const bit = 1 << difficulty;
  const enabled = (rows: number[][]) =>
    rows.filter((r) => r[r.length - 1] & bit);
  const pegs: Peg[] = level.cells.map((c, id) => {
    const origin = point(id % COLS, Math.floor(id / COLS));
    // The Windows loader clears pickups, hazards and lift behavior when masked.
    // The base peg and its movement script survive independently (e.g. Passage).
    const flags = c.mask & bit ? c.flags : c.flags & (1 | 128 | 0x4000);
    return {
      ...c,
      ...origin,
      origin,
      id,
      flags,
      path: flags & 128 ? c.path : "",
      hiddenUntil: 0,
      collected: false,
      lift: (flags >> 8) & 3,
      warpGroup: -1,
    };
  });
  const hands: Hand[] = level.actors
    .filter((r) => r[2] !== 6 && r[9] & bit)
    .map((r) => ({
      peg: r[0] * COLS + r[1],
      phase: wrap((r[3] * TURN) / 32),
      direction: r[4],
      kind: r[2],
      path: level.paths[r[5]] ?? "",
      index: 0,
      speed: relativeSpeed[r[7]],
      sliding: 0,
      flight: null,
      respawn: 0,
    }));
  const barriers = level.walls.map(
    ([vertical, axis, from, startCap, to, endCap]) => {
      const lo = from + [-0.12, 0.2, 0.5][startCap],
        hi = to + [0.12, -0.2, -0.5][endCap];
      return vertical
        ? barrier(point(axis + 0.5, lo), point(axis + 0.5, hi))
        : barrier(point(lo, axis + 0.5), point(hi, axis + 0.5));
    }
  );
  for (const [y, x, shape, settings] of level.doors) {
    const a = shape & 256 ? point(x + 0.5, y) : point(x, y + 0.5);
    const span = 1 + (shape & 1);
    barriers.push(
      barrier(
        a,
        shape & 256 ? point(a.x, a.y + span) : point(a.x + span, a.y),
        settings & 255,
        settings >> 8
      )
    );
  }
  const switches: Switch[] = [];
  function addSwitches(rows: number[][], kind: Switch["kind"]) {
    for (const r of rows)
      switches.push({ ...corner(r), group: r[3], kind, pressed: false });
  }
  addSwitches(level.switches, "door");
  addSwitches(enabled(level.lifts), "lift");
  addSwitches(enabled(level.triggers), "gun");
  const oil: Oil[] = enabled(level.oil).map((r) => {
    const pos = point(
      r[1] + (r[2] & 1 ? 0.28 : 0.72),
      r[0] + (r[2] & 2 ? 0.28 : 0.72)
    );
    return {
      ...pos,
      active: true,
      mode: "idle",
      wait: 0,
      from: pos,
      target: -1,
    };
  });
  const warps = new Map<number, number>();
  for (const r of enabled(level.warps)) {
    const partner = level.warps.find(
      (s) => s !== r && s[2] === r[2] && s[4] & bit
    );
    if (partner) {
      const peg = r[0] * COLS + r[1];
      warps.set(peg, partner[0] * COLS + partner[1]);
      pegs[peg].warpGroup = r[2];
    }
  }
  const rails = level.rails.map(([y, x, vertical]) => ({
    from: y * COLS + x,
    to: y * COLS + x + (vertical ? COLS : 1),
  }));
  const fuses: Fuse[] = level.fuses.map(([y, x, kind]) => ({
    x: x + 0.5,
    y: y + 0.5,
    kind,
    burn: -1,
    spent: false,
  }));
  const stations = enabled(level.stations);
  if (difficulty === 3) stations.length = 0;
  const runtime: {
    bullets: (Point & { vx: number; vy: number })[];
    status: "ready" | "playing" | "paused" | "lost" | "won";
    checkpoint: {
      peg: number;
      phase: number;
      direction: number;
      state: StationState;
    } | null;
  } = { bullets: [], status: "ready", checkpoint: null };
  return {
    ...runtime,
    level,
    practiceStep: level.number === 0 ? 0 : null,
    difficulty,
    pegs,
    hands,
    barriers,
    switches,
    oil,
    warps,
    rails,
    fuses,
    stations,
    spikes: enabled(level.spikes).map(([y, x, dy, dx]) => ({
      ...point(x + dx / 4, y + dy / 4),
      active: true,
    })),
    glasses: enabled(level.glasses).map(
      ([y, x]): Item & { collectedAt?: number } => ({
        x: x + 0.5,
        y: y + 0.5,
        active: true,
      })
    ),
    guns: enabled(level.guns).map((r) => ({
      ...corner(r),
      group: r[3],
      barrels: r[4],
    })),
    lowered: [false, false, false],
    liftDepth: [0, 0, 0],
    tick: 0,
    previewTicks: 0,
    lastGrabTick: -1,
    lastSwitchTick: -1,
    lastBlastTick: -1,
    time:
      difficulty === 0
        ? Infinity
        : Math.floor(
            (Math.trunc(level.seconds * timeFactor[difficulty]) + 5) / 10
          ) *
          10 *
          TICKS_PER_SECOND,
    score: 0,
    bonuses: 0,
    reason: "",
    random: level.number * 101 + difficulty + 1,
  };
}
type StationState = Pick<
  World,
  | "tick"
  | "time"
  | "random"
  | "score"
  | "bonuses"
  | "pegs"
  | "hands"
  | "barriers"
  | "switches"
  | "bullets"
  | "lowered"
  | "liftDepth"
  | "glasses"
  | "spikes"
  | "oil"
  | "fuses"
>;

// Both capture and retry need their own mutable objects. Level geometry, paths,
// and origins are immutable and can be shared across retries.
export function copyStationState(w: StationState): StationState {
  return {
    tick: w.tick,
    time: w.time,
    random: w.random,
    score: w.score,
    bonuses: w.bonuses,
    pegs: w.pegs.map((p) => ({ ...p })),
    hands: w.hands.map((h) => ({ ...h, flight: h.flight && { ...h.flight } })),
    barriers: w.barriers.map((b) => ({ ...b })),
    switches: w.switches.map((s) => ({ ...s })),
    bullets: w.bullets.map((b) => ({ ...b })),
    lowered: [...w.lowered],
    liftDepth: [...w.liftDepth],
    glasses: w.glasses.map((g) => ({ ...g })),
    spikes: w.spikes.map((s) => ({ ...s })),
    oil: w.oil.map((o) => ({ ...o })),
    fuses: w.fuses.map((f) => ({ ...f })),
  };
}
export function saveStation(w: World, station: number[]) {
  w.checkpoint = {
    peg: station[0] * COLS + station[1],
    phase: wrap((station[2] * TURN) / 32),
    direction: station[3],
    state: copyStationState(w),
  };
}
export function visible(w: World, p: Peg) {
  return (
    Boolean(p.flags & 1) &&
    p.hiddenUntil <= w.tick &&
    !(p.lift && w.liftDepth[p.lift - 1] > 0)
  );
}
export function handSegment(w: World, h: Hand): Segment {
  const peg = w.pegs[h.peg];
  const a = point(peg.x, peg.y);
  if (h.sliding) {
    const end = w.pegs[h.sliding - 1];
    const progress = (h.phase % QUARTER) / QUARTER;
    const f = progress === 0 || h.direction > 0 ? progress : 1 - progress;
    a.x += (end.x - peg.x) * f;
    a.y += (end.y - peg.y) * f;
  }
  const radians = (h.phase * Math.PI * 2) / TURN;
  return { a, b: point(a.x + Math.cos(radians), a.y + Math.sin(radians)) };
}
export function sparkPosition(w: World, index: number) {
  const fuse = w.fuses[index];
  const next = w.fuses[index + 1];
  if (fuse.burn < 0 || fuse.spent || !next || fuse.kind < 4 || next.kind >= 10)
    return fuse;
  const fraction = Math.max(0, Math.min(1, (w.tick - fuse.burn) / 12));
  return point(
    fuse.x + (next.x - fuse.x) * fraction,
    fuse.y + (next.y - fuse.y) * fraction
  );
}
export function closedSegment(bar: Barrier) {
  return {
    a: bar.a,
    b: point(
      bar.a.x + (bar.b.x - bar.a.x) * (1 - bar.open),
      bar.a.y + (bar.b.y - bar.a.y) * (1 - bar.open)
    ),
  };
}
