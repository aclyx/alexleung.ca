import type { Point } from "./diagram";

type Edge = readonly [number, number];

function side(a: Point, b: Point, p: Point) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

function crossings(points: Point[], edges: Edge[]) {
  let count = 0;
  edges.forEach(([a, b], index) => {
    for (const [c, d] of edges.slice(0, index)) {
      if (a === c || a === d || b === c || b === d) continue;
      if (
        side(points[a], points[b], points[c]) *
          side(points[a], points[b], points[d]) <
          0 &&
        side(points[c], points[d], points[a]) *
          side(points[c], points[d], points[b]) <
          0
      )
        count++;
    }
  });
  return count;
}

// Deterministic force-directed candidates: linked buses attract, all buses repel.
// Pick the candidate with the fewest crossings, then the shortest wiring.
export function arrangeNetwork(count: number, edges: Edge[]): Point[] {
  if (!count) return [];
  let best: Point[] = [];
  let bestScore = Infinity;
  for (let seed = 0; seed < 6; seed++) {
    let random = seed + 1;
    const points = Array.from({ length: count }, (_, index) => {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      const angle =
        seed === 0
          ? (index * Math.PI * 2) / count
          : (random / 2 ** 32) * Math.PI * 2;
      return {
        x: Math.cos(angle) * Math.sqrt(count),
        y: Math.sin(angle) * Math.sqrt(count),
      };
    });
    for (let step = 0; step < 350; step++) {
      const forces = points.map(({ x, y }) => ({ x: -x * 0.03, y: -y * 0.03 }));
      for (let a = 0; a < count; a++) {
        for (let b = 0; b < a; b++) {
          const dx = points[a].x - points[b].x;
          const dy = points[a].y - points[b].y;
          const distanceSquared = Math.max(0.001, dx * dx + dy * dy);
          forces[a].x += dx / distanceSquared;
          forces[a].y += dy / distanceSquared;
          forces[b].x -= dx / distanceSquared;
          forces[b].y -= dy / distanceSquared;
        }
      }
      for (const [a, b] of edges) {
        const dx = points[b].x - points[a].x;
        const dy = points[b].y - points[a].y;
        const distance = Math.hypot(dx, dy);
        forces[a].x += dx * distance;
        forces[a].y += dy * distance;
        forces[b].x -= dx * distance;
        forces[b].y -= dy * distance;
      }
      const temperature = 0.4 * (1 - step / 350) ** 2 + 0.001;
      points.forEach((point, index) => {
        const force = forces[index];
        const scale = Math.min(
          temperature / (Math.hypot(force.x, force.y) || 1),
          0.1
        );
        point.x += force.x * scale;
        point.y += force.y * scale;
      });
    }
    // Align the longest axis horizontally before resolving panel collisions.
    const mean = points.reduce(
      (sum, point) => ({
        x: sum.x + point.x / count,
        y: sum.y + point.y / count,
      }),
      { x: 0, y: 0 }
    );
    let xx = 0,
      yy = 0,
      xy = 0;
    for (const point of points) {
      const x = point.x - mean.x,
        y = point.y - mean.y;
      xx += x * x;
      yy += y * y;
      xy += x * y;
    }
    const angle = Math.atan2(2 * xy, xx - yy) / 2;
    points.forEach((point) => {
      const x = point.x,
        y = point.y;
      point.x = (x * Math.cos(angle) + y * Math.sin(angle)) * 100;
      point.y = (y * Math.cos(angle) - x * Math.sin(angle)) * 100;
    });
    // Resolve rectangular panel collisions locally rather than expanding the whole graph.
    for (let step = 0; step < 100; step++) {
      let overlap = false;
      for (let a = 0; a < count; a++) {
        for (let b = 0; b < a; b++) {
          const dx = points[a].x - points[b].x;
          const dy = points[a].y - points[b].y;
          const overlapX = 210 - Math.abs(dx);
          const overlapY = 220 - Math.abs(dy);
          if (overlapX <= 0 || overlapY <= 0) continue;
          overlap = true;
          if (overlapX < overlapY) {
            const shift = (Math.sign(dx) || 1) * (overlapX / 2 + 0.01);
            points[a].x += shift;
            points[b].x -= shift;
          } else {
            const shift = (Math.sign(dy) || 1) * (overlapY / 2 + 0.01);
            points[a].y += shift;
            points[b].y -= shift;
          }
        }
      }
      // Keep unrelated buses and their device icons away from line segments.
      for (const [a, b] of edges) {
        const dx = points[b].x - points[a].x;
        const dy = points[b].y - points[a].y;
        const length = Math.hypot(dx, dy);
        if (!length) continue;
        const nx = -dy / length;
        const ny = dx / length;
        const clearance = 95 * Math.abs(nx) + 100 * Math.abs(ny);
        points.forEach((point, index) => {
          if (index === a || index === b) return;
          const t =
            ((point.x - points[a].x) * dx + (point.y - points[a].y) * dy) /
            (length * length);
          if (t <= 0 || t >= 1) return;
          const distance =
            (point.x - points[a].x) * nx + (point.y - points[a].y) * ny;
          if (Math.abs(distance) >= clearance) return;
          const shift =
            (Math.sign(distance) || 1) * (clearance - Math.abs(distance) + 0.1);
          point.x += nx * shift;
          point.y += ny * shift;
          overlap = true;
        });
      }
      if (!overlap) break;
    }
    const length = edges.reduce(
      (sum, [a, b]) =>
        sum + Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y),
      0
    );
    const score = crossings(points, edges) * 1000000 + length;
    if (score < bestScore) {
      best = points;
      bestScore = score;
    }
  }
  // Uniform scaling preserves crossings and keeps bus panels and device icons apart.
  let gap = Infinity;
  best.forEach((point, index) => {
    for (const other of best.slice(0, index)) {
      gap = Math.min(
        gap,
        Math.max(
          Math.abs(point.x - other.x) / 210,
          Math.abs(point.y - other.y) / 220
        )
      );
    }
  });
  const scale = Math.max(1, 1 / gap);
  const minX = Math.min(...best.map((point) => point.x));
  const minY = Math.min(...best.map((point) => point.y));
  return best.map(({ x, y }) => ({
    x: 110 + (x - minX) * scale,
    y: 120 + (y - minY) * scale,
  }));
}
