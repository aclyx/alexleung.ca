export type Point = { x: number; y: number };
export type Segment = { a: Point; b: Point };
export const point = (x: number, y: number): Point => ({ x, y });
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export function distanceToSegment(p: Point, { a, b }: Segment) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = Math.min(
    1,
    Math.max(
      0,
      ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)
    )
  );
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function side(a: Point, b: Point, p: Point) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

// The hand sweeps less than a quarter-turn per step. For a fixed pivot its
// swept area is a circular sector. A sliding pivot also sweeps its two ends.
export function hitsSpike(p: Point, from: Segment, to: Segment) {
  // The original board has 48 pixels between dots and an eight-pixel spike core.
  const radius = 4 / 48;
  if (
    p.x < Math.min(from.a.x, to.a.x) - 1 - radius ||
    p.x > Math.max(from.a.x, to.a.x) + 1 + radius ||
    p.y < Math.min(from.a.y, to.a.y) - 1 - radius ||
    p.y > Math.max(from.a.y, to.a.y) + 1 + radius
  )
    return false;
  if (
    distanceToSegment(p, from) <= radius ||
    distanceToSegment(p, to) <= radius
  )
    return true;
  if (from.a.x === to.a.x && from.a.y === to.a.y) {
    const turn = Math.sign(side(from.a, from.b, to.b));
    return (
      turn !== 0 &&
      side(from.a, from.b, p) * turn >= 0 &&
      side(to.a, to.b, p) * turn <= 0 &&
      distance(from.a, p) <= 1 + radius
    );
  }
  // The translating arm traces two triangles. The tip arc deviates from its
  // chord by less than a tenth of an original pixel per simulation step.
  const inTriangle = (a: Point, b: Point, c: Point) => {
    const turn = Math.sign(side(a, b, c));
    return (
      turn !== 0 &&
      side(a, b, p) * turn >= 0 &&
      side(b, c, p) * turn >= 0 &&
      side(c, a, p) * turn >= 0
    );
  };
  return (
    inTriangle(from.a, from.b, to.b) ||
    inTriangle(from.a, to.b, to.a) ||
    distanceToSegment(p, { a: from.a, b: to.a }) <= radius ||
    distanceToSegment(p, { a: from.b, b: to.b }) <= radius
  );
}
export function intersects(s: Segment, t: Segment, tolerance = 0.035) {
  return (
    (side(s.a, s.b, t.a) * side(s.a, s.b, t.b) < 0 &&
      side(t.a, t.b, s.a) * side(t.a, t.b, s.b) < 0) ||
    Math.min(
      distanceToSegment(s.a, t),
      distanceToSegment(s.b, t),
      distanceToSegment(t.a, s),
      distanceToSegment(t.b, s)
    ) < tolerance
  );
}
