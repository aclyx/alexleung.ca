import type { Point } from "./diagram";
import type { BusNode, LineEdge } from "./state/loadFlowStore";

const distance = (a: Point, b: Point) =>
  Math.abs(b.x - a.x) + Math.abs(b.y - a.y);

type Track = [Point, Point];
const TRACK_SPACING = 40;

function occupiesTrack(
  a: Point,
  b: Point,
  tracks: Track[],
  spacing = TRACK_SPACING
) {
  const horizontal = a.y === b.y;
  return tracks.some(([c, d]) =>
    horizontal !== (c.y === d.y)
      ? false
      : horizontal
        ? Math.abs(a.y - c.y) < spacing - 1e-6 &&
          overlap(a.x, b.x, c.x, d.x) > 0
        : Math.abs(a.x - c.x) < spacing - 1e-6 &&
          overlap(a.y, b.y, c.y, d.y) > 0
  );
}

function exposedTracks(
  points: Point[],
  buses: BusNode[],
  halfWidth = 100,
  halfHeight = 105
): Track[] {
  const tracks: Track[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const horizontal = a.y === b.y;
    const axis = horizontal ? "x" : "y";
    let intervals = [[Math.min(a[axis], b[axis]), Math.max(a[axis], b[axis])]];
    for (const bus of buses) {
      if (
        Math.abs(horizontal ? a.y - bus.y : a.x - bus.x) >=
        (horizontal ? halfHeight : halfWidth)
      )
        continue;
      const low = bus[axis] - (horizontal ? halfWidth : halfHeight);
      const high = bus[axis] + (horizontal ? halfWidth : halfHeight);
      intervals = intervals.flatMap(([start, end]) =>
        end <= low || start >= high
          ? [[start, end]]
          : [
              [start, Math.min(end, low)],
              [Math.max(start, high), end],
            ].filter(([start, end]) => end > start)
      );
    }
    if (b[axis] < a[axis]) intervals.reverse();
    for (const [start, end] of intervals)
      if (end > start)
        tracks.push([
          { ...a, [axis]: b[axis] < a[axis] ? end : start },
          { ...a, [axis]: b[axis] < a[axis] ? start : end },
        ]);
  }
  return tracks;
}

function simplify(points: Point[]) {
  const result: Point[] = [];
  for (const point of points) {
    const b = result.at(-1);
    if (b && distance(b, point) === 0) continue;
    const a = result.at(-2);
    if (
      a &&
      b &&
      ((a.x === b.x && b.x === point.x) || (a.y === b.y && b.y === point.y)) &&
      (b.x - a.x) * (point.x - b.x) >= 0 &&
      (b.y - a.y) * (point.y - b.y) >= 0
    )
      result.pop();
    result.push(point);
  }
  return result;
}

function overlap(a: number, b: number, c: number, d: number) {
  return Math.max(
    0,
    Math.min(Math.max(a, b), Math.max(c, d)) -
      Math.max(Math.min(a, b), Math.min(c, d))
  );
}

// Include the bus card, device icons, and clearance for the two power lanes.
function busOverlap(a: Point, b: Point, bus: BusNode) {
  return a.y === b.y
    ? Math.abs(a.y - bus.y) < 105 - 1e-6
      ? overlap(a.x, b.x, bus.x - 100, bus.x + 100)
      : 0
    : Math.abs(a.x - bus.x) < 100 - 1e-6
      ? overlap(a.y, b.y, bus.y - 105, bus.y + 105)
      : 0;
}

function wirePenalty(a: Point, b: Point, c: Point, d: Point) {
  const horizontal = a.y === b.y;
  if (horizontal === (c.y === d.y)) {
    return horizontal
      ? Math.abs(a.y - c.y) < 18
        ? overlap(a.x, b.x, c.x, d.x) * 8
        : 0
      : Math.abs(a.x - c.x) < 18
        ? overlap(a.y, b.y, c.y, d.y) * 8
        : 0;
  }
  const [h1, h2, v1, v2] = horizontal ? [a, b, c, d] : [c, d, a, b];
  return v1.x > Math.min(h1.x, h2.x) &&
    v1.x < Math.max(h1.x, h2.x) &&
    h1.y > Math.min(v1.y, v2.y) &&
    h1.y < Math.max(v1.y, v2.y)
    ? 160
    : 0;
}

// Dense networks sometimes need more than two elbows. Search the corridors
// around bus rectangles only when the simple candidates cannot clear them.
function findClearRoute(
  a: BusNode,
  b: BusNode,
  buses: BusNode[],
  tracks: Track[],
  separateWires: Track[]
) {
  const blocked = (start: Point, end: Point) =>
    occupiesTrack(start, end, tracks) ||
    occupiesTrack(start, end, separateWires, 20);
  const ports = (bus: BusNode) => [
    { x: bus.x - 100, y: bus.y },
    { x: bus.x + 100, y: bus.y },
    { x: bus.x, y: bus.y - 105 },
    { x: bus.x, y: bus.y + 105 },
  ];
  const startPorts = ports(a).filter(
    (p) =>
      buses.every((bus) => bus.id === a.id || !busOverlap(a, p, bus)) &&
      !blocked(a, p)
  );
  const endPorts = ports(b).filter(
    (p) =>
      buses.every((bus) => bus.id === b.id || !busOverlap(p, b, bus)) &&
      !blocked(p, b)
  );
  const xs = [
    ...new Set([
      a.x,
      b.x,
      ...buses.flatMap((bus) => [bus.x - 100, bus.x + 100]),
      ...tracks.flatMap((track) =>
        track.flatMap((p) => [p.x - TRACK_SPACING, p.x + TRACK_SPACING])
      ),
      ...separateWires.flatMap(([c, d]) =>
        c.x === d.x ? [c.x - 20, c.x + 20] : []
      ),
    ]),
  ].sort((x, y) => x - y);
  const ys = [
    ...new Set([
      a.y,
      b.y,
      ...buses.flatMap((bus) => [bus.y - 105, bus.y + 105]),
      ...tracks.flatMap((track) =>
        track.flatMap((p) => [p.y - TRACK_SPACING, p.y + TRACK_SPACING])
      ),
      ...separateWires.flatMap(([c, d]) =>
        c.y === d.y ? [c.y - 20, c.y + 20] : []
      ),
    ]),
  ].sort((x, y) => x - y);
  const key = (p: Point) => ys.indexOf(p.y) * xs.length + xs.indexOf(p.x);
  const point = (id: number) => ({
    x: xs[id % xs.length],
    y: ys[Math.floor(id / xs.length)],
  });
  const goals = new Set(endPorts.map(key));
  type Step = { id: number; cost: number; estimate: number; previous?: Step };
  const queue: Step[] = [];
  const costs = new Map<number, number>();
  function enqueue(step: Step) {
    if ((costs.get(step.id) ?? Infinity) <= step.cost) return;
    costs.set(step.id, step.cost);
    let lo = 0,
      hi = queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (queue[mid].estimate <= step.estimate) lo = mid + 1;
      else hi = mid;
    }
    queue.splice(lo, 0, step);
  }
  for (const p of startPorts)
    enqueue({
      id: key(p),
      cost: distance(a, p),
      estimate: distance(a, p) + distance(p, b),
    });
  while (queue.length) {
    const current = queue.shift()!;
    if (current.cost !== costs.get(current.id)) continue;
    const p = point(current.id);
    if (goals.has(current.id)) {
      const route: Point[] = [b];
      for (let step: Step | undefined = current; step; step = step.previous)
        route.push(point(step.id));
      return simplify([a, ...route.reverse()]);
    }
    const x = current.id % xs.length,
      y = Math.floor(current.id / xs.length);
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= xs.length || ny >= ys.length) continue;
      const next = { x: xs[nx], y: ys[ny] };
      if (buses.some((bus) => busOverlap(p, next, bus))) continue;
      if (blocked(p, next)) continue;
      const prev = current.previous ? point(current.previous.id) : a;
      const bend = (prev.x === p.x) !== (p.x === next.x) ? 24 : 0;
      const cost = current.cost + distance(p, next) + bend;
      enqueue({
        id: ny * xs.length + nx,
        cost,
        estimate: cost + distance(next, b),
        previous: current,
      });
    }
  }
}

/** Choose short orthogonal corridors, prioritizing clear bus cards and separate wires. */
export function routeBranches(branches: LineEdge[], buses: BusNode[]) {
  const routes = new Map<string, Point[]>();
  const byId = new Map(buses.map((bus) => [bus.id, bus]));
  const wires: Array<[Point, Point]> = [];
  const routed: Array<{ branch: LineEdge; tracks: Track[] }> = [];
  const reserved = new Map<string, Track[]>();
  for (const branch of branches) {
    const from = byId.get(branch.fromBusId)!;
    const to = byId.get(branch.toBusId)!;
    // Canonical orientation keeps reverse-entered circuits on distinct routes too.
    const [a, b] = from.id < to.id ? [from, to] : [to, from];
    const pair = JSON.stringify([a.id, b.id]);
    const tracks = reserved.get(pair) ?? [];
    // Wires with no common terminal must not merge into an apparent junction.
    const separateWires = routed
      .filter(
        ({ branch: previous }) =>
          ![previous.fromBusId, previous.toBusId].some(
            (id) => id === a.id || id === b.id
          )
      )
      .flatMap(({ tracks }) => tracks);
    const candidates = [
      [a, { x: b.x, y: a.y }, b],
      [a, { x: a.x, y: b.y }, b],
    ];
    const xs = new Set([(a.x + b.x) / 2]);
    const ys = new Set([(a.y + b.y) / 2]);
    for (const bus of buses) {
      xs.add(bus.x - 120);
      xs.add(bus.x + 120);
      ys.add(bus.y - 125);
      ys.add(bus.y + 125);
    }
    for (const x of xs) {
      if (x >= Math.min(a.x, b.x) - 120 && x <= Math.max(a.x, b.x) + 120)
        candidates.push([a, { x, y: a.y }, { x, y: b.y }, b]);
    }
    for (const y of ys) {
      if (y >= Math.min(a.y, b.y) - 125 && y <= Math.max(a.y, b.y) + 125)
        candidates.push([a, { x: a.x, y }, { x: b.x, y }, b]);
    }
    for (let lane = 1; lane <= tracks.length; lane++) {
      const gap = lane * TRACK_SPACING;
      for (const x of [
        Math.min(a.x, b.x) - 120 - gap,
        Math.max(a.x, b.x) + 120 + gap,
      ])
        candidates.push([a, { x, y: a.y }, { x, y: b.y }, b]);
      for (const y of [
        Math.min(a.y, b.y) - 125 - gap,
        Math.max(a.y, b.y) + 125 + gap,
      ])
        candidates.push([a, { x: a.x, y }, { x: b.x, y }, b]);
    }
    let best: Point[] | undefined;
    let bestScore = Infinity;
    let bestOverlap = Infinity;
    candidate: for (const candidate of candidates) {
      const points = simplify(candidate);
      let score = (points.length - 2) * 24;
      let obstruction = 0;
      for (let i = 1; i < points.length; i++) {
        const start = points[i - 1],
          end = points[i];
        if (occupiesTrack(start, end, tracks)) continue candidate;
        if (occupiesTrack(start, end, separateWires, 20)) continue candidate;
        score += distance(start, end);
        for (const bus of buses) {
          if (
            (bus.id === a.id && i === 1) ||
            (bus.id === b.id && i === points.length - 1)
          )
            continue;
          obstruction += busOverlap(start, end, bus);
          if (obstruction > bestOverlap) continue candidate;
        }
        for (const [c, d] of wires) {
          score += wirePenalty(start, end, c, d);
          if (bestOverlap === 0 && score >= bestScore) continue candidate;
        }
      }
      if (
        obstruction < bestOverlap ||
        (obstruction === bestOverlap && score < bestScore)
      ) {
        best = points;
        bestScore = score;
        bestOverlap = obstruction;
      }
    }
    if (bestOverlap > 0)
      best = findClearRoute(a, b, buses, tracks, separateWires) ?? best;
    // Overlapping bus cards may leave no exposed route at all.
    best ??= simplify(candidates[0]);
    const exposed = exposedTracks(best, [a, b]);
    const track = exposed.reduce<Track | undefined>(
      (longest, next) =>
        !longest || distance(...next) > distance(...longest) ? next : longest,
      undefined
    );
    if (track) tracks.push(track);
    reserved.set(pair, tracks);
    for (let i = 1; i < best.length; i++) wires.push([best[i - 1], best[i]]);
    routed.push({ branch, tracks: exposed });
    routes.set(branch.id, from === a ? best : [...best].reverse());
  }
  return routes;
}

export function pathData(points: Point[]) {
  return points
    .map(({ x, y }, index) => `${index ? "L" : "M"} ${x} ${y}`)
    .join(" ");
}

function sampleRoute(points: Point[], fraction: number) {
  const lengths = points
    .slice(1)
    .map((point, index) => distance(points[index], point));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * fraction;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const a = points[i],
        b = points[i + 1];
      const t = lengths[i] ? remaining / lengths[i] : 0;
      return {
        point: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
        index: i,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    remaining -= lengths[i];
  }
  return { point: points[0], index: 0, angle: 0 };
}

// Offset each leg and intersect adjacent legs at the elbows, rather than
// translating the whole wire diagonally (which swaps lanes around bends).
export function flowSegments(
  route: Point[],
  offset: number,
  buses: BusNode[] = []
) {
  const normals = route.slice(1).map((b, index) => {
    const a = route[index];
    return { x: -Math.sign(b.y - a.y), y: Math.sign(b.x - a.x) };
  });
  const points = route.map((point, index) => {
    const before = normals[index - 1],
      after = normals[index];
    return {
      x: point.x + ((before?.x ?? 0) + (after?.x ?? 0)) * offset,
      y: point.y + ((before?.y ?? 0) + (after?.y ?? 0)) * offset,
    };
  });
  const middle = sampleRoute(points, 0.5);
  const halves = {
    from: simplify([...points.slice(0, middle.index + 1), middle.point]),
    to: simplify([middle.point, ...points.slice(middle.index + 1)]),
  };
  const segment = (half: Point[], fraction: number) => {
    // Card and device bounds include clearance for the whole arrowhead.
    const visible = exposedTracks(half, buses, 92, 98);
    let remaining =
      visible.reduce((sum, track) => sum + distance(...track), 0) * fraction;
    for (const track of visible) {
      const length = distance(...track);
      if (remaining <= length || track === visible.at(-1)) {
        const inset = Math.min(8, length / 2);
        const arrow = sampleRoute(
          track,
          Math.max(inset, Math.min(length - inset, remaining)) / length
        );
        return {
          d: pathData(half),
          ...arrow.point,
          angle: arrow.angle,
          visible: true,
        };
      }
      remaining -= length;
    }
    return { d: pathData(half), x: 0, y: 0, angle: 0, visible: false };
  };
  return { from: segment(halves.from, 0.56), to: segment(halves.to, 0.44) };
}
