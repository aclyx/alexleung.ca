import { arrangeNetwork } from "./layout";
import { LoadFlowEditorState } from "./state/loadFlowStore";

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

// A 26-unit dash period at 0.5 diagram units/s per MW or MVAr.
export function flowAnimationDuration(value: number) {
  return 52 / Math.abs(value);
}

export function layoutDiagram(state: LoadFlowEditorState): LoadFlowEditorState {
  const count = state.busOrder.length;
  const indices = new Map(state.busOrder.map((id, index) => [id, index]));
  const edges = new Map<string, readonly [number, number]>();
  for (const branch of Object.values(state.branchesById)) {
    const a = indices.get(branch.fromBusId);
    const b = indices.get(branch.toBusId);
    if (a === undefined || b === undefined || a === b) continue;
    edges.set([Math.min(a, b), Math.max(a, b)].join(":"), [a, b]);
  }
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
        : arrangeNetwork(count, [...edges.values()]);
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
