import {
  branchCurve,
  DIAGRAM_COLORS,
  flowAnimationDuration,
  layoutDiagram,
  placeFlowLabels,
  terminalDirection,
  voltageColor,
} from "../diagram";
import { getReferenceScenarioById } from "../solver/referenceScenarios";
import {
  BusNode,
  LineEdge,
  replaceEditorStateFromLoadFlowCase,
} from "../state/loadFlowStore";

test("14-bus flow labels avoid bus/device panels and one another", () => {
  const state = layoutDiagram(
    replaceEditorStateFromLoadFlowCase(
      getReferenceScenarioById("ieee-14-bus")!.loadFlowCase
    )
  );
  const buses = Object.values(state.busesById);
  const positions = [
    ...placeFlowLabels(Object.values(state.branchesById), buses).values(),
  ].map((item) => item.position);
  expect(positions).toHaveLength(20);
  positions.forEach((position, index) => {
    for (const bus of buses) {
      expect({
        label: index,
        bus: bus.id,
        clear:
          Math.abs(position.x - bus.x) >= 146 ||
          Math.abs(position.y - bus.y) >= 124,
      }).toEqual({ label: index, bus: bus.id, clear: true });
    }
    for (const previous of positions.slice(0, index)) {
      expect(
        Math.abs(position.x - previous.x) >= 116 ||
          Math.abs(position.y - previous.y) >= 60
      ).toBe(true);
    }
  });
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
