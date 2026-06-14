"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaHouse,
  FaRotateRight,
} from "react-icons/fa6";

import Link from "next/link";

import {
  Cell,
  cellKey,
  createInitialRouteRepairState,
  createRouteRepairPuzzle,
  createRouteRepairSeed,
  DEFAULT_ROUTE_REPAIR_SEED,
  Direction,
  getDirectionBetweenCells,
  isSameCell,
  moveRouteRepairSignal,
  PacketColor,
  ROUTE_REPAIR_GRID,
  RouteRepairPacket,
  RouteRepairState,
} from "@/features/route-repair/routeRepair";

type RouteRepairGameProps = {
  initialSeed?: number;
  randomizeOnMount?: boolean;
};

type RouteRepairColorStyle = {
  border: string;
  button: string;
  dot: string;
  ring: string;
  text: string;
  trace: string;
};

const colorStyles: Record<PacketColor, RouteRepairColorStyle> = {
  cyan: {
    border: "border-cyan-300/70",
    button: "border-cyan-300/70 bg-cyan-300/10 text-cyan-100",
    dot: "bg-cyan-200 shadow-cyan-200/50",
    ring: "ring-cyan-200",
    text: "text-cyan-100",
    trace: "bg-cyan-300/25",
  },
  amber: {
    border: "border-amber-300/70",
    button: "border-amber-300/70 bg-amber-300/10 text-amber-100",
    dot: "bg-amber-200 shadow-amber-200/50",
    ring: "ring-amber-200",
    text: "text-amber-100",
    trace: "bg-amber-300/25",
  },
  emerald: {
    border: "border-emerald-300/70",
    button: "border-emerald-300/70 bg-emerald-300/10 text-emerald-100",
    dot: "bg-emerald-200 shadow-emerald-200/50",
    ring: "ring-emerald-200",
    text: "text-emerald-100",
    trace: "bg-emerald-300/25",
  },
  rose: {
    border: "border-rose-300/70",
    button: "border-rose-300/70 bg-rose-300/10 text-rose-100",
    dot: "bg-rose-200 shadow-rose-200/50",
    ring: "ring-rose-200",
    text: "text-rose-100",
    trace: "bg-rose-300/25",
  },
};

const directionButtons: Array<{
  direction: Direction;
  label: string;
  icon: typeof FaArrowUp;
  className: string;
}> = [
  {
    direction: "up",
    label: "Move up",
    icon: FaArrowUp,
    className: "col-start-2 row-start-1",
  },
  {
    direction: "left",
    label: "Move left",
    icon: FaArrowLeft,
    className: "col-start-1 row-start-2",
  },
  {
    direction: "right",
    label: "Move right",
    icon: FaArrowRight,
    className: "col-start-3 row-start-2",
  },
  {
    direction: "down",
    label: "Move down",
    icon: FaArrowDown,
    className: "col-start-2 row-start-3",
  },
];

const keyToDirection: Record<string, Direction> = {
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  a: "left",
  d: "right",
  s: "down",
  w: "up",
  A: "left",
  D: "right",
  S: "down",
  W: "up",
};

function getCellAt(row: number, column: number): Cell {
  return { row, column };
}

function getPacketForCell(
  cell: Cell,
  role: "start" | "target",
  packets: RouteRepairPacket[]
) {
  return packets.find((packet) =>
    isSameCell(role === "start" ? packet.start : packet.target, cell)
  );
}

function getDeliveredCellStyles(state: RouteRepairState, key: string): string {
  const deliveredRoute = state.deliveredRoutes.find((route) =>
    route.path.some((cell) => cellKey(cell) === key)
  );

  if (!deliveredRoute) {
    return "";
  }

  const packet = state.puzzle.packets.find(
    (candidate) => candidate.id === deliveredRoute.packetId
  );

  return packet ? colorStyles[packet.color].trace : "";
}

function StatusPanel({ state }: { state: RouteRepairState }) {
  const activePacket = state.puzzle.packets[state.activePacketIndex];

  if (state.status === "won") {
    return (
      <p className="text-body-sm text-accent-success">
        Route repaired. The missing page is still missing, but the way back is
        live.
      </p>
    );
  }

  if (state.status === "lost") {
    return (
      <p className="text-body-sm text-rose-200">
        Signal budget exhausted. Restart the board and try a cleaner route.
      </p>
    );
  }

  return (
    <p className="text-body-sm text-gray-300">
      Active path{" "}
      <span className={`font-semibold ${colorStyles[activePacket.color].text}`}>
        {activePacket.label}
      </span>{" "}
      to port {activePacket.port}. {state.lastMessage}
    </p>
  );
}

export function RouteRepairGame({
  initialSeed = DEFAULT_ROUTE_REPAIR_SEED,
  randomizeOnMount = true,
}: RouteRepairGameProps) {
  const randomized = useRef(false);
  const [state, setState] = useState(() =>
    createInitialRouteRepairState(createRouteRepairPuzzle(initialSeed))
  );

  const puzzle = state.puzzle;
  const activePacket = puzzle.packets[state.activePacketIndex];
  const blockedCellKeys = useMemo(
    () => new Set(puzzle.blockedCells.map(cellKey)),
    [puzzle.blockedCells]
  );
  const currentPathKeys = useMemo(
    () => new Set(state.currentPath.map(cellKey)),
    [state.currentPath]
  );

  useEffect(() => {
    if (!randomizeOnMount || randomized.current) {
      return;
    }

    randomized.current = true;
    const nextPuzzle = createRouteRepairPuzzle(createRouteRepairSeed());
    setState(createInitialRouteRepairState(nextPuzzle));
  }, [randomizeOnMount]);

  const handleMove = (direction: Direction) => {
    setState((previous) => moveRouteRepairSignal(previous, direction));
  };

  const handleCellClick = (cell: Cell) => {
    const direction = getDirectionBetweenCells(state.head, cell);

    if (direction) {
      handleMove(direction);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = keyToDirection[event.key];

    if (!direction) {
      return;
    }

    event.preventDefault();
    handleMove(direction);
  };

  const restart = () => {
    setState((previous) => createInitialRouteRepairState(previous.puzzle));
  };

  const newPuzzle = () => {
    setState((previous) =>
      createInitialRouteRepairState(
        createRouteRepairPuzzle(previous.puzzle.seed + 1)
      )
    );
  };

  return (
    <section
      aria-labelledby="route-repair-title"
      className="w-full rounded-lg border border-white/10 bg-slate-950/80 p-4 text-left shadow-2xl shadow-black/30 backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3
                id="route-repair-title"
                className="text-heading-sm font-semibold text-white"
              >
                Route Repair
              </h3>
              <StatusPanel state={state} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-72">
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-xs uppercase text-gray-500">Moves</p>
                <p className="text-heading-sm font-semibold text-white">
                  {state.movesRemaining}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-xs uppercase text-gray-500">Delivered</p>
                <p className="text-heading-sm font-semibold text-white">
                  {state.deliveredRoutes.length}/{puzzle.packets.length}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-xs uppercase text-gray-500">Budget</p>
                <p className="text-heading-sm font-semibold text-white">
                  {puzzle.moveLimit}
                </p>
              </div>
            </div>
          </div>

          <div
            role="group"
            aria-label="Route Repair board"
            aria-describedby="route-repair-instructions"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-inner shadow-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-link lg:mx-auto lg:max-w-[34rem]"
          >
            <img
              src="/assets/not-found-game/route-repair-board.webp"
              alt=""
              aria-hidden="true"
              width="1568"
              height="1003"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              draggable={false}
              className="absolute inset-0 size-full object-cover opacity-85"
            />
            <div className="absolute inset-[12%_14%_12%_14%]">
              <div
                className="grid size-full gap-1"
                style={{
                  gridTemplateColumns: `repeat(${ROUTE_REPAIR_GRID.columns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${ROUTE_REPAIR_GRID.rows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: ROUTE_REPAIR_GRID.rows }).flatMap(
                  (_, row) =>
                    Array.from({ length: ROUTE_REPAIR_GRID.columns }).map(
                      (__, column) => {
                        const cell = getCellAt(row, column);
                        const key = cellKey(cell);
                        const isBlocked = blockedCellKeys.has(key);
                        const startPacket = getPacketForCell(
                          cell,
                          "start",
                          puzzle.packets
                        );
                        const targetPacket = getPacketForCell(
                          cell,
                          "target",
                          puzzle.packets
                        );
                        const isCurrentPath = currentPathKeys.has(key);
                        const isHead = isSameCell(state.head, cell);
                        const deliveredStyles = getDeliveredCellStyles(
                          state,
                          key
                        );
                        const activeStyles = colorStyles[activePacket.color];
                        const pathStyles = isCurrentPath
                          ? activeStyles.trace
                          : deliveredStyles;

                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={state.status !== "playing"}
                            onClick={() => handleCellClick(cell)}
                            aria-label={`Cell ${column + 1}, ${row + 1}`}
                            className={`relative rounded-md border border-white/10 transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-link disabled:cursor-default ${pathStyles} ${
                              isBlocked
                                ? "bg-[repeating-linear-gradient(135deg,rgba(248,113,113,0.30)_0,rgba(248,113,113,0.30)_6px,rgba(15,23,42,0.65)_6px,rgba(15,23,42,0.65)_12px)]"
                                : "bg-slate-950/15 hover:bg-white/10"
                            } ${
                              isHead
                                ? `ring-2 ring-offset-2 ring-offset-slate-950 ${activeStyles.ring}`
                                : ""
                            }`}
                          >
                            {startPacket ? (
                              <span
                                className={`absolute left-1 top-1 rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold ${colorStyles[startPacket.color].button}`}
                              >
                                {startPacket.label}
                              </span>
                            ) : null}
                            {targetPacket ? (
                              <span
                                className={`absolute bottom-1 right-1 flex size-6 items-center justify-center rounded-full border text-xs font-semibold ${colorStyles[targetPacket.color].button}`}
                              >
                                {targetPacket.port}
                              </span>
                            ) : null}
                            {isCurrentPath || deliveredStyles ? (
                              <span
                                aria-hidden="true"
                                className={`absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg ${
                                  isCurrentPath
                                    ? activeStyles.dot
                                    : "bg-white/50"
                                }`}
                              />
                            ) : null}
                          </button>
                        );
                      }
                    )
                )}
              </div>
            </div>
          </div>

          <p id="route-repair-instructions" className="sr-only">
            Use arrow keys, W A S D, direction buttons, or adjacent cells to
            move the active path through the board.
          </p>
        </div>

        <aside className="flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">
                Packet queue
              </p>
              <div className="mt-2 space-y-2">
                {puzzle.packets.map((packet, index) => {
                  const isDelivered = state.deliveredRoutes.some(
                    (route) => route.packetId === packet.id
                  );
                  const isActive =
                    state.status === "playing" &&
                    index === state.activePacketIndex;

                  return (
                    <div
                      key={packet.id}
                      className={`flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-sm ${
                        isActive
                          ? colorStyles[packet.color].button
                          : "border-white/10 bg-white/5 text-gray-300"
                      }`}
                    >
                      <span className="font-semibold">{packet.label}</span>
                      <span>
                        {isDelivered ? "live" : `port ${packet.port}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mx-auto grid w-36 grid-cols-3 grid-rows-3 gap-2">
              {directionButtons.map(
                ({ direction, label, icon: Icon, className }) => (
                  <button
                    key={direction}
                    type="button"
                    aria-label={label}
                    disabled={state.status !== "playing"}
                    onClick={() => handleMove(direction)}
                    className={`flex size-11 items-center justify-center rounded-md border border-white/15 bg-white/5 text-gray-100 transition-colors hover:border-accent-secondary/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-link disabled:opacity-45 ${className}`}
                  >
                    <Icon aria-hidden="true" />
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-center text-xs uppercase tracking-wide text-gray-500">
              Seed {puzzle.seed}
            </p>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-accent-link/70 bg-accent-link/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-accent-link/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-link"
            >
              <FaHouse aria-hidden="true" />
              Back home
            </Link>
            <button
              type="button"
              onClick={restart}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 transition-colors hover:border-accent-secondary/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-link"
            >
              <FaRotateRight aria-hidden="true" />
              Restart
            </button>
            <button
              type="button"
              onClick={newPuzzle}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 transition-colors hover:border-accent-secondary/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-link"
            >
              <FaRotateRight aria-hidden="true" />
              New puzzle
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
