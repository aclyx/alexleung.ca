"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { actionClassNames } from "@/components/controlStyles";
import {
  branchCurve,
  DIAGRAM_COLORS,
  flowAnimationDuration,
  FlowMode,
  flowWidth,
  placeFlowLabels,
  Point,
  pointOnCurve,
  terminalDirection,
  voltageColor,
} from "@/features/load-flow/diagram";
import { Generator, Load } from "@/features/load-flow/model/types";
import {
  BranchFlowSolution,
  BusSolution,
} from "@/features/load-flow/solver/types";
import { BusNode, LineEdge } from "@/features/load-flow/state/loadFlowStore";

import { useDiagramViewport } from "./useDiagramViewport";

const TERMINALS: Array<"from" | "to"> = ["from", "to"];
const DEVICE_LABELS = {
  generator: "Generator",
  load: "Load",
  grid: "Grid supply",
};
type DeviceKind = keyof typeof DEVICE_LABELS;

function DeviceSymbol({ kind }: { kind: DeviceKind }) {
  return (
    <g
      fill="white"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      {kind === "generator" ? (
        <>
          <circle r="14" />
          <path d="M -9 0 C -6 -10 -3 -10 0 0 S 6 10 9 0" fill="none" />
        </>
      ) : kind === "load" ? (
        <path d="M -12 -8 H 12 L 0 12 Z" />
      ) : (
        <path
          d="M -10 14 L -3 -14 H 3 L 10 14 M -10 -7 H 10 M -13 1 H 13 M -7 14 L 7 1 M 7 14 L -7 1"
          fill="none"
        />
      )}
    </g>
  );
}

const compactQuery = "(max-width: 600px)";
function subscribeViewport(callback: () => void) {
  const media = window.matchMedia(compactQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

interface Props {
  buses: BusNode[];
  branches: LineEdge[];
  generators: Generator[];
  loads: Load[];
  baseMVA: number;
  selectedElementId: string | null;
  selectedElementType: "BUS" | "BRANCH" | null;
  onBusSelect: (id: string) => void;
  onBusMove: (id: string, x: number, y: number) => void;
  onBranchSelect: (id: string) => void;
  busSolutionsById: Map<string, BusSolution>;
  branchFlowsById: Map<string, BranchFlowSolution>;
  mode: FlowMode;
  animate: boolean;
  showAmounts: boolean;
}

export function SingleLineDiagram({
  buses: sourceBuses,
  branches,
  generators,
  loads,
  baseMVA,
  selectedElementId,
  selectedElementType,
  onBusSelect,
  onBusMove,
  onBranchSelect,
  busSolutionsById,
  branchFlowsById,
  mode,
  animate,
  showAmounts,
}: Props) {
  const titleId = useId();
  const components: Array<"p" | "q"> = mode === "both" ? ["p", "q"] : [mode];
  const generatorBuses = new Set(
    generators
      .filter((generator) => generator.status === "ON")
      .map((generator) => generator.busId)
  );
  const loadBuses = new Set(
    loads.filter((load) => load.status === "ON").map((load) => load.busId)
  );
  const compact = useSyncExternalStore(
    subscribeViewport,
    () => window.matchMedia(compactQuery).matches,
    () => false
  );
  const offsets = useMemo(
    () =>
      compact && sourceBuses.length <= 3
        ? sourceBuses.map((_, index) =>
            sourceBuses.length === 3
              ? [
                  { x: -40, y: -30 },
                  { x: -360, y: 170 },
                  { x: -290, y: 80 },
                ][index]
              : ([
                  { x: -40, y: -70 },
                  { x: -360, y: 230 },
                ][index] ?? { x: 0, y: 0 })
          )
        : sourceBuses.map(() => ({ x: 0, y: 0 })),
    [compact, sourceBuses.length]
  );
  const buses = useMemo(
    () =>
      sourceBuses.map((bus, index) => ({
        ...bus,
        x: bus.x + offsets[index].x,
        y: bus.y + offsets[index].y,
      })),
    [sourceBuses, offsets]
  );
  const amountPositions = useMemo(
    () =>
      showAmounts
        ? placeFlowLabels(branches, buses)
        : new Map<string, { position: Point; anchor: Point }>(),
    [showAmounts, branches, buses]
  );
  function moveBus(id: string, x: number, y: number) {
    const offset = offsets[sourceBuses.findIndex((bus) => bus.id === id)];
    onBusMove(id, x - offset.x, y - offset.y);
  }
  function bounds() {
    const minX = Math.min(0, ...buses.map((bus) => bus.x - 100));
    const minY = Math.min(0, ...buses.map((bus) => bus.y - 115));
    return {
      minX,
      minY,
      width:
        Math.max(compact ? 390 : 780, ...buses.map((bus) => bus.x + 100)) -
        minX,
      height:
        Math.max(compact ? 580 : 520, ...buses.map((bus) => bus.y + 105)) -
        minY,
    };
  }
  const [camera, setCamera] = useState(bounds);
  useEffect(() => {
    setCamera(bounds());
  }, [compact, sourceBuses.length]);
  const {
    svgRef,
    zoom,
    viewX,
    viewY,
    viewWidth,
    viewHeight,
    zoomBy,
    trackPointer,
    startDrag,
    movePointer,
    endPointer,
    suppressClick,
  } = useDiagramViewport(camera, moveBus, onBusSelect);
  const slackAngle =
    busSolutionsById.get(buses.find((bus) => bus.type === "SLACK")?.id ?? "")
      ?.voltageAngleDeg ?? 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-lg text-sm text-muted">
          Select a bus or line. Drag buses to arrange; drag the background to
          pan. Pinch or ⌘/Ctrl-scroll to zoom.
        </p>
        <div className="flex items-center gap-1" aria-label="Diagram zoom">
          <button
            className={actionClassNames({ variant: "secondary", size: "sm" })}
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
            onClick={() => zoomBy(1 / 1.4)}
          >
            −
          </button>
          <button
            className={actionClassNames({ variant: "quiet", size: "sm" })}
            onClick={() => {
              setCamera(bounds());
            }}
          >
            Fit diagram
          </button>
          <button
            className={actionClassNames({ variant: "secondary", size: "sm" })}
            aria-label="Zoom in"
            disabled={zoom >= 8}
            onClick={() => zoomBy(1.4)}
          >
            +
          </button>
        </div>
      </div>
      <svg
        ref={svgRef}
        role="group"
        aria-labelledby={titleId}
        data-testid="load-flow-diagram"
        className="load-flow-diagram h-[540px] w-full touch-none select-none rounded-md border border-line bg-white md:h-[520px]"
        viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
        onPointerDownCapture={trackPointer}
        onPointerDown={(event) => startDrag(event)}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail > 0) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <title id={titleId}>
          Single-line diagram: bus voltages, phase angles, and terminal power
          flows
        </title>
        <defs>
          <pattern
            id={`${titleId}-grid`}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.8" fill="#d3d5d5" />
          </pattern>
        </defs>
        <rect
          x={viewX}
          y={viewY}
          width={viewWidth}
          height={viewHeight}
          fill={`url(#${titleId}-grid)`}
        />
        {branches.map((branch) => {
          const { a, b, c } = branchCurve(branch, branches, buses);
          const d = `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
          const selected =
            selectedElementType === "BRANCH" && selectedElementId === branch.id;
          const offline = branch.status === "OUT_OF_SERVICE";
          const flow = offline ? undefined : branchFlowsById.get(branch.id);
          const center = pointOnCurve(a, b, c, 0.5);
          return (
            <g
              key={branch.id}
              role="button"
              tabIndex={0}
              aria-label={`Line ${branch.id}: ${a.name} to ${b.name}${offline ? ", out of service" : ""}`}
              aria-pressed={selected}
              className="cursor-pointer outline-none"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onBranchSelect(branch.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onBranchSelect(branch.id);
                }
              }}
            >
              <title>{`${branch.id}: ${a.name} — ${b.name}${flow ? `; from end ${flow.pFromToMW.toFixed(2)} MW, ${flow.qFromToMVar.toFixed(2)} MVAr; to end ${flow.pToFromMW.toFixed(2)} MW, ${flow.qToFromMVar.toFixed(2)} MVAr (positive into line)` : "; no solved flow"}`}</title>
              <path d={d} fill="none" stroke="white" strokeWidth="16" />
              <path
                className="load-flow-line-focus"
                d={d}
                fill="none"
                stroke={selected ? "#202936" : "#858c95"}
                strokeWidth={selected ? 3 : 1.5}
                strokeDasharray={offline ? "7 7" : undefined}
              />
              <path d={d} fill="none" stroke="transparent" strokeWidth="28" />
              {flow &&
                components.map((component) => {
                  const fromValue =
                    component === "p" ? flow.pFromToMW : flow.qFromToMVar;
                  const toValue =
                    component === "p" ? flow.pToFromMW : flow.qToFromMVar;
                  const offset =
                    mode === "both" ? (component === "p" ? -6 : 6) : 0;
                  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
                  const shift = {
                    x: (-(b.y - a.y) / length) * offset,
                    y: ((b.x - a.x) / length) * offset,
                  };
                  return (
                    <g
                      key={component}
                      transform={`translate(${shift.x} ${shift.y})`}
                      pointerEvents="none"
                      data-component={component}
                    >
                      {TERMINALS.map((end) => {
                        const value = end === "from" ? fromValue : toValue;
                        const direction = terminalDirection(value, end);
                        if (!direction) return null;
                        const t = end === "from" ? 0.28 : 0.72;
                        const point = pointOnCurve(a, b, c, t);
                        const tangent = {
                          x: (1 - t) * (c.x - a.x) + t * (b.x - c.x),
                          y: (1 - t) * (c.y - a.y) + t * (b.y - c.y),
                        };
                        const angle =
                          (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI +
                          (direction < 0 ? 180 : 0);
                        const halfControl =
                          end === "from"
                            ? { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 }
                            : { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
                        const halfPath =
                          end === "from"
                            ? `M ${a.x} ${a.y} Q ${halfControl.x} ${halfControl.y} ${center.x} ${center.y}`
                            : `M ${center.x} ${center.y} Q ${halfControl.x} ${halfControl.y} ${b.x} ${b.y}`;
                        return (
                          <g
                            key={end}
                            data-terminal={end}
                            data-direction={direction}
                          >
                            <path
                              d={halfPath}
                              fill="none"
                              stroke={DIAGRAM_COLORS[component]}
                              strokeWidth={flowWidth(value)}
                              opacity="0.38"
                              strokeDasharray={
                                component === "q" ? "5 4" : undefined
                              }
                            />
                            {animate && (
                              <path
                                className="load-flow-motion"
                                data-testid="flow-motion"
                                d={halfPath}
                                fill="none"
                                stroke={DIAGRAM_COLORS[component]}
                                strokeWidth="2"
                                strokeDasharray="3 23"
                                style={{
                                  animationDuration: `${flowAnimationDuration(value)}s`,
                                  animationDirection:
                                    direction > 0 ? "normal" : "reverse",
                                }}
                              />
                            )}
                            <path
                              d="M -7 -5 L 0 0 L -7 5"
                              fill="none"
                              stroke={DIAGRAM_COLORS[component]}
                              strokeWidth="2.5"
                              transform={`translate(${point.x} ${point.y}) rotate(${angle})`}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
            </g>
          );
        })}
        {showAmounts &&
          branches.map((branch) => {
            const flow =
              branch.status === "OUT_OF_SERVICE"
                ? undefined
                : branchFlowsById.get(branch.id);
            const selected =
              selectedElementType === "BRANCH" &&
              selectedElementId === branch.id;
            const { position: center, anchor } = amountPositions.get(
              branch.id
            )!;
            return (
              <g key={branch.id} pointerEvents="none" data-testid="line-amount">
                <path
                  d={`M ${anchor.x} ${anchor.y} L ${center.x} ${center.y}`}
                  stroke="#858c95"
                  strokeWidth="1"
                />
                <rect
                  x={center.x - 53}
                  y={center.y - (flow ? 25 : 12)}
                  width="106"
                  height={flow ? 50 : 24}
                  rx="4"
                  fill="white"
                  stroke={selected ? "#202936" : "#d3d5d5"}
                />
                <text
                  x={center.x}
                  y={center.y + (flow ? -10 : 4)}
                  textAnchor="middle"
                  fill="#58616d"
                  fontSize="10"
                >
                  {branch.id.replace(/^line-/, "L ")}
                </text>
                {flow &&
                  components.map((component, index) => (
                    <text
                      key={component}
                      x={center.x}
                      y={center.y + 5 + index * 14}
                      textAnchor="middle"
                      fill={DIAGRAM_COLORS[component]}
                      fontSize="12"
                    >
                      {component === "p"
                        ? `${flow.pFromToMW.toFixed(1)} MW`
                        : `${flow.qFromToMVar.toFixed(1)} MVAr`}
                    </text>
                  ))}
              </g>
            );
          })}
        {buses.map((bus) => {
          const solution = busSolutionsById.get(bus.id);
          const angle = solution ? solution.voltageAngleDeg - slackAngle : 0;
          const selected =
            selectedElementType === "BUS" && selectedElementId === bus.id;
          const color = voltageColor(solution?.voltageMagnitudePu);
          const devices: DeviceKind[] = [];
          if (generatorBuses.has(bus.id)) devices.push("generator");
          else if (bus.type === "SLACK") devices.push("grid");
          if (loadBuses.has(bus.id)) devices.push("load");
          const demand = loads
            .filter((load) => load.busId === bus.id && load.status === "ON")
            .reduce(
              (total, load) => ({ p: total.p + load.p, q: total.q + load.q }),
              { p: 0, q: 0 }
            );
          const supply = solution
            ? {
                p: solution.pInjectionPu * baseMVA + demand.p,
                q: solution.qInjectionPu * baseMVA + demand.q,
              }
            : undefined;
          const deviceDescription = devices
            .map((kind) => {
              const power = kind === "load" ? demand : supply;
              return `${DEVICE_LABELS[kind]}${showAmounts && solution && power ? `: ${power.p.toFixed(1)} MW, ${power.q.toFixed(1)} MVAr` : ""}`;
            })
            .join("; ");
          return (
            <g
              key={bus.id}
              role="button"
              tabIndex={0}
              aria-label={`Bus ${bus.name}, ${bus.type}${devices.length ? `, ${devices.map((kind) => DEVICE_LABELS[kind]).join(", ")}` : ""}${solution ? `, ${solution.voltageMagnitudePu.toFixed(3)} per unit, ${angle.toFixed(2)} degrees relative to slack` : ", unsolved"}`}
              aria-pressed={selected}
              aria-description={deviceDescription || undefined}
              className="cursor-grab outline-none active:cursor-grabbing"
              transform={`translate(${bus.x} ${bus.y})`}
              onPointerDown={(event) => startDrag(event, bus)}
              onClick={() => onBusSelect(bus.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onBusSelect(bus.id);
                }
                const delta: Record<string, Point> = {
                  ArrowLeft: { x: -10, y: 0 },
                  ArrowRight: { x: 10, y: 0 },
                  ArrowUp: { x: 0, y: -10 },
                  ArrowDown: { x: 0, y: 10 },
                };
                if (delta[event.key]) {
                  event.preventDefault();
                  moveBus(
                    bus.id,
                    bus.x + delta[event.key].x,
                    bus.y + delta[event.key].y
                  );
                }
              }}
            >
              {devices.map((kind) => {
                const power = kind === "load" ? demand : supply;
                return (
                  <g
                    key={kind}
                    data-device={kind}
                    color="#58616d"
                    aria-hidden="true"
                  >
                    <title>{`${DEVICE_LABELS[kind]} at ${bus.name}`}</title>
                    <path
                      d={kind === "load" ? "M 55 43 V 64" : "M 55 -43 V -59"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <g
                      transform={`translate(55 ${kind === "load" ? 72 : -73})`}
                    >
                      <DeviceSymbol kind={kind} />
                      {showAmounts && solution && power && (
                        <g data-testid="device-amount">
                          <rect
                            x="-131"
                            y="-17"
                            width="113"
                            height="34"
                            rx="3"
                            fill="white"
                            opacity="0.95"
                          />
                          {components.map((component, index) => (
                            <text
                              key={component}
                              x="-127"
                              y={components.length === 1 ? 4 : -3 + index * 14}
                              fill={DIAGRAM_COLORS[component]}
                              fontSize="11"
                            >
                              {power[component].toFixed(1)}{" "}
                              {component === "p" ? "MW" : "MVAr"}
                            </text>
                          ))}
                        </g>
                      )}
                    </g>
                  </g>
                );
              })}
              <rect
                className="load-flow-bus-focus"
                x="-81"
                y="-43"
                width="162"
                height="86"
                rx="6"
                fill="white"
                stroke={selected ? "#202936" : "#d3d5d5"}
                strokeWidth={selected ? 2 : 1}
              />
              <path
                d="M -76 -32 V 32"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
              />
              <text
                x="-63"
                y="-22"
                fill="#202936"
                fontSize="13"
                fontWeight="600"
              >
                {bus.name.length > 16 ? `${bus.name.slice(0, 15)}…` : bus.name}
              </text>
              <text x="-63" y="-5" fill="#58616d" fontSize="10">
                {bus.type === "SLACK" ? "Slack · reference" : bus.type}
              </text>
              <text x="-63" y="16" fill={color} fontSize="14" fontWeight="600">
                {solution
                  ? `${solution.voltageMagnitudePu.toFixed(3)} pu`
                  : "Unsolved"}
              </text>
              <text x="-63" y="33" fill="#58616d" fontSize="11">
                {solution ? `${angle.toFixed(2)}°` : "—"}
              </text>
              {solution && (
                <g transform="translate(54 17)" aria-hidden="true">
                  <circle r="17" fill="none" stroke="#d3d5d5" />
                  <path d="M 0 0 H 18" stroke="#858c95" strokeDasharray="2 2" />
                  <g transform={`rotate(${-angle})`}>
                    <path
                      d="M 0 0 H 15 M 11 -3 L 15 0 L 11 3"
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                    />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div
        className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"
        aria-label="Diagram legend"
      >
        <span style={{ color: DIAGRAM_COLORS.p }}>━━ P · MW</span>
        <span style={{ color: DIAGRAM_COLORS.q }}>┄┄ Q · MVAr</span>
        <span style={{ color: DIAGRAM_COLORS.low }}>● V &lt; 0.95 pu</span>
        <span style={{ color: DIAGRAM_COLORS.normal }}>● 0.95–1.05 pu</span>
        <span style={{ color: DIAGRAM_COLORS.high }}>● V &gt; 1.05 pu</span>
        {(["generator", "load", "grid"] satisfies DeviceKind[]).map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1">
            <svg viewBox="-18 -18 36 36" className="h-5 w-5" aria-hidden="true">
              <DeviceSymbol kind={kind} />
            </svg>
            {DEVICE_LABELS[kind]}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Arrows show flow at each end; labels are signed values at the from end.
        Thicker lines mean larger magnitudes. Voltage bands are visual guides,
        not equipment limits. Phasors show angle relative to the slack bus, at
        true scale. Crossings are not connections. Device values show total
        generation or demand at each bus.
      </p>
      <p className="mt-1 text-xs text-muted">
        Motion speed is proportional to power magnitude on a fixed scale—not AC
        wave speed or transient behavior. Reduced-motion settings keep it still.
      </p>
    </div>
  );
}
