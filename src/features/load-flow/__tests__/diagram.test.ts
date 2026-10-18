import {
  branchCurve,
  DIAGRAM_COLORS,
  flowAnimationDuration,
  layoutDiagram,
  terminalDirection,
  voltageColor,
} from "../diagram";
import { toLoadFlowCase } from "../graph/toLoadFlowCase";
import { arrangeNetwork } from "../layout";
import { getReferenceScenarioById } from "../solver/referenceScenarios";
import {
  BusNode,
  LineEdge,
  LoadFlowEditorState,
  replaceEditorStateFromLoadFlowCase,
} from "../state/loadFlowStore";

function countCrossings(state: LoadFlowEditorState) {
  const branches = Object.values(state.branchesById);
  const side = (a: BusNode, b: BusNode, c: BusNode) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  let count = 0;
  branches.forEach((branch, index) => {
    const a = state.busesById[branch.fromBusId];
    const b = state.busesById[branch.toBusId];
    for (const other of branches.slice(0, index)) {
      const c = state.busesById[other.fromBusId];
      const d = state.busesById[other.toBusId];
      if (new Set([a.id, b.id, c.id, d.id]).size !== 4) continue;
      if (
        side(a, b, c) * side(a, b, d) < 0 &&
        side(c, d, a) * side(c, d, b) < 0
      )
        count++;
    }
  });
  return count;
}

test.each([9, 14, 30, 57, 118])(
  "%i-bus layout reduces crossings without changing the electrical model",
  (count) => {
    const original = replaceEditorStateFromLoadFlowCase(
      getReferenceScenarioById(`ieee-${count}-bus`)!.loadFlowCase
    );
    original.busOrder.forEach((id, index) => {
      const angle = (index * 2 * Math.PI) / count;
      original.busesById[id] = {
        ...original.busesById[id],
        x: Math.cos(angle) * 1000,
        y: Math.sin(angle) * 600,
      };
    });
    const before = JSON.parse(JSON.stringify(original));
    const arranged = layoutDiagram(original);
    expect(toLoadFlowCase(arranged)).toEqual(toLoadFlowCase(original));
    expect(original).toEqual(before);
    expect(layoutDiagram(arranged)).toEqual(arranged);
    expect(countCrossings(arranged)).toBeLessThan(countCrossings(original));
    if (count === 30) {
      expect(countCrossings(arranged)).toBeLessThanOrEqual(2);
      for (const branch of Object.values(arranged.branchesById)) {
        const a = arranged.busesById[branch.fromBusId];
        const b = arranged.busesById[branch.toBusId];
        for (const bus of Object.values(arranged.busesById)) {
          if (bus.id === a.id || bus.id === b.id) continue;
          let entry = 0,
            exit = 1;
          for (const [axis, halfSize] of [
            ["x", 85],
            ["y", 90],
          ] satisfies Array<["x" | "y", number]>) {
            const delta = b[axis] - a[axis];
            if (delta === 0) {
              if (Math.abs(a[axis] - bus[axis]) > halfSize) exit = -1;
              continue;
            }
            const near = (bus[axis] - halfSize - a[axis]) / delta;
            const far = (bus[axis] + halfSize - a[axis]) / delta;
            entry = Math.max(entry, Math.min(near, far));
            exit = Math.min(exit, Math.max(near, far));
          }
          expect(entry).toBeGreaterThanOrEqual(exit);
        }
      }
    }
    const buses = Object.values(arranged.busesById);
    buses.forEach((bus, index) => {
      for (const other of buses.slice(0, index)) {
        expect(
          Math.abs(bus.x - other.x) >= 209.99 ||
            Math.abs(bus.y - other.y) >= 219.99
        ).toBe(true);
      }
    });
  }
);

test("layout handles empty, single-bus and disconnected networks deterministically", () => {
  expect(arrangeNetwork(0, [])).toEqual([]);
  expect(arrangeNetwork(1, [])).toEqual([{ x: 110, y: 120 }]);
  const disconnected = arrangeNetwork(6, [
    [0, 1],
    [2, 3],
  ]);
  expect(disconnected).toEqual(
    arrangeNetwork(6, [
      [0, 1],
      [2, 3],
    ])
  );
  expect(
    disconnected.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
  ).toBe(true);
});

test("motion speed is proportional to magnitude on a fixed scale", () => {
  expect(flowAnimationDuration(50)).toBe(1.04);
  expect(flowAnimationDuration(100)).toBe(0.52);
  expect(flowAnimationDuration(-100)).toBe(flowAnimationDuration(100));
  expect(flowAnimationDuration(0.5)).toBe(104);
});

test("terminal directions are independent, including line charging and absorption", () => {
  expect(terminalDirection(20, "from")).toBe(1);
  expect(terminalDirection(-19, "to")).toBe(1);
  expect(terminalDirection(-20, "from")).toBe(-1);
  expect(terminalDirection(21, "to")).toBe(-1);
  expect(terminalDirection(3, "from")).toBe(1);
  expect(terminalDirection(3, "to")).toBe(-1);
  expect(terminalDirection(-3, "from")).toBe(-1);
  expect(terminalDirection(-3, "to")).toBe(1);
  expect(terminalDirection(0.001, "to")).toBe(0);
  expect(terminalDirection(NaN, "from")).toBe(0);
});

test("voltage uses fixed guide bands and a neutral unsolved state", () => {
  expect(voltageColor(0.94)).toBe(DIAGRAM_COLORS.low);
  expect(voltageColor(0.95)).toBe(DIAGRAM_COLORS.normal);
  expect(voltageColor(1.05)).toBe(DIAGRAM_COLORS.normal);
  expect(voltageColor(1.051)).toBe(DIAGRAM_COLORS.high);
  expect(voltageColor()).toBe(DIAGRAM_COLORS.unknown);
});

test("parallel circuits entered in opposite directions have distinct paths", () => {
  const buses: BusNode[] = [
    { id: "a", name: "A", type: "SLACK", baseKV: 230, x: 0, y: 0 },
    { id: "b", name: "B", type: "PQ", baseKV: 230, x: 400, y: 0 },
  ];
  const lines: LineEdge[] = [
    { id: "1", fromBusId: "a", toBusId: "b", r: 0.01, x: 0.1, bHalf: 0 },
    { id: "2", fromBusId: "b", toBusId: "a", r: 0.01, x: 0.1, bHalf: 0 },
  ];
  expect(branchCurve(lines[0], lines, buses).c.y).not.toBe(
    branchCurve(lines[1], lines, buses).c.y
  );
});
