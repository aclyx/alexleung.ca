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
