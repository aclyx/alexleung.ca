"use client";

import {
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CanvasPoint,
  MandelbrotSettings,
  PixelSize,
  PreciseViewport,
} from "@/features/mandelbrot/types";
import { useMandelbrotRender } from "@/features/mandelbrot/useMandelbrotRender";
import {
  panViewport,
  zoomViewportAtPoint,
} from "@/features/mandelbrot/viewport";

type MandelbrotCanvasProps = {
  viewport: PreciseViewport;
  settings: MandelbrotSettings;
  canGoBack: boolean;
  magnificationLabel: string;
  onCanvasSizeChange: (size: PixelSize) => void;
  onPreviewViewport: (viewport: PreciseViewport | null) => void;
  onCommitViewport: (viewport: PreciseViewport) => void;
  onBack: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

type DragSession = {
  pointerId: number;
  anchor: CanvasPoint;
  startViewport: PreciseViewport;
  latestViewport: PreciseViewport | null;
  moved: boolean;
};

const DEFAULT_CANVAS_SIZE: PixelSize = {
  width: 960,
  height: 600,
};

const INITIAL_CANVAS_SIZE: PixelSize = {
  width: 0,
  height: 0,
};

const toolbarButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-accent-link/50 hover:bg-accent-secondary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link disabled:cursor-not-allowed disabled:opacity-40";

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
  canGoBack,
  magnificationLabel,
  onCanvasSizeChange,
  onPreviewViewport,
  onCommitViewport,
  onBack,
  onZoomIn,
  onZoomOut,
  onReset,
}: MandelbrotCanvasProps) {
  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const gpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef(viewport);
  const dragSessionRef = useRef<DragSession | null>(null);
  const [canvasSize, setCanvasSize] = useState(INITIAL_CANVAS_SIZE);
  const canvasSizeRef = useRef(INITIAL_CANVAS_SIZE);

  viewportRef.current = viewport;
  canvasSizeRef.current = canvasSize;

  const renderState = useMandelbrotRender({
    cpuCanvasRef,
    gpuCanvasRef,
    viewport,
    settings,
    size: canvasSize,
  });
  const iterationLimitMessage =
    renderState.phase === "ready" &&
    renderState.requestedMaxIterations !== undefined &&
    renderState.effectiveMaxIterations !== undefined &&
    renderState.effectiveMaxIterations < renderState.requestedMaxIterations
      ? `${renderState.backend === "cpu" ? "CPU render" : "Render"} used ${renderState.effectiveMaxIterations.toLocaleString("en-CA")} of ${renderState.requestedMaxIterations.toLocaleString("en-CA")} requested iterations.`
      : null;

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const nextSize = {
        width: Math.max(1, Math.round(rect.width || DEFAULT_CANVAS_SIZE.width)),
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

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0 || dragSessionRef.current) {
      return;
    }

    const point = canvasPointFromClientPosition(
      event.currentTarget,
      event.clientX,
      event.clientY
    );

    dragSessionRef.current = {
      pointerId: event.pointerId,
      anchor: point,
      startViewport: viewportRef.current,
      latestViewport: null,
      moved: false,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    const point = canvasPointFromClientPosition(
      event.currentTarget,
      event.clientX,
      event.clientY
    );
    const moved =
      dragSession.moved || pointsAreFarEnough(dragSession.anchor, point);
    const latestViewport = moved
      ? panViewport(dragSession.startViewport, canvasSize, {
          x: point.x - dragSession.anchor.x,
          y: point.y - dragSession.anchor.y,
        })
      : null;

    dragSessionRef.current = {
      ...dragSession,
      latestViewport,
      moved,
    };

    if (latestViewport) {
      onPreviewViewport(latestViewport);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    const point = canvasPointFromClientPosition(
      event.currentTarget,
      event.clientX,
      event.clientY
    );
    const moved =
      dragSession.moved || pointsAreFarEnough(dragSession.anchor, point);

    dragSessionRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (moved) {
      onPreviewViewport(null);
      onCommitViewport(
        panViewport(dragSession.startViewport, canvasSize, {
          x: point.x - dragSession.anchor.x,
          y: point.y - dragSession.anchor.y,
        })
      );
      return;
    }

    onPreviewViewport(null);
    onCommitViewport(
      zoomViewportAtPoint(viewportRef.current, canvasSize, point, 0.5)
    );
  }

  function handlePointerCancel(event: PointerEvent<HTMLCanvasElement>) {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    dragSessionRef.current = null;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    onPreviewViewport(null);

    if (dragSession.moved && dragSession.latestViewport) {
      onCommitViewport(dragSession.latestViewport);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    const currentViewport = viewportRef.current;
    const horizontalStep = canvasSize.width * 0.12;
    const verticalStep = canvasSize.height * 0.12;
    let nextViewport: PreciseViewport | null = null;

    if (event.key === "+" || event.key === "=") {
      nextViewport = zoomViewportAtPoint(
        currentViewport,
        canvasSize,
        { x: canvasSize.width / 2, y: canvasSize.height / 2 },
        0.5
      );
    } else if (event.key === "-" || event.key === "_") {
      nextViewport = zoomViewportAtPoint(
        currentViewport,
        canvasSize,
        { x: canvasSize.width / 2, y: canvasSize.height / 2 },
        2
      );
    } else if (event.key === "0" || event.key === "Home") {
      event.preventDefault();
      onReset();
      return;
    } else if (event.key === "ArrowLeft") {
      nextViewport = panViewport(currentViewport, canvasSize, {
        x: horizontalStep,
        y: 0,
      });
    } else if (event.key === "ArrowRight") {
      nextViewport = panViewport(currentViewport, canvasSize, {
        x: -horizontalStep,
        y: 0,
      });
    } else if (event.key === "ArrowUp") {
      nextViewport = panViewport(currentViewport, canvasSize, {
        x: 0,
        y: verticalStep,
      });
    } else if (event.key === "ArrowDown") {
      nextViewport = panViewport(currentViewport, canvasSize, {
        x: 0,
        y: -verticalStep,
      });
    }

    if (!nextViewport) {
      return;
    }

    event.preventDefault();
    onCommitViewport(nextViewport);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <p id="mandelbrot-canvas-instructions" className="text-sm text-muted">
          Click or tap to zoom. Drag to pan.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={toolbarButtonClass}
            disabled={!canGoBack}
            onClick={onBack}
          >
            Undo view
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={onZoomIn}
          >
            Zoom in
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={onZoomOut}
          >
            Zoom out
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative min-h-[20rem] overflow-hidden bg-black sm:min-h-[28rem]"
      >
        <div className="pointer-events-none absolute inset-0">
          <canvas
            ref={gpuCanvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          />

          <canvas
            ref={cpuCanvasRef}
            data-testid="mandelbrot-render-canvas"
            className="absolute inset-0 block h-full w-full"
            aria-hidden="true"
          />
        </div>

        <canvas
          ref={interactionCanvasRef}
          className="absolute inset-0 z-10 block h-full w-full touch-none cursor-grab bg-transparent outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-200"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-describedby="mandelbrot-canvas-instructions mandelbrot-render-status"
          aria-label="Interactive Mandelbrot set. Arrow keys pan, plus and minus zoom, and zero resets the view."
        />
      </div>

      <div
        id="mandelbrot-render-status"
        role="status"
        aria-live="polite"
        className="border-t border-line px-4 py-3 text-xs text-muted"
      >
        {renderState.phase === "error" ? (
          <p>
            <span className="font-semibold text-ink">Render error. </span>
            <span>{renderState.message}</span>
          </p>
        ) : renderState.phase === "ready" ? (
          <p>
            <span className="sr-only">{renderState.message} </span>
            {magnificationLabel}
            {iterationLimitMessage ? ` · ${iterationLimitMessage}` : null}
          </p>
        ) : (
          <p>{renderState.message}</p>
        )}
      </div>
    </div>
  );
}
