"use client";

import {
  PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { actionClassNames } from "@/components/controlStyles";
import {
  branchCurve,
  DIAGRAM_COLORS,
  FlowMode,
  flowWidth,
  Point,
  pointOnCurve,
  terminalDirection,
  voltageColor,
} from "@/features/load-flow/diagram";
import {
  BranchFlowSolution,
  BusSolution,
} from "@/features/load-flow/solver/types";
import { BusNode, LineEdge } from "@/features/load-flow/state/loadFlowStore";

const TERMINALS: Array<"from" | "to"> = ["from", "to"];
const compactQuery = "(max-width: 600px)";
function subscribeViewport(callback: () => void) {
  const media = window.matchMedia(compactQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

interface Props {
  buses: BusNode[];
  branches: LineEdge[];
  selectedElementId: string | null;
  selectedElementType: "BUS" | "BRANCH" | null;
  onBusSelect: (id: string) => void;
  onBusMove: (id: string, x: number, y: number) => void;
  onBranchSelect: (id: string) => void;
  busSolutionsById: Map<string, BusSolution>;
  branchFlowsById: Map<string, BranchFlowSolution>;
  mode: FlowMode;
  animate: boolean;
}

export function SingleLineDiagram({
  buses: sourceBuses,
  branches,
  selectedElementId,
  selectedElementType,
  onBusSelect,
  onBusMove,
  onBranchSelect,
  busSolutionsById,
  branchFlowsById,
  mode,
  animate,
}: Props) {
  const titleId = useId();
  const compact = useSyncExternalStore(
    subscribeViewport,
    () => window.matchMedia(compactQuery).matches,
    () => false
  );
  const offsets =
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
      : sourceBuses.map(() => ({ x: 0, y: 0 }));
  const buses = sourceBuses.map((bus, index) => ({
    ...bus,
    x: bus.x + offsets[index].x,
    y: bus.y + offsets[index].y,
  }));
  function moveBus(id: string, x: number, y: number) {
    const offset = offsets[sourceBuses.findIndex((bus) => bus.id === id)];
    onBusMove(id, x - offset.x, y - offset.y);
  }
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    pointer: number;
    id?: string;
    start: Point;
    origin: Point;
  } | null>(null);
  function bounds() {
    const minX = Math.min(0, ...buses.map((bus) => bus.x - 100));
    const minY = Math.min(0, ...buses.map((bus) => bus.y - 70));
    return {
      minX,
      minY,
      width:
        Math.max(compact ? 390 : 780, ...buses.map((bus) => bus.x + 100)) -
        minX,
      height:
        Math.max(compact ? 580 : 520, ...buses.map((bus) => bus.y + 70)) - minY,
    };
  }
  const [camera, setCamera] = useState(bounds);
  useEffect(() => {
    setCamera(bounds());
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [compact, sourceBuses.length]);
  const { minX, minY, width, height } = camera;
  const viewWidth = width / zoom;
  const viewHeight = height / zoom;
  const viewX = minX + (width - viewWidth) / 2 + pan.x;
  const viewY = minY + (height - viewHeight) / 2 + pan.y;
  const slackAngle =
    busSolutionsById.get(buses.find((bus) => bus.type === "SLACK")?.id ?? "")
      ?.voltageAngleDeg ?? 0;

  function svgPoint(event: PointerEvent) {
    const matrix = svgRef.current?.getScreenCTM()?.inverse();
    return matrix
      ? {
          x: matrix.a * event.clientX + matrix.c * event.clientY + matrix.e,
          y: matrix.b * event.clientX + matrix.d * event.clientY + matrix.f,
        }
      : { x: 0, y: 0 };
  }

  function startDrag(event: PointerEvent<SVGElement>, bus?: BusNode) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointer: event.pointerId,
      id: bus?.id,
      start: svgPoint(event),
      origin: bus ? { x: bus.x, y: bus.y } : pan,
    };
    if (bus) onBusSelect(bus.id);
  }

  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const point = svgPoint(event);
    if (active.id)
      moveBus(
        active.id,
        active.origin.x + point.x - active.start.x,
        active.origin.y + point.y - active.start.y
      );
    else {
      setPan({
        x: pan.x + active.start.x - point.x,
        y: pan.y + active.start.y - point.y,
      });
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Select a bus or line. Drag buses to arrange; drag the background to
          pan.
        </p>
        <div className="flex items-center gap-1" aria-label="Diagram zoom">
          <button
            className={actionClassNames({ variant: "secondary", size: "sm" })}
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((value) => Math.max(0.5, value / 1.4))}
          >
            −
          </button>
          <button
            className={actionClassNames({ variant: "quiet", size: "sm" })}
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
              setCamera(bounds());
            }}
          >
            Fit diagram
          </button>
          <button
            className={actionClassNames({ variant: "secondary", size: "sm" })}
            aria-label="Zoom in"
            disabled={zoom >= 8}
            onClick={() => setZoom((value) => Math.min(8, value * 1.4))}
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
        className="load-flow-diagram h-[540px] w-full touch-none rounded-md border border-line bg-white md:h-[520px]"
        viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
        onPointerDown={(event) => startDrag(event)}
        onPointerMove={moveDrag}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
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
          const components: Array<"p" | "q"> =
            mode === "both" ? ["p", "q"] : [mode];
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
              {(buses.length <= 9 || selected) && (
                <g pointerEvents="none">
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
              )}
            </g>
          );
        })}
        {buses.map((bus) => {
          const solution = busSolutionsById.get(bus.id);
          const angle = solution ? solution.voltageAngleDeg - slackAngle : 0;
          const selected =
            selectedElementType === "BUS" && selectedElementId === bus.id;
          const color = voltageColor(solution?.voltageMagnitudePu);
          return (
            <g
              key={bus.id}
              role="button"
              tabIndex={0}
              aria-label={`Bus ${bus.name}, ${bus.type}${solution ? `, ${solution.voltageMagnitudePu.toFixed(3)} per unit, ${angle.toFixed(2)} degrees relative to slack` : ", unsolved"}`}
              aria-pressed={selected}
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
                {bus.type === "SLACK"
                  ? "Slack · reference"
                  : bus.type === "PV"
                    ? "PV · generation"
                    : "PQ · load"}
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
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Arrows show flow at each end; labels are signed values at the from end.
        Thicker lines mean larger magnitudes. Voltage bands are visual guides,
        not equipment limits. Phasors show angle relative to the slack bus, at
        true scale. Crossings are not connections.
      </p>
      <p className="mt-1 text-xs text-muted">
        Motion shows steady-state direction only—not AC waveforms or transient
        behavior. Reduced-motion settings keep it still.
      </p>
    </div>
  );
}
