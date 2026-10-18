import { BusNode, LineEdge, LoadFlowEditorState } from "./state/loadFlowStore";

export type FlowMode = "both" | "p" | "q";
export type Point = { x: number; y: number };

export const DIAGRAM_COLORS = {
  p: "#285296",
  q: "#79509a",
  low: "#a45918",
  normal: "#277568",
  high: "#ae4254",
  unknown: "#858c95",
};

export function voltageColor(voltage?: number) {
  if (voltage === undefined || !Number.isFinite(voltage))
    return DIAGRAM_COLORS.unknown;
  return voltage < 0.95
    ? DIAGRAM_COLORS.low
    : voltage > 1.05
      ? DIAGRAM_COLORS.high
      : DIAGRAM_COLORS.normal;
}

export function terminalDirection(value: number, end: "from" | "to") {
  if (!Number.isFinite(value) || Math.abs(value) < 0.005) return 0;
  return Math.sign(value) * (end === "from" ? 1 : -1);
}

export function flowWidth(value: number) {
  return 2 + Math.min(5, Math.sqrt(Math.abs(value) / 100) * 3);
}

export function pointOnCurve(a: Point, b: Point, c: Point, t: number): Point {
  return {
    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
  };
}

// Keep parallel circuits separate, including circuits entered in reverse order.
export function branchCurve(
  branch: LineEdge,
  branches: LineEdge[],
  buses: BusNode[]
) {
  const from = buses.find((bus) => bus.id === branch.fromBusId)!;
  const to = buses.find((bus) => bus.id === branch.toBusId)!;
  const parallel = branches.filter(
    (line) =>
      (line.fromBusId === from.id && line.toBusId === to.id) ||
      (line.fromBusId === to.id && line.toBusId === from.id)
  );
  const offset =
    (parallel.indexOf(branch) - (parallel.length - 1) / 2) *
    80 *
    (from.id < to.id ? 1 : -1);
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return {
    a: from,
    b: to,
    c: {
      x: (from.x + to.x) / 2 - ((to.y - from.y) / length) * offset,
      y: (from.y + to.y) / 2 + ((to.x - from.x) / length) * offset,
    },
  };
}

export function layoutDiagram(state: LoadFlowEditorState): LoadFlowEditorState {
  const count = state.busOrder.length;
  const positions =
    count === 2
      ? [
          { x: 140, y: 200 },
          { x: 640, y: 200 },
        ]
      : count === 3
        ? [
            { x: 140, y: 130 },
            { x: 640, y: 130 },
            { x: 390, y: 420 },
          ]
        : state.busOrder.map((_, index) => {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
            const radius = Math.max(280, count * 28);
            return {
              x: 400 + Math.cos(angle) * radius * 1.5,
              y: 350 + Math.sin(angle) * radius * 0.8,
            };
          });
  return {
    ...state,
    busesById: Object.fromEntries(
      state.busOrder.map((id, index) => [
        id,
        { ...state.busesById[id], ...positions[index] },
      ])
    ),
  };
}
