"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";

import { Point } from "@/features/load-flow/diagram";

interface Bounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

interface View {
  zoom: number;
  center: Point;
}

interface Pinch {
  center: Point;
  distance: number;
}

function touchPinch(points: Map<number, Point>): Pinch | null {
  const [a, b] = points.values();
  return a && b
    ? {
        center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        distance: Math.hypot(b.x - a.x, b.y - a.y),
      }
    : null;
}

function isGesture(event: Event): event is Event & {
  scale: number;
  clientX: number;
  clientY: number;
} {
  return (
    "scale" in event &&
    typeof event.scale === "number" &&
    Number.isFinite(event.scale) &&
    event.scale > 0 &&
    "clientX" in event &&
    typeof event.clientX === "number" &&
    "clientY" in event &&
    typeof event.clientY === "number"
  );
}

export function useDiagramViewport(
  bounds: Bounds,
  onBusMove: (id: string, x: number, y: number) => void,
  onBusSelect: (id: string) => void
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({
    zoom: 1,
    center: {
      x: bounds.minX + bounds.width / 2,
      y: bounds.minY + bounds.height / 2,
    },
  });
  // Input can arrive faster than React renders. Keep the next gesture based on
  // the latest view, not the last painted SVG.
  const current = useRef(view);
  const touches = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);
  const gesture = useRef<{ scale: number; center: Point } | null>(null);
  const suppressClick = useRef(false);
  const drag = useRef<{
    pointer: number;
    anchor: Point;
    bus?: { id: string; x: number; y: number };
  } | null>(null);

  function update(next: View) {
    current.current = next;
    setView(next);
  }

  // SVG uses xMidYMid meet: account for letterboxing and its one-pixel border.
  function offset(point: Point): Point {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scale = Math.max(
      bounds.width / (rect.width - 2 * svg.clientLeft),
      bounds.height / (rect.height - 2 * svg.clientTop)
    );
    return {
      x: (point.x - rect.left - rect.width / 2) * scale,
      y: (point.y - rect.top - rect.height / 2) * scale,
    };
  }

  function world(point: Point): Point {
    const delta = offset(point);
    const { center, zoom } = current.current;
    return { x: center.x + delta.x / zoom, y: center.y + delta.y / zoom };
  }

  function zoomBy(factor: number, from?: Point, to = from) {
    const previous = current.current;
    const zoom = Math.min(8, Math.max(0.5, previous.zoom * factor));
    const anchor = from ? world(from) : previous.center;
    const delta = to ? offset(to) : { x: 0, y: 0 };
    update({
      zoom,
      center: { x: anchor.x - delta.x / zoom, y: anchor.y - delta.y / zoom },
    });
  }

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    function cancel() {
      drag.current = null;
      touches.current.clear();
      pinch.current = null;
      gesture.current = null;
    }
    cancel();
    update({
      zoom: 1,
      center: {
        x: bounds.minX + bounds.width / 2,
        y: bounds.minY + bounds.height / 2,
      },
    });
    function wheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (gesture.current || touches.current.size > 1) return;
      drag.current = null;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? svg!.clientHeight
            : 1;
      const delta = event.deltaY * unit;
      if (!Number.isFinite(delta)) return;
      zoomBy(Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002)), {
        x: event.clientX,
        y: event.clientY,
      });
    }
    function safariGesture(event: Event) {
      event.preventDefault();
      if (event.type === "gestureend") {
        gesture.current = null;
        return;
      }
      // Touch pointers already handle iOS pinch; these events cover macOS Safari.
      if (touches.current.size || !isGesture(event)) return;
      const center = { x: event.clientX, y: event.clientY };
      const previous = gesture.current;
      if (event.type === "gesturechange" && previous) {
        zoomBy(event.scale / previous.scale, previous.center, center);
      }
      drag.current = null;
      gesture.current = { scale: event.scale, center };
    }
    svg.addEventListener("wheel", wheel, { passive: false });
    svg.addEventListener("gesturestart", safariGesture, { passive: false });
    svg.addEventListener("gesturechange", safariGesture, { passive: false });
    svg.addEventListener("gestureend", safariGesture, { passive: false });
    window.addEventListener("blur", cancel);
    return () => {
      svg.removeEventListener("wheel", wheel);
      svg.removeEventListener("gesturestart", safariGesture);
      svg.removeEventListener("gesturechange", safariGesture);
      svg.removeEventListener("gestureend", safariGesture);
      window.removeEventListener("blur", cancel);
      cancel();
    };
  }, [bounds]);

  function trackPointer(event: PointerEvent<SVGSVGElement>) {
    if (!touches.current.size) suppressClick.current = false;
    if (event.pointerType !== "touch") return;
    touches.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (event.target instanceof Element)
      event.target.setPointerCapture(event.pointerId);
    pinch.current = touchPinch(touches.current);
    if (pinch.current) {
      drag.current = null;
      suppressClick.current = true;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function startDrag(
    event: PointerEvent<SVGElement>,
    bus?: { id: string; x: number; y: number }
  ) {
    if (event.button !== 0 || touches.current.size > 1) return;
    event.stopPropagation();
    svgRef.current?.setPointerCapture(event.pointerId);
    drag.current = {
      pointer: event.pointerId,
      anchor: world({ x: event.clientX, y: event.clientY }),
      bus,
    };
    if (bus) onBusSelect(bus.id);
  }

  function movePointer(event: PointerEvent<SVGSVGElement>) {
    const point = { x: event.clientX, y: event.clientY };
    if (touches.current.has(event.pointerId)) {
      touches.current.set(event.pointerId, point);
      const next = touchPinch(touches.current);
      const previous = pinch.current;
      if (previous && next && previous.distance > 0 && next.distance > 0) {
        zoomBy(next.distance / previous.distance, previous.center, next.center);
      }
      pinch.current = next;
      if (next) return;
    }
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const position = world(point);
    if (active.bus) {
      onBusMove(
        active.bus.id,
        active.bus.x + position.x - active.anchor.x,
        active.bus.y + position.y - active.anchor.y
      );
    } else {
      const { center, zoom } = current.current;
      update({
        zoom,
        center: {
          x: center.x + active.anchor.x - position.x,
          y: center.y + active.anchor.y - position.y,
        },
      });
    }
  }

  function endPointer(event: PointerEvent<SVGSVGElement>) {
    touches.current.delete(event.pointerId);
    pinch.current = touchPinch(touches.current);
    if (drag.current?.pointer === event.pointerId) drag.current = null;
  }

  const width = bounds.width / view.zoom;
  const height = bounds.height / view.zoom;
  return {
    svgRef,
    zoom: view.zoom,
    viewX: view.center.x - width / 2,
    viewY: view.center.y - height / 2,
    viewWidth: width,
    viewHeight: height,
    zoomBy,
    trackPointer,
    startDrag,
    movePointer,
    endPointer,
    suppressClick,
  };
}
