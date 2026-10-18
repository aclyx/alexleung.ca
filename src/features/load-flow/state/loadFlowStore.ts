import {
  BusType,
  Generator,
  Load,
  LoadFlowCase,
  ShuntDevice,
} from "@/features/load-flow/model/types";

export interface BusNode {
  id: string;
  name: string;
  baseKV: number;
  type: BusType;
  voltageMagnitudeSetpoint?: number;
  voltageAngleSetpointDeg?: number;
  voltageMagnitudeMin?: number;
  voltageMagnitudeMax?: number;
  x: number;
  y: number;
}

export interface LineEdge {
  id: string;
  fromBusId: string;
  toBusId: string;
  r: number;
  x: number;
  bHalf: number;
  tapRatio?: number;
  phaseShiftDeg?: number;
  thermalLimitMVA?: number;
  status?: "IN_SERVICE" | "OUT_OF_SERVICE";
}

export interface LoadFlowEditorState {
  baseMVA: number;
  busesById: Record<string, BusNode>;
  /**
   * Stable insertion/display order for buses independent of object key order.
   */
  busOrder: string[];
  branchesById: Record<string, LineEdge>;
  /**
   * Stable insertion/display order for branches independent of object key order.
   */
  branchOrder: string[];
  generators: Generator[];
  loads: Load[];
  shunts: ShuntDevice[];
  selectedElementId: string | null;
  selectedElementType: "BUS" | "BRANCH" | null;
}

const DEFAULT_BUS_BASE_KV = 230;

export const createInitialLoadFlowEditorState = (): LoadFlowEditorState => ({
  baseMVA: 100,
  busesById: {},
  busOrder: [],
  branchesById: {},
  branchOrder: [],
  generators: [],
  loads: [],
  shunts: [],
  selectedElementId: null,
  selectedElementType: null,
});

export const addBus = (
  state: LoadFlowEditorState,
  options?: { x?: number; y?: number }
): LoadFlowEditorState => {
  const id = `bus-${state.busOrder.length + 1}`;
  const name = `Bus ${state.busOrder.length + 1}`;

  return {
    ...state,
    busesById: {
      ...state.busesById,
      [id]: {
        id,
        name,
        baseKV: DEFAULT_BUS_BASE_KV,
        type: state.busOrder.length === 0 ? "SLACK" : "PQ",
        x: options?.x ?? 120 + state.busOrder.length * 120,
        y: options?.y ?? 120,
      },
    },
    busOrder: [...state.busOrder, id],
    selectedElementId: id,
    selectedElementType: "BUS",
  };
};

export const updateBus = (
  state: LoadFlowEditorState,
  busId: string,
  update: Partial<BusNode>
): LoadFlowEditorState => {
  const bus = state.busesById[busId];
  if (!bus) {
    return state;
  }

  return {
    ...state,
    busesById: {
      ...state.busesById,
      [busId]: {
        ...bus,
        ...update,
      },
    },
  };
};

export const addBranch = (
  state: LoadFlowEditorState,
  fromBusId: string,
  toBusId: string
): LoadFlowEditorState => {
  if (!state.busesById[fromBusId] || !state.busesById[toBusId]) {
    return state;
  }

  const id = `line-${state.branchOrder.length + 1}`;

  return {
    ...state,
    branchesById: {
      ...state.branchesById,
      [id]: {
        id,
        fromBusId,
        toBusId,
        r: 0.01,
        x: 0.1,
        bHalf: 0,
        status: "IN_SERVICE",
      },
    },
    branchOrder: [...state.branchOrder, id],
    selectedElementId: id,
    selectedElementType: "BRANCH",
  };
};

export const updateBranch = (
  state: LoadFlowEditorState,
  branchId: string,
  update: Partial<LineEdge>
): LoadFlowEditorState => {
  const branch = state.branchesById[branchId];
  if (!branch) {
    return state;
  }

  return {
    ...state,
    branchesById: {
      ...state.branchesById,
      [branchId]: {
        ...branch,
        ...update,
      },
    },
  };
};

export const selectElement = (
  state: LoadFlowEditorState,
  elementType: "BUS" | "BRANCH" | null,
  elementId: string | null
): LoadFlowEditorState => ({
  ...state,
  selectedElementType: elementType,
  selectedElementId: elementId,
});

const AUTO_LAYOUT_X_SPACING = 180;
const AUTO_LAYOUT_Y_SPACING = 140;
const AUTO_LAYOUT_START_X = 120;
const AUTO_LAYOUT_START_Y = 120;
const AUTO_LAYOUT_MIN_BUS_HORIZONTAL_CLEARANCE = 104;
const AUTO_LAYOUT_MIN_BUS_VERTICAL_CLEARANCE = 58;

const isOverlappingBusPosition = (
  x: number,
  y: number,
  placed: Array<{ x: number; y: number }>
) =>
  placed.some(
    (position) =>
      Math.abs(position.x - x) < AUTO_LAYOUT_MIN_BUS_HORIZONTAL_CLEARANCE &&
      Math.abs(position.y - y) < AUTO_LAYOUT_MIN_BUS_VERTICAL_CLEARANCE
  );

const resolveNonOverlappingPosition = (
  x: number,
  y: number,
  placed: Array<{ x: number; y: number }>
) => {
  if (!isOverlappingBusPosition(x, y, placed)) {
    return { x, y };
  }

  let nextY = y;
  while (isOverlappingBusPosition(x, nextY, placed)) {
    nextY += AUTO_LAYOUT_Y_SPACING;
  }

  return { x, y: nextY };
};

export const autoLayoutBuses = (
  state: LoadFlowEditorState
): LoadFlowEditorState => {
  if (state.busOrder.length === 0) {
    return state;
  }

  const adjacency = new Map<string, string[]>();
  for (const busId of state.busOrder) {
    adjacency.set(busId, []);
  }

  for (const branchId of state.branchOrder) {
    const branch = state.branchesById[branchId];
    adjacency.get(branch.fromBusId)?.push(branch.toBusId);
    adjacency.get(branch.toBusId)?.push(branch.fromBusId);
  }

  const slackBusId = state.busOrder.find(
    (busId) => state.busesById[busId]?.type === "SLACK"
  );
  const roots = [
    ...(slackBusId ? [slackBusId] : []),
    ...state.busOrder.filter((busId) => busId !== slackBusId),
  ];

  const levelByBusId = new Map<string, number>();
  const visited = new Set<string>();

  for (const root of roots) {
    if (visited.has(root)) {
      continue;
    }

    const queue: Array<{ busId: string; level: number }> = [
      { busId: root, level: 0 },
    ];
    visited.add(root);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      const existing = levelByBusId.get(current.busId);
      if (existing === undefined || current.level < existing) {
        levelByBusId.set(current.busId, current.level);
      }

      for (const nextBusId of adjacency.get(current.busId) ?? []) {
        if (visited.has(nextBusId)) {
          continue;
        }
        visited.add(nextBusId);
        queue.push({ busId: nextBusId, level: current.level + 1 });
      }
    }
  }

  const busesByLevel = new Map<number, string[]>();
  for (const busId of state.busOrder) {
    const level = levelByBusId.get(busId) ?? 0;
    const busesInLevel = busesByLevel.get(level) ?? [];
    busesInLevel.push(busId);
    busesByLevel.set(level, busesInLevel);
  }

  const positionedBuses: Record<string, BusNode> = { ...state.busesById };
  const orderedLevels = [...busesByLevel.keys()].sort((a, b) => a - b);
  const placedPositions: Array<{ x: number; y: number }> = [];
  const busRankById = new Map(
    state.busOrder.map((busId, index) => [busId, index])
  );

  orderedLevels.forEach((level) => {
    const buses = busesByLevel.get(level) ?? [];
    buses.sort((a, b) => {
      const neighborsA = (adjacency.get(a) ?? []).filter(
        (neighborId) => (levelByBusId.get(neighborId) ?? 0) < level
      );
      const neighborsB = (adjacency.get(b) ?? []).filter(
        (neighborId) => (levelByBusId.get(neighborId) ?? 0) < level
      );
      const avgA =
        neighborsA.reduce(
          (sum, neighborId) => sum + (busRankById.get(neighborId) ?? 0),
          0
        ) / (neighborsA.length || 1);
      const avgB =
        neighborsB.reduce(
          (sum, neighborId) => sum + (busRankById.get(neighborId) ?? 0),
          0
        ) / (neighborsB.length || 1);
      if (avgA === avgB) {
        return (busRankById.get(a) ?? 0) - (busRankById.get(b) ?? 0);
      }
      return avgA - avgB;
    });
    busesByLevel.set(level, buses);
  });

  for (const level of orderedLevels) {
    const buses = busesByLevel.get(level) ?? [];
    const levelYOffset =
      AUTO_LAYOUT_START_Y - ((buses.length - 1) * AUTO_LAYOUT_Y_SPACING) / 2;
    buses.forEach((busId, index) => {
      const bus = positionedBuses[busId];
      const proposedX = AUTO_LAYOUT_START_X + level * AUTO_LAYOUT_X_SPACING;
      const proposedY = levelYOffset + index * AUTO_LAYOUT_Y_SPACING;
      const { x, y } = resolveNonOverlappingPosition(
        proposedX,
        proposedY,
        placedPositions
      );

      positionedBuses[busId] = {
        ...bus,
        x,
        y,
      };
      placedPositions.push({ x, y });
      busRankById.set(busId, index);
    });
  }

  return {
    ...state,
    busesById: positionedBuses,
  };
};

export const replaceEditorStateFromLoadFlowCase = (
  loadFlowCase: LoadFlowCase
): LoadFlowEditorState => {
  const busOrder = loadFlowCase.buses.map((bus) => bus.id);
  const branchOrder = loadFlowCase.branches.map((branch) => branch.id);

  const busesById = Object.fromEntries(
    loadFlowCase.buses.map((bus, index) => [
      bus.id,
      {
        id: bus.id,
        name: bus.name,
        baseKV: bus.baseKV,
        type: bus.type,
        voltageMagnitudeSetpoint: bus.voltageMagnitudeSetpoint,
        voltageAngleSetpointDeg: bus.voltageAngleSetpointDeg,
        voltageMagnitudeMin: bus.voltageMagnitudeMin,
        voltageMagnitudeMax: bus.voltageMagnitudeMax,
        x: AUTO_LAYOUT_START_X + index * AUTO_LAYOUT_X_SPACING,
        y: AUTO_LAYOUT_START_Y,
      },
    ])
  );

  const branchesById = Object.fromEntries(
    loadFlowCase.branches.map((branch) => [
      branch.id,
      {
        id: branch.id,
        fromBusId: branch.fromBusId,
        toBusId: branch.toBusId,
        r: branch.r,
        x: branch.x,
        bHalf: branch.bHalf ?? 0,
        tapRatio: branch.tapRatio,
        phaseShiftDeg: branch.phaseShiftDeg,
        thermalLimitMVA: branch.thermalLimitMVA,
        status: branch.status,
      },
    ])
  );

  const selectedElementId = busOrder[0] ?? branchOrder[0] ?? null;
  const selectedElementType: "BUS" | "BRANCH" | null = busOrder[0]
    ? "BUS"
    : branchOrder[0]
      ? "BRANCH"
      : null;

  return autoLayoutBuses({
    baseMVA: loadFlowCase.baseMVA,
    busesById,
    busOrder,
    branchesById,
    branchOrder,
    generators: loadFlowCase.generators.map((generator) => ({ ...generator })),
    loads: loadFlowCase.loads.map((load) => ({ ...load })),
    shunts: loadFlowCase.shunts.map((shunt) => ({ ...shunt })),
    selectedElementId,
    selectedElementType,
  });
};
