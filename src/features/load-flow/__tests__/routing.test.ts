import { layoutDiagram, Point } from "../diagram";
import { flowSegments, pathData, routeBranches } from "../routing";
import { getReferenceScenarioById } from "../solver/referenceScenarios";
import {
  BusNode,
  LineEdge,
  replaceEditorStateFromLoadFlowCase,
} from "../state/loadFlowStore";

const bus = (id: string, x: number, y: number): BusNode => ({
  id,
  name: id,
  type: "PQ",
  baseKV: 230,
  x,
  y,
});
const line: LineEdge = {
  id: "line",
  fromBusId: "a",
  toBusId: "b",
  r: 0.01,
  x: 0.1,
  bHalf: 0,
};

function expectOrthogonal(points: Point[]) {
  for (let i = 1; i < points.length; i++) {
    expect(
      points[i].x === points[i - 1].x || points[i].y === points[i - 1].y
    ).toBe(true);
    expect(points[i]).not.toEqual(points[i - 1]);
  }
}

function crossesBus(points: Point[], node: BusNode) {
  return points.slice(1).some((b, index) => {
    const a = points[index];
    return a.y === b.y
      ? Math.abs(a.y - node.y) < 90 &&
          Math.max(a.x, b.x) > node.x - 85 &&
          Math.min(a.x, b.x) < node.x + 85
      : Math.abs(a.x - node.x) < 85 &&
          Math.max(a.y, b.y) > node.y - 90 &&
          Math.min(a.y, b.y) < node.y + 90;
  });
}

test("routes around an intervening bus and preserves input coordinates", () => {
  const buses = [bus("a", 0, 0), bus("b", 600, 0), bus("obstacle", 300, 0)];
  const before = buses.map((node) => ({ ...node }));
  const route = routeBranches([line], buses).get(line.id)!;
  expectOrthogonal(route);
  expect(route[0]).toMatchObject({ x: buses[0].x, y: buses[0].y });
  expect(route.at(-1)).toMatchObject({ x: buses[1].x, y: buses[1].y });
  expect(crossesBus(route, buses[2])).toBe(false);
  expect(buses).toEqual(before);
  expect(routeBranches([line], buses).get(line.id)).toEqual(route);
});

test.each<[string, number, number]>([
  ["horizontal", 500, 0],
  ["vertical", 0, 500],
  ["diagonal", 500, 500],
  ["moved across the other bus", -350, 250],
])("reserves distinct tracks for parallel circuits: %s", (_, x, y) => {
  const buses = [bus("a", 0, 0), bus("b", x, y)];
  for (const count of [4, 8]) {
    const branches = Array.from({ length: count }, (_, index) => ({
      ...line,
      id: `parallel-${index}`,
      fromBusId: index % 2 ? "b" : "a",
      toBusId: index % 2 ? "a" : "b",
    }));
    const routes = routeBranches(branches, buses);
    expectParallelTracks(branches, buses, routes);
    expect(routeBranches(branches, buses)).toEqual(routes);
  }
});

test("corridor search preserves parallel tracks around intervening bus cards", () => {
  const buses = [
    bus("a", 0, 0),
    bus("b", 700, 500),
    bus("c", 300, 0),
    bus("d", 0, 300),
    bus("e", 700, 200),
    bus("f", 400, 500),
  ];
  const branches = Array.from({ length: 8 }, (_, index) => ({
    ...line,
    id: `parallel-${index}`,
  }));
  const routes = routeBranches(branches, buses);
  expectParallelTracks(branches, buses, routes);
  expect([...routes.values()].every((points) => points.length > 4)).toBe(true);
});

function expectParallelTracks(
  branches: LineEdge[],
  buses: BusNode[],
  routes: Map<string, Point[]>
) {
  const paths = branches.map((branch) => {
    const points = routes.get(branch.id)!;
    expectOrthogonal(points);
    const from = buses.find((bus) => bus.id === branch.fromBusId)!;
    const to = buses.find((bus) => bus.id === branch.toBusId)!;
    expect(points[0]).toMatchObject({ x: from.x, y: from.y });
    expect(points.at(-1)).toMatchObject({ x: to.x, y: to.y });
    for (const bus of buses.slice(2))
      expect(crossesBus(points, bus)).toBe(false);
    for (const offset of [-6, 6]) {
      const segments = flowSegments(points, offset);
      expectOrthogonal(readPath(segments.from.d));
      expectOrthogonal(readPath(segments.to.d));
    }
    return branch.fromBusId === "a" ? points : points.toReversed();
  });
  expect(new Set(paths.map(pathData)).size).toBe(branches.length);
  // Each circuit needs an exposed pointer target, not just a different path string.
  for (const path of paths) {
    const samples = path.slice(1).flatMap((b, index) =>
      [0.25, 0.5, 0.75].map((t) => ({
        x: path[index].x + (b.x - path[index].x) * t,
        y: path[index].y + (b.y - path[index].y) * t,
      }))
    );
    expect(
      samples.some(
        (p) =>
          buses.every(
            (bus) => Math.abs(p.x - bus.x) > 100 || Math.abs(p.y - bus.y) > 105
          ) &&
          paths
            .filter((other) => other !== path)
            .every((other) =>
              other.slice(1).every((b, index) => {
                const a = other[index];
                return (
                  Math.hypot(
                    p.x -
                      Math.max(
                        Math.min(a.x, b.x),
                        Math.min(Math.max(a.x, b.x), p.x)
                      ),
                    p.y -
                      Math.max(
                        Math.min(a.y, b.y),
                        Math.min(Math.max(a.y, b.y), p.y)
                      )
                  ) > 14
                );
              })
            )
      )
    ).toBe(true);
  }
}

test.each([9, 14, 30, 57, 118])(
  "IEEE %i routes use right angles and avoid unrelated bus cards",
  (count) => {
    const state = layoutDiagram(
      replaceEditorStateFromLoadFlowCase(
        getReferenceScenarioById(`ieee-${count}-bus`)!.loadFlowCase
      )
    );
    const buses = Object.values(state.busesById);
    const lines = Object.values(state.branchesById);
    const routes = routeBranches(lines, buses);
    const collisions: string[] = [];
    for (const branch of lines) {
      const route = routes.get(branch.id)!;
      expectOrthogonal(route);
      for (const offset of [-6, 6]) {
        const segments = flowSegments(route, offset);
        expectOrthogonal(readPath(segments.from.d));
        expectOrthogonal(readPath(segments.to.d));
      }
      const a = state.busesById[branch.fromBusId],
        b = state.busesById[branch.toBusId];
      expect(route[0]).toMatchObject({ x: a.x, y: a.y });
      expect(route.at(-1)).toMatchObject({ x: b.x, y: b.y });
      for (const node of buses) {
        if (
          node.id !== branch.fromBusId &&
          node.id !== branch.toBusId &&
          crossesBus(route, node)
        )
          collisions.push(`${branch.id} crosses ${node.id}`);
      }
    }
    expect(collisions).toEqual([]);
    const sharedTracks: string[] = [];
    for (const [index, branch] of lines.entries()) {
      for (const other of lines.slice(0, index)) {
        if (
          [branch.fromBusId, branch.toBusId].some(
            (id) => id === other.fromBusId || id === other.toBusId
          )
        )
          continue;
        const points = routes.get(branch.id)!;
        const otherPoints = routes.get(other.id)!;
        for (let i = 1; i < points.length; i++) {
          for (let j = 1; j < otherPoints.length; j++) {
            const a = points[i - 1],
              b = points[i];
            const c = otherPoints[j - 1],
              d = otherPoints[j];
            const horizontal = a.y === b.y;
            if (horizontal !== (c.y === d.y)) continue;
            const axis = horizontal ? "x" : "y";
            const cross = horizontal ? "y" : "x";
            if (
              Math.abs(a[cross] - c[cross]) < 18 &&
              Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis])) -
                Math.max(
                  Math.min(a[axis], b[axis]),
                  Math.min(c[axis], d[axis])
                ) >
                1e-6
            )
              sharedTracks.push(`${branch.id} overlaps ${other.id}`);
          }
        }
      }
    }
    expect(sharedTracks).toEqual([]);
  }
);

test.each([9, 14, 30, 57, 118])(
  "IEEE %i terminal arrows stay outside cards and devices",
  (count) => {
    const state = layoutDiagram(
      replaceEditorStateFromLoadFlowCase(
        getReferenceScenarioById(`ieee-${count}-bus`)!.loadFlowCase
      )
    );
    const buses = Object.values(state.busesById);
    const lines = Object.values(state.branchesById);
    const routes = routeBranches(lines, buses);
    const hidden: string[] = [];
    for (const line of lines) {
      for (const offset of [-6, 0, 6]) {
        const segments = flowSegments(routes.get(line.id)!, offset, buses);
        for (const [end, arrow] of Object.entries(segments)) {
          if (
            !arrow.visible ||
            buses.some(
              (bus) =>
                Math.abs(arrow.x - bus.x) < 92 && Math.abs(arrow.y - bus.y) < 98
            )
          )
            hidden.push(`${line.id} ${offset} ${end}`);
        }
      }
    }
    expect(hidden).toEqual([]);
  }
);

function readPath(d: string) {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  return Array.from({ length: numbers.length / 2 }, (_, index) => ({
    x: numbers[index * 2],
    y: numbers[index * 2 + 1],
  }));
}

test.each([-6, 0, 6])(
  "power lane %i follows elbows and splits into continuous equal-length halves",
  (offset) => {
    const route = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 400, y: 100 },
    ];
    const segments = flowSegments(route, offset);
    const from = readPath(segments.from.d),
      to = readPath(segments.to.d);
    expectOrthogonal(from);
    expectOrthogonal(to);
    expect(from.at(-1)).toEqual(to[0]);
    const length = (points: Point[]) =>
      points
        .slice(1)
        .reduce(
          (sum, point, i) =>
            sum +
            Math.abs(point.x - points[i].x) +
            Math.abs(point.y - points[i].y),
          0
        );
    expect(length(from)).toBeCloseTo(length(to));
    expect(from[0]).toEqual({ x: 0, y: offset });
    expect(to.at(-1)).toEqual({ x: 400, y: 100 + offset });
    expect(segments.from.angle % 90).toBe(0);
    expect(segments.to.angle % 90).toBe(0);
    expect(pathData(route)).toBe("M 0 0 L 200 0 L 200 100 L 400 100");
  }
);

test("coincident buses do not produce non-finite flow geometry", () => {
  const route = routeBranches([line], [bus("a", 0, 0), bus("b", 0, 0)]).get(
    line.id
  )!;
  expect(JSON.stringify(flowSegments(route, 6))).not.toMatch(
    /NaN|Infinity|null/
  );
});
