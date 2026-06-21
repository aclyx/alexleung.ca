"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";

import {
  CanvasPoint,
  ComplexPoint,
  DragMode,
  MandelbrotSettings,
  PixelSize,
  PreciseViewport,
  SelectionRect,
} from "@/features/mandelbrot/types";
import { useMandelbrotRender } from "@/features/mandelbrot/useMandelbrotRender";
import {
  boxZoomViewport,
  constrainSelectionToAspect,
  mapViewportPoint,
  panViewport,
  selectionIsLargeEnough,
  viewportsEqual,
  zoomViewportAtPoint,
} from "@/features/mandelbrot/viewport";

type MandelbrotCanvasProps = {
  viewport: PreciseViewport;
  settings: MandelbrotSettings;
  dragMode: DragMode;
  onCanvasSizeChange: (size: PixelSize) => void;
  onPreviewViewport: (viewport: PreciseViewport | null) => void;
  onCommitViewport: (viewport: PreciseViewport) => void;
  onHoverPointChange: (point: ComplexPoint | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

type DragSession =
  | {
      kind: "pan";
      anchor: CanvasPoint;
      startViewport: PreciseViewport;
      moved: boolean;
    }
  | {
      kind: "box-zoom";
      anchor: CanvasPoint;
      moved: boolean;
    };

const DEFAULT_CANVAS_SIZE: PixelSize = {
  width: 960,
  height: 600,
};

function pointsAreFarEnough(
  start: CanvasPoint,
  end: CanvasPoint,
  threshold = 3
): boolean {
  return (
    Math.abs(end.x - start.x) >= threshold ||
    Math.abs(end.y - start.y) >= threshold
  );
}

function canvasPointFromClientPosition(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): CanvasPoint {
  const rect = canvas.getBoundingClientRect();
  const x = rect.width === 0 ? 0 : clientX - rect.left;
  const y = rect.height === 0 ? 0 : clientY - rect.top;

  return {
    x: Math.min(Math.max(x, 0), rect.width || DEFAULT_CANVAS_SIZE.width),
    y: Math.min(Math.max(y, 0), rect.height || DEFAULT_CANVAS_SIZE.height),
  };
}

export function MandelbrotCanvas({
  viewport,
  settings,
  dragMode,
  onCanvasSizeChange,
  onPreviewViewport,
  onCommitViewport,
  onHoverPointChange,
  onZoomIn,
  onZoomOut,
  onReset,
}: MandelbrotCanvasProps) {
  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const gpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef(viewport);
  const dragSessionRef = useRef<DragSession | null>(null);
  const latestWheelViewportRef = useRef<PreciseViewport | null>(null);
  const wheelTimerRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState(DEFAULT_CANVAS_SIZE);
  const canvasSizeRef = useRef(DEFAULT_CANVAS_SIZE);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(
    null
  );

  viewportRef.current = viewport;
  canvasSizeRef.current = canvasSize;

  const renderState = useMandelbrotRender({
    cpuCanvasRef,
    gpuCanvasRef,
    viewport,
    settings,
    size: canvasSize,
  });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const nextSize = {
        width: Math.max(
          320,
          Math.round(rect.width || DEFAULT_CANVAS_SIZE.width)
        ),
        height: Math.max(
          240,
          Math.round(rect.height || DEFAULT_CANVAS_SIZE.height)
        ),
      };
      const currentSize = canvasSizeRef.current;

      if (
        currentSize.width === nextSize.width &&
        currentSize.height === nextSize.height
      ) {
        return;
      }

      canvasSizeRef.current = nextSize;
      setCanvasSize(nextSize);
      onCanvasSizeChange(nextSize);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);

      return () => {
        window.removeEventListener("resize", measure);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onCanvasSizeChange]);

  useEffect(() => {
    return () => {
      cancelPendingWheelCommit();
    };
  }, []);

  function cancelPendingWheelCommit() {
    if (wheelTimerRef.current !== null) {
      window.clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = null;
    }

    latestWheelViewportRef.current = null;
  }

  function finalizeWheelPreview() {
    if (!latestWheelViewportRef.current) {
      return;
    }

    onCommitViewport(latestWheelViewportRef.current);
    latestWheelViewportRef.current = null;
  }

  useEffect(() => {
    if (
      latestWheelViewportRef.current &&
      !viewportsEqual(viewport, latestWheelViewportRef.current)
    ) {
      cancelPendingWheelCommit();
    }
  }, [viewport]);

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) {
      return;
    }

    cancelPendingWheelCommit();

    const point = canvasPointFromClientPosition(
      event.currentTarget,
      event.clientX,
      event.clientY
    );

    if (dragMode === "pan") {
      dragSessionRef.current = {
        kind: "pan",
        anchor: point,
        startViewport: viewportRef.current,
        moved: false,
      };
    } else {
      dragSessionRef.current = {
        kind: "box-zoom",
        anchor: point,
        moved: false,
      };
      setSelectionRect({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      });
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const point = canvasPointFromClientPosition(
      event.currentTarget,
      event.clientX,
      event.clientY
    );
    onHoverPointChange(
      mapViewportPoint(viewportRef.current, canvasSize, point)
    );

    const dragSession = dragSessionRef.current;

    if (!dragSession) {
      return;
    }

    if (dragSession.kind === "pan") {
      const nextViewport = panViewport(dragSession.startViewport, canvasSize, {
        x: point.x - dragSession.anchor.x,
        y: point.y - dragSession.anchor.y,
      });

      dragSessionRef.current = {
        ...dragSession,
        moved: pointsAreFarEnough(dragSession.anchor, point),
      };
      onPreviewViewport(nextViewport);
      return;
    }

    const nextSelection = constrainSelectionToAspect(
      dragSession.anchor,
      point,
      canvasSize
    );

    dragSessionRef.current = {
      ...dragSession,
      moved: pointsAreFarEnough(dragSession.anchor, point),
    };
    setSelectionRect(nextSelection);
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const dragSession = dragSessionRef.current;
    const point = canvasPointFromClientPosition(
      event.currentTarget,
      event.clientX,
      event.clientY
    );

    dragSessionRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (!dragSession) {
      return;
    }

    if (dragSession.kind === "pan") {
      if (dragSession.moved) {
        cancelPendingWheelCommit();
        onCommitViewport(
          panViewport(dragSession.startViewport, canvasSize, {
            x: point.x - dragSession.anchor.x,
            y: point.y - dragSession.anchor.y,
          })
        );
        return;
      }

      onPreviewViewport(null);
      cancelPendingWheelCommit();
      onCommitViewport(
        zoomViewportAtPoint(viewportRef.current, canvasSize, point, 0.5)
      );
      return;
    }

    const nextSelection = constrainSelectionToAspect(
      dragSession.anchor,
      point,
      canvasSize
    );

    setSelectionRect(null);

    if (selectionIsLargeEnough(nextSelection)) {
      cancelPendingWheelCommit();
      onCommitViewport(
        boxZoomViewport(
          viewportRef.current,
          canvasSize,
          dragSession.anchor,
          point
        )
      );
      return;
    }

    cancelPendingWheelCommit();
    onCommitViewport(
      zoomViewportAtPoint(viewportRef.current, canvasSize, point, 0.5)
    );
  }

  function handlePointerLeave() {
    onHoverPointChange(null);
  }

  useEffect(() => {
    const canvas = cpuCanvasRef.current;

    if (!canvas) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (wheelTimerRef.current !== null) {
        window.clearTimeout(wheelTimerRef.current);
      }

      const point = canvasPointFromClientPosition(
        canvas,
        event.clientX,
        event.clientY
      );
      const zoomMultiplier = Math.exp(event.deltaY * 0.0015);
      const nextViewport = zoomViewportAtPoint(
        viewportRef.current,
        canvasSize,
        point,
        zoomMultiplier
      );

      latestWheelViewportRef.current = nextViewport;
      onPreviewViewport(nextViewport);

      wheelTimerRef.current = window.setTimeout(() => {
        finalizeWheelPreview();
        wheelTimerRef.current = null;
      }, 140);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [canvasSize, onPreviewViewport]);

  const selectionStyles = selectionRect
    ? {
        left: `${selectionRect.x}px`,
        top: `${selectionRect.y}px`,
        width: `${selectionRect.width}px`,
        height: `${selectionRect.height}px`,
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className="relative min-h-[24rem] overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-950 shadow-[0_24px_80px_rgba(8,145,178,0.18)]"
    >
      <div className="absolute inset-0 z-0">
        <canvas
          ref={gpuCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        <canvas
          ref={cpuCanvasRef}
          className={`absolute inset-0 block h-full w-full touch-none ${
            dragMode === "box-zoom"
              ? "cursor-crosshair"
              : "cursor-grab active:cursor-grabbing"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          aria-label="Mandelbrot set rendering canvas"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_55%)]" />

      {selectionRect ? (
        <div
          className="pointer-events-none absolute z-20 border border-cyan-200 bg-cyan-300/15 shadow-[0_0_0_1px_rgba(103,232,249,0.4)]"
          style={selectionStyles}
        />
      ) : null}

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex flex-col gap-2 sm:left-4 sm:right-4 sm:top-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-fit max-w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-gray-200 backdrop-blur-sm">
          <p className="font-semibold text-cyan-100">Plot controls</p>
          <p>Wheel to zoom at cursor.</p>
          <p>
            {dragMode === "pan"
              ? "Click to zoom in, drag to pan."
              : "Click to zoom in, drag a box to reframe."}
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-white/15 bg-slate-950/80 px-3 py-2 text-sm text-white backdrop-blur-sm transition hover:border-cyan-300 hover:text-cyan-100"
            onClick={() => {
              cancelPendingWheelCommit();
              onZoomIn();
            }}
          >
            Zoom in
          </button>
          <button
            type="button"
            className="rounded-md border border-white/15 bg-slate-950/80 px-3 py-2 text-sm text-white backdrop-blur-sm transition hover:border-cyan-300 hover:text-cyan-100"
            onClick={() => {
              cancelPendingWheelCommit();
              onZoomOut();
            }}
          >
            Zoom out
          </button>
          <button
            type="button"
            className="rounded-md border border-white/15 bg-slate-950/80 px-3 py-2 text-sm text-white backdrop-blur-sm transition hover:border-cyan-300 hover:text-cyan-100"
            onClick={() => {
              cancelPendingWheelCommit();
              onReset();
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-30 rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-gray-200 backdrop-blur-sm">
        <p className="font-semibold text-cyan-100">
          {renderState.phase === "ready"
            ? "Render ready"
            : renderState.phase === "error"
              ? "Render error"
              : "Rendering"}
        </p>
        <p>{renderState.message}</p>
        <p>Backend: {renderState.backend === "webgpu" ? "WebGPU" : "CPU"}</p>
      </div>
    </div>
  );
}
