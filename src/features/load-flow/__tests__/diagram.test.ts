import {
  branchCurve,
  DIAGRAM_COLORS,
  terminalDirection,
  voltageColor,
} from "../diagram";
import { BusNode, LineEdge } from "../state/loadFlowStore";

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
