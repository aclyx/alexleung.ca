export type Cell = {
  column: number;
  row: number;
};

export type Direction = "up" | "down" | "left" | "right";

type GameStatus = "playing" | "won" | "lost";

export type PacketColor = "cyan" | "amber" | "emerald" | "rose";

export type RouteRepairPacket = {
  color: PacketColor;
  id: string;
  label: string;
  port: string;
  start: Cell;
  target: Cell;
};

type DeliveredRoute = {
  packetId: string;
  path: Cell[];
};

type RouteRepairPuzzle = {
  blockedCells: Cell[];
  moveLimit: number;
  packets: RouteRepairPacket[];
  seed: number;
};

export type RouteRepairState = {
  activePacketIndex: number;
  currentPath: Cell[];
  deliveredRoutes: DeliveredRoute[];
  head: Cell;
  lastMessage: string;
  movesRemaining: number;
  puzzle: RouteRepairPuzzle;
  status: GameStatus;
};

export const ROUTE_REPAIR_GRID: Readonly<{
  columns: number;
  rows: number;
}> = {
  columns: 7,
  rows: 5,
};

export const DEFAULT_ROUTE_REPAIR_SEED = 404;
const ROUTE_REPAIR_MOVE_LIMIT = 42;

const MAX_GENERATION_ATTEMPTS = 80;
const BLOCKED_CELL_COUNT = 4;
const MIN_MOVE_LIMIT = 34;
const MOVE_LIMIT_MARGIN = 8;

const routeRepairDirections: Direction[] = ["up", "down", "left", "right"];

const directionDeltas: Record<Direction, Cell> = {
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
  right: { column: 1, row: 0 },
  up: { column: 0, row: -1 },
};

const routeTemplates: ReadonlyArray<
  Omit<RouteRepairPacket, "start" | "target"> & { startRow: number }
> = [
  {
    color: "cyan",
    id: "about",
    label: "/about/",
    port: "A",
    startRow: 0,
  },
  {
    color: "amber",
    id: "blog",
    label: "/blog/",
    port: "B",
    startRow: 1,
  },
  {
    color: "emerald",
    id: "now",
    label: "/now/",
    port: "C",
    startRow: 3,
  },
  {
    color: "rose",
    id: "contact",
    label: "/contact/",
    port: "D",
    startRow: 4,
  },
];

const targetRows = routeTemplates.map((template) => template.startRow);

function normalizeSeed(seed: number): number {
  return Math.abs(Math.trunc(seed)) || DEFAULT_ROUTE_REPAIR_SEED;
}

function createRandom(seed: number) {
  let value = normalizeSeed(seed);

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function createPackets(random: () => number): RouteRepairPacket[] {
  const shuffledTargetRows = shuffle(targetRows, random);

  return routeTemplates.map((template, index) => ({
    color: template.color,
    id: template.id,
    label: template.label,
    port: template.port,
    start: { column: 0, row: template.startRow },
    target: {
      column: ROUTE_REPAIR_GRID.columns - 1,
      row: shuffledTargetRows[index] ?? template.startRow,
    },
  }));
}

function createBlockedCells(random: () => number): Cell[] {
  const candidates = [];

  for (let row = 0; row < ROUTE_REPAIR_GRID.rows; row += 1) {
    for (let column = 2; column < ROUTE_REPAIR_GRID.columns - 2; column += 1) {
      candidates.push({ column, row });
    }
  }

  return shuffle(candidates, random).slice(0, BLOCKED_CELL_COUNT);
}

export function cellKey(cell: Cell): string {
  return `${cell.column}:${cell.row}`;
}

export function isSameCell(a: Cell, b: Cell): boolean {
  return a.column === b.column && a.row === b.row;
}

function isInsideGrid(cell: Cell): boolean {
  return (
    cell.column >= 0 &&
    cell.column < ROUTE_REPAIR_GRID.columns &&
    cell.row >= 0 &&
    cell.row < ROUTE_REPAIR_GRID.rows
  );
}

function isBlockedCell(cell: Cell, puzzle: RouteRepairPuzzle): boolean {
  return puzzle.blockedCells.some((blockedCell) =>
    isSameCell(blockedCell, cell)
  );
}

function hasLoopedBack(path: Cell[], cell: Cell): boolean {
  const previousCell = path.at(-2);

  if (previousCell && isSameCell(previousCell, cell)) {
    return false;
  }

  return path.some((pathCell) => isSameCell(pathCell, cell));
}

function moveCell(cell: Cell, direction: Direction): Cell {
  const delta = directionDeltas[direction];

  return {
    column: cell.column + delta.column,
    row: cell.row + delta.row,
  };
}

function pathToDirections(path: Cell[]): Direction[] {
  return path.flatMap((cell, index) => {
    const previousCell = path[index - 1];

    if (!previousCell) {
      return [];
    }

    const direction = getDirectionBetweenCells(previousCell, cell);

    return direction ? [direction] : [];
  });
}

function findShortestPacketPath(
  packet: RouteRepairPacket,
  puzzle: Pick<RouteRepairPuzzle, "blockedCells">
): Cell[] | undefined {
  const queue: Cell[][] = [[packet.start]];
  const visited = new Set([cellKey(packet.start)]);

  while (queue.length > 0) {
    const path = queue.shift();

    if (!path) {
      continue;
    }

    const head = path[path.length - 1];

    if (isSameCell(head, packet.target)) {
      return path;
    }

    for (const direction of routeRepairDirections) {
      const nextHead = moveCell(head, direction);
      const key = cellKey(nextHead);

      if (
        !isInsideGrid(nextHead) ||
        visited.has(key) ||
        puzzle.blockedCells.some((blockedCell) =>
          isSameCell(blockedCell, nextHead)
        )
      ) {
        continue;
      }

      visited.add(key);
      queue.push([...path, nextHead]);
    }
  }

  return undefined;
}

export function solveRouteRepairPuzzle(
  puzzle: RouteRepairPuzzle
): Direction[] | undefined {
  const solution: Direction[] = [];

  for (const packet of puzzle.packets) {
    const path = findShortestPacketPath(packet, puzzle);

    if (!path) {
      return undefined;
    }

    solution.push(...pathToDirections(path));
  }

  return solution;
}

export function createRouteRepairPuzzle(
  seed = DEFAULT_ROUTE_REPAIR_SEED
): RouteRepairPuzzle {
  const normalizedSeed = normalizeSeed(seed);

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const attemptSeed = normalizedSeed + attempt * 9973;
    const random = createRandom(attemptSeed);
    const puzzle: RouteRepairPuzzle = {
      blockedCells: createBlockedCells(random),
      moveLimit: ROUTE_REPAIR_MOVE_LIMIT,
      packets: createPackets(random),
      seed: attemptSeed,
    };
    const solution = solveRouteRepairPuzzle(puzzle);

    if (
      solution &&
      solution.length + MOVE_LIMIT_MARGIN <= ROUTE_REPAIR_MOVE_LIMIT
    ) {
      return {
        ...puzzle,
        moveLimit: Math.max(
          MIN_MOVE_LIMIT,
          solution.length + MOVE_LIMIT_MARGIN
        ),
      };
    }
  }

  return {
    blockedCells: [
      { column: 2, row: 0 },
      { column: 2, row: 3 },
      { column: 4, row: 2 },
      { column: 4, row: 4 },
    ],
    moveLimit: ROUTE_REPAIR_MOVE_LIMIT,
    packets: routeTemplates.map((template) => ({
      color: template.color,
      id: template.id,
      label: template.label,
      port: template.port,
      start: { column: 0, row: template.startRow },
      target: {
        column: ROUTE_REPAIR_GRID.columns - 1,
        row: template.startRow,
      },
    })),
    seed: normalizedSeed,
  };
}

export function createRouteRepairSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);

    return values[0] ?? DEFAULT_ROUTE_REPAIR_SEED;
  }

  return Date.now();
}

export function getDirectionBetweenCells(
  from: Cell,
  to: Cell
): Direction | undefined {
  return routeRepairDirections.find((direction) => {
    const delta = directionDeltas[direction];

    return (
      from.column + delta.column === to.column &&
      from.row + delta.row === to.row
    );
  });
}

export function createInitialRouteRepairState(
  puzzle = createRouteRepairPuzzle(),
  movesRemaining = puzzle.moveLimit
): RouteRepairState {
  const firstPacket = puzzle.packets[0];

  return {
    activePacketIndex: 0,
    currentPath: [firstPacket.start],
    deliveredRoutes: [],
    head: firstPacket.start,
    lastMessage: "This board is generated and checked for a solution.",
    movesRemaining,
    puzzle,
    status: "playing",
  };
}

export function moveRouteRepairSignal(
  state: RouteRepairState,
  direction: Direction
): RouteRepairState {
  if (state.status !== "playing") {
    return state;
  }

  const activePacket = state.puzzle.packets[state.activePacketIndex];
  const nextHead = moveCell(state.head, direction);

  if (!isInsideGrid(nextHead)) {
    return {
      ...state,
      lastMessage: "That edge is outside the board.",
    };
  }

  if (isBlockedCell(nextHead, state.puzzle)) {
    return {
      ...state,
      lastMessage: "That cell is blocked.",
    };
  }

  if (hasLoopedBack(state.currentPath, nextHead)) {
    return {
      ...state,
      lastMessage: "The current path cannot cross itself.",
    };
  }

  const previousCell = state.currentPath.at(-2);
  const isBacktracking = Boolean(
    previousCell && isSameCell(previousCell, nextHead)
  );
  const nextPath = isBacktracking
    ? state.currentPath.slice(0, -1)
    : [...state.currentPath, nextHead];
  const movesRemaining = Math.max(0, state.movesRemaining - 1);
  const reachedTarget =
    !isBacktracking && isSameCell(nextHead, activePacket.target);

  if (reachedTarget) {
    const deliveredRoutes = [
      ...state.deliveredRoutes,
      { packetId: activePacket.id, path: nextPath },
    ];

    if (state.activePacketIndex === state.puzzle.packets.length - 1) {
      return {
        ...state,
        currentPath: nextPath,
        deliveredRoutes,
        head: nextHead,
        lastMessage: "All paths are live.",
        movesRemaining,
        status: "won",
      };
    }

    if (movesRemaining === 0) {
      return {
        ...state,
        currentPath: nextPath,
        deliveredRoutes,
        head: nextHead,
        lastMessage: "Packet delivered, but the signal budget is empty.",
        movesRemaining,
        status: "lost",
      };
    }

    const nextPacket = state.puzzle.packets[state.activePacketIndex + 1];

    return {
      ...state,
      activePacketIndex: state.activePacketIndex + 1,
      currentPath: [nextPacket.start],
      deliveredRoutes,
      head: nextPacket.start,
      lastMessage: `${activePacket.label} is live. Continue with ${nextPacket.label}.`,
      movesRemaining,
    };
  }

  return {
    ...state,
    currentPath: nextPath,
    head: nextHead,
    lastMessage: isBacktracking ? "Path segment pulled back." : "Signal moved.",
    movesRemaining,
    status: movesRemaining === 0 ? "lost" : "playing",
  };
}
