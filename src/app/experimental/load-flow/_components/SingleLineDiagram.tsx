import { PointerEvent, useCallback, useMemo, useRef, useState } from "react";

import {
  BranchFlowSolution,
  BusSolution,
} from "@/features/load-flow/solver/types";
import { BusNode, LineEdge } from "@/features/load-flow/state/loadFlowStore";

interface SingleLineDiagramProps {
  buses: BusNode[];
  branches: LineEdge[];
  selectedElementId: string | null;
  selectedElementType: "BUS" | "BRANCH" | null;
  onBusSelect: (busId: string) => void;
  onBusMove: (busId: string, x: number, y: number) => void;
  onBranchSelect: (branchId: string) => void;
  busSolutionsById?: Map<string, BusSolution>;
  branchFlowsById?: Map<string, BranchFlowSolution>;
}

const BUS_WIDTH = 88;
const BUS_HEIGHT = 66;
const BUS_HALF_WIDTH = BUS_WIDTH / 2;
const BUS_HALF_HEIGHT = BUS_HEIGHT / 2;
const DIAGRAM_PADDING = 48;
const MIN_VIEWBOX_WIDTH = 680;
const MIN_VIEWBOX_HEIGHT = 280;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.2;
const LINE_HOP_RADIUS = 10;
const MAX_ALWAYS_LABELED_BRANCHES = 20;
const DETAILED_LABEL_ZOOM = 1.6;
const MIN_BRANCH_LABEL_SEGMENT_LENGTH = 96;
const BRANCH_LABEL_HALF_WIDTH = 42;
const BRANCH_LABEL_TOP_OFFSET = 24;
const BRANCH_LABEL_BOTTOM_OFFSET = 10;
const BRANCH_LABEL_BUS_MARGIN = 0;

const clampZoom = (nextZoom: number) =>
  Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));

interface BranchSegment {
  branchId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  orientation: "HORIZONTAL" | "VERTICAL";
}

interface RoutedBranch {
  branchId: string;
  points: Array<{ x: number; y: number }>;
  segments: BranchSegment[];
}

interface BranchLabelPoint {
  x: number;
  y: number;
  segmentLength: number;
  hasClearance: boolean;
}

interface ClientToSvgMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

interface BusDragSession {
  busId: string;
  pointerOffsetX: number;
  pointerOffsetY: number;
}

interface SvgWheelListener {
  node: SVGSVGElement;
  handler: (event: WheelEvent) => void;
}

const getSegmentLength = (segment: BranchSegment) =>
  Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1);

const transformClientPoint = (
  matrix: ClientToSvgMatrix,
  clientX: number,
  clientY: number
) => ({
  x: matrix.a * clientX + matrix.c * clientY + matrix.e,
  y: matrix.b * clientX + matrix.d * clientY + matrix.f,
});

const branchLabelOverlapsBus = (
  point: { x: number; y: number },
  bus: BusNode
) => {
  const labelBox = {
    left: point.x - BRANCH_LABEL_HALF_WIDTH,
    right: point.x + BRANCH_LABEL_HALF_WIDTH,
    top: point.y - BRANCH_LABEL_TOP_OFFSET,
    bottom: point.y + BRANCH_LABEL_BOTTOM_OFFSET,
  };
  const busBox = {
    left: bus.x - BUS_HALF_WIDTH - BRANCH_LABEL_BUS_MARGIN,
    right: bus.x + BUS_HALF_WIDTH + BRANCH_LABEL_BUS_MARGIN,
    top: bus.y - BUS_HALF_HEIGHT - BRANCH_LABEL_BUS_MARGIN,
    bottom: bus.y + BUS_HALF_HEIGHT + BRANCH_LABEL_BUS_MARGIN,
  };

  return !(
    labelBox.right <= busBox.left ||
    busBox.right <= labelBox.left ||
    labelBox.bottom <= busBox.top ||
    busBox.bottom <= labelBox.top
  );
};

const toBranchLabelPoint = (segment: BranchSegment): BranchLabelPoint => ({
  x: (segment.x1 + segment.x2) / 2,
  y: (segment.y1 + segment.y2) / 2,
  segmentLength: getSegmentLength(segment),
  hasClearance: true,
});

const getBranchLabelPoint = (
  branch: RoutedBranch,
  buses: BusNode[]
): BranchLabelPoint => {
  const labelCandidates = branch.segments
    .map(toBranchLabelPoint)
    .sort((first, second) => second.segmentLength - first.segmentLength);

  if (labelCandidates.length === 0) {
    return {
      ...(branch.points.at(-1) ?? { x: 0, y: 0 }),
      segmentLength: 0,
      hasClearance: false,
    };
  }

  const clearCandidate = labelCandidates.find(
    (candidate) => !buses.some((bus) => branchLabelOverlapsBus(candidate, bus))
  );

  return clearCandidate ?? { ...labelCandidates[0], hasClearance: false };
};

const getOrthogonalCrossingPoint = (
  firstSegment: BranchSegment,
  secondSegment: BranchSegment
) => {
  if (firstSegment.orientation === secondSegment.orientation) {
    return null;
  }

  const horizontalSegment =
    firstSegment.orientation === "HORIZONTAL" ? firstSegment : secondSegment;
  const verticalSegment =
    firstSegment.orientation === "VERTICAL" ? firstSegment : secondSegment;

  const minHorizontalX = Math.min(horizontalSegment.x1, horizontalSegment.x2);
  const maxHorizontalX = Math.max(horizontalSegment.x1, horizontalSegment.x2);
  const minVerticalY = Math.min(verticalSegment.y1, verticalSegment.y2);
  const maxVerticalY = Math.max(verticalSegment.y1, verticalSegment.y2);
  const crossingX = verticalSegment.x1;
  const crossingY = horizontalSegment.y1;
  const isCrossing =
    crossingX > minHorizontalX &&
    crossingX < maxHorizontalX &&
    crossingY > minVerticalY &&
    crossingY < maxVerticalY;

  if (!isCrossing) {
    return null;
  }

  return { x: crossingX, y: crossingY };
};

const getBusCenter = (bus: BusNode) => ({
  x: bus.x,
  y: bus.y,
});

const toBranchSegments = (
  branchId: string,
  points: Array<{ x: number; y: number }>
): BranchSegment[] =>
  points.slice(0, -1).flatMap((fromPoint, index) => {
    const toPoint = points[index + 1];
    if (!toPoint) {
      return [];
    }
    if (fromPoint.x === toPoint.x && fromPoint.y === toPoint.y) {
      return [];
    }

    const orientation = fromPoint.y === toPoint.y ? "HORIZONTAL" : "VERTICAL";
    return [
      {
        branchId,
        x1: fromPoint.x,
        y1: fromPoint.y,
        x2: toPoint.x,
        y2: toPoint.y,
        orientation,
      },
    ];
  });

const lineClassName = (isSelected: boolean) =>
  isSelected
    ? "stroke-emerald-300 stroke-[4]"
    : "stroke-slate-300/85 stroke-[3] hover:stroke-emerald-200";

const busClassName = (isSelected: boolean) =>
  isSelected
    ? "fill-emerald-500/30 stroke-emerald-300"
    : "fill-slate-900 stroke-slate-200";

export function SingleLineDiagram({
  buses,
  branches,
  selectedElementId,
  selectedElementType,
  onBusSelect,
  onBusMove,
  onBranchSelect,
  busSolutionsById,
  branchFlowsById,
}: SingleLineDiagramProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragSessionRef = useRef<BusDragSession | null>(null);
  const svgWheelListenerRef = useRef<SvgWheelListener | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleSvgRef = useCallback((node: SVGSVGElement | null) => {
    const previousListener = svgWheelListenerRef.current;
    if (previousListener) {
      previousListener.node.removeEventListener(
        "wheel",
        previousListener.handler
      );
      svgWheelListenerRef.current = null;
    }

    svgRef.current = node;
    if (!node) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();
      setZoom((previousZoom) =>
        clampZoom(previousZoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))
      );
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    svgWheelListenerRef.current = { node, handler: handleWheel };
  }, []);

  const busesById = useMemo(
    () => new Map(buses.map((bus) => [bus.id, bus])),
    [buses]
  );
  const busCentersX = buses.map((bus) => bus.x);
  const busCentersY = buses.map((bus) => bus.y);

  const minBusCenterX = Math.min(...busCentersX);
  const maxBusCenterX = Math.max(...busCentersX);
  const minBusCenterY = Math.min(...busCentersY);
  const maxBusCenterY = Math.max(...busCentersY);

  const contentMinX = minBusCenterX - BUS_HALF_WIDTH;
  const contentMaxX = maxBusCenterX + BUS_HALF_WIDTH;
  const contentMinY = minBusCenterY - BUS_HALF_HEIGHT;
  const contentMaxY = maxBusCenterY + BUS_HALF_HEIGHT;

  const viewBoxX = contentMinX - DIAGRAM_PADDING;
  const viewBoxY = contentMinY - DIAGRAM_PADDING;
  const viewBoxWidth = Math.max(
    contentMaxX - contentMinX + DIAGRAM_PADDING * 2,
    MIN_VIEWBOX_WIDTH
  );
  const viewBoxHeight = Math.max(
    contentMaxY - contentMinY + DIAGRAM_PADDING * 2,
    MIN_VIEWBOX_HEIGHT
  );
  const viewBoxCenterX = viewBoxX + viewBoxWidth / 2;
  const viewBoxCenterY = viewBoxY + viewBoxHeight / 2;
  const zoomedViewBoxWidth = viewBoxWidth / zoom;
  const zoomedViewBoxHeight = viewBoxHeight / zoom;
  const zoomedViewBoxX = viewBoxCenterX - zoomedViewBoxWidth / 2;
  const zoomedViewBoxY = viewBoxCenterY - zoomedViewBoxHeight / 2;

  const handleZoomIn = () => {
    setZoom((previousZoom) => clampZoom(previousZoom + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setZoom((previousZoom) => clampZoom(previousZoom - ZOOM_STEP));
  };

  const handleBusPointerDown = (
    event: PointerEvent<SVGGElement>,
    busId: string
  ) => {
    const svg = svgRef.current;
    const bus = busesById.get(busId);
    const clientToSvgMatrix = svg?.getScreenCTM()?.inverse();

    if (!svg || !bus || !clientToSvgMatrix) {
      return;
    }

    event.preventDefault();
    const startPointer = transformClientPoint(
      clientToSvgMatrix,
      event.clientX,
      event.clientY
    );
    dragSessionRef.current = {
      busId,
      pointerOffsetX: bus.x - startPointer.x,
      pointerOffsetY: bus.y - startPointer.y,
    };
    onBusSelect(busId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBusPointerMove = (event: PointerEvent<SVGGElement>) => {
    const dragSession = dragSessionRef.current;
    const clientToSvgMatrix = svgRef.current?.getScreenCTM()?.inverse();
    if (!dragSession || !clientToSvgMatrix) {
      return;
    }

    const nextPointer = transformClientPoint(
      clientToSvgMatrix,
      event.clientX,
      event.clientY
    );

    onBusMove(
      dragSession.busId,
      nextPointer.x + dragSession.pointerOffsetX,
      nextPointer.y + dragSession.pointerOffsetY
    );
  };

  const handleBusPointerUp = (event: PointerEvent<SVGGElement>) => {
    dragSessionRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const routedBranchesById = useMemo(() => {
    const routedById = new Map<string, RoutedBranch>();

    branches.forEach((branch) => {
      const fromBus = busesById.get(branch.fromBusId);
      const toBus = busesById.get(branch.toBusId);

      if (!fromBus || !toBus) {
        return;
      }

      const from = getBusCenter(fromBus);
      const to = getBusCenter(toBus);
      const elbowX = to.x;
      const elbowY = from.y;

      const points = [
        { x: from.x, y: from.y },
        { x: elbowX, y: elbowY },
        { x: to.x, y: to.y },
      ];
      routedById.set(branch.id, {
        branchId: branch.id,
        points,
        segments: toBranchSegments(branch.id, points),
      });
    });

    return routedById;
  }, [branches, busesById]);

  const lineHopPointsByBranchId = useMemo(() => {
    const hopsByBranchId = new Map<string, Array<{ x: number; y: number }>>();

    branches.forEach((branch, branchIndex) => {
      const branchSegments = routedBranchesById.get(branch.id)?.segments ?? [];
      branches.slice(0, branchIndex).forEach((previousBranch) => {
        const previousSegments =
          routedBranchesById.get(previousBranch.id)?.segments ?? [];

        for (const currentSegment of branchSegments) {
          for (const previousSegment of previousSegments) {
            const crossingPoint = getOrthogonalCrossingPoint(
              currentSegment,
              previousSegment
            );
            if (!crossingPoint) {
              continue;
            }

            const branchHops = hopsByBranchId.get(branch.id) ?? [];
            branchHops.push(crossingPoint);
            hopsByBranchId.set(branch.id, branchHops);
          }
        }
      });
    });

    return hopsByBranchId;
  }, [routedBranchesById, branches]);

  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-slate-700 bg-slate-950/60 p-3">
      {buses.length === 0 ? (
        <p className="text-sm text-gray-300">
          Add buses from the palette to render the one-line diagram.
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-emerald-300 hover:text-white"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-emerald-300 hover:text-white"
              aria-label="Zoom in"
            >
              +
            </button>
            <span className="text-xs text-slate-400">
              {Math.round(zoom * 100)}% (Ctrl + wheel)
            </span>
          </div>
          <svg
            ref={handleSvgRef}
            viewBox={`${zoomedViewBoxX} ${zoomedViewBoxY} ${zoomedViewBoxWidth} ${zoomedViewBoxHeight}`}
            role="img"
            aria-label="Single line diagram"
            className="h-[360px] min-w-[980px] w-full"
          >
            <rect
              x={viewBoxX}
              y={viewBoxY}
              width={viewBoxWidth}
              height={viewBoxHeight}
              className="fill-slate-950"
            />

            {branches.map((branch) => {
              const fromBus = busesById.get(branch.fromBusId);
              const toBus = busesById.get(branch.toBusId);

              if (!fromBus || !toBus) {
                return null;
              }

              const routedBranch = routedBranchesById.get(branch.id);
              if (!routedBranch) {
                return null;
              }
              const labelPoint = getBranchLabelPoint(routedBranch, buses);
              const isSelected =
                selectedElementType === "BRANCH" &&
                selectedElementId === branch.id;
              const showBranchLabels =
                labelPoint.hasClearance &&
                labelPoint.segmentLength >= MIN_BRANCH_LABEL_SEGMENT_LENGTH &&
                (branches.length <= MAX_ALWAYS_LABELED_BRANCHES ||
                  zoom >= DETAILED_LABEL_ZOOM ||
                  isSelected);
              const branchFlow = branchFlowsById?.get(branch.id);
              const activePowerFromTo = branchFlow?.pFromToMW;
              const flowDirectionSymbol =
                activePowerFromTo === undefined
                  ? null
                  : activePowerFromTo >= 0
                    ? "→"
                    : "←";
              const flowMagnitudeMW =
                activePowerFromTo === undefined
                  ? null
                  : Math.abs(activePowerFromTo).toFixed(2);

              return (
                <g
                  key={branch.id}
                  className="cursor-pointer"
                  onClick={() => onBranchSelect(branch.id)}
                >
                  <polyline
                    points={routedBranch.points
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="stroke"
                  />
                  <polyline
                    points={routedBranch.points
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill="none"
                    className={`${lineClassName(isSelected)} transition`}
                  />
                  {showBranchLabels ? (
                    <>
                      <text
                        x={labelPoint.x}
                        y={labelPoint.y - 10}
                        textAnchor="middle"
                        className="fill-slate-300 text-[10px]"
                      >
                        {branch.id}
                      </text>
                      {flowMagnitudeMW ? (
                        <text
                          x={labelPoint.x}
                          y={labelPoint.y + 4}
                          textAnchor="middle"
                          className="fill-emerald-200 text-[10px]"
                        >
                          {flowDirectionSymbol} {flowMagnitudeMW} MW
                        </text>
                      ) : null}
                    </>
                  ) : null}
                </g>
              );
            })}

            {branches.map((branch) => {
              const isSelected =
                selectedElementType === "BRANCH" &&
                selectedElementId === branch.id;
              const lineHops = lineHopPointsByBranchId.get(branch.id) ?? [];
              return lineHops.map((lineHop, index) => (
                <g key={`${branch.id}-hop-${index}`}>
                  <rect
                    x={lineHop.x - LINE_HOP_RADIUS}
                    y={lineHop.y - LINE_HOP_RADIUS}
                    width={LINE_HOP_RADIUS * 2}
                    height={LINE_HOP_RADIUS * 2}
                    className="fill-slate-950"
                  />
                  <path
                    d={`M ${lineHop.x} ${lineHop.y - LINE_HOP_RADIUS} A ${LINE_HOP_RADIUS} ${LINE_HOP_RADIUS} 0 0 1 ${lineHop.x} ${lineHop.y + LINE_HOP_RADIUS}`}
                    fill="none"
                    className={`${lineClassName(isSelected)} stroke-[3]`}
                  />
                </g>
              ));
            })}

            {buses.map((bus) => {
              const isSelected =
                selectedElementType === "BUS" && selectedElementId === bus.id;
              const busSolution = busSolutionsById?.get(bus.id);
              const voltageSummary = busSolution
                ? `${busSolution.voltageMagnitudePu.toFixed(3)} pu`
                : "— pu";
              const angleSummary = busSolution
                ? `${busSolution.voltageAngleDeg.toFixed(2)}°`
                : "—°";

              return (
                <g
                  key={bus.id}
                  transform={`translate(${bus.x - BUS_HALF_WIDTH}, ${bus.y - BUS_HALF_HEIGHT})`}
                  className="cursor-pointer"
                  onClick={() => onBusSelect(bus.id)}
                  onPointerDown={(event) => handleBusPointerDown(event, bus.id)}
                  onPointerMove={handleBusPointerMove}
                  onPointerUp={handleBusPointerUp}
                  onPointerCancel={handleBusPointerUp}
                >
                  <rect
                    x={0}
                    y={0}
                    rx={6}
                    width={BUS_WIDTH}
                    height={BUS_HEIGHT}
                    className={`${busClassName(isSelected)} stroke-2 transition`}
                  />
                  <text
                    x={BUS_HALF_WIDTH}
                    y={17}
                    textAnchor="middle"
                    className="fill-white text-[11px] font-medium"
                  >
                    {bus.name}
                  </text>
                  <text
                    x={BUS_HALF_WIDTH}
                    y={32}
                    textAnchor="middle"
                    className="fill-slate-300 text-[10px]"
                  >
                    {bus.type}
                  </text>
                  <text
                    x={BUS_HALF_WIDTH}
                    y={47}
                    textAnchor="middle"
                    className="fill-emerald-100 text-[10px]"
                  >
                    V: {voltageSummary}
                  </text>
                  <text
                    x={BUS_HALF_WIDTH}
                    y={60}
                    textAnchor="middle"
                    className="fill-emerald-100 text-[10px]"
                  >
                    θ: {angleSummary}
                  </text>
                </g>
              );
            })}
          </svg>
        </>
      )}
    </div>
  );
}
