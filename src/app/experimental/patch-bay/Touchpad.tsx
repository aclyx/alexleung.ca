import { useEffect, useRef, type PointerEvent } from "react";

import s from "./console.module.css";

interface Props {
  disabled: boolean;
  move: (id: number, direction: number, speed: number) => void;
  release: (id: number) => void;
}

export function Touchpad({ disabled, move, release }: Props) {
  const pad = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    horizontal?: boolean;
  } | null>(null);

  useEffect(() => {
    const id = drag.current?.id;
    if (disabled && id !== undefined && pad.current?.hasPointerCapture(id))
      pad.current.releasePointerCapture(id);
  }, [disabled]);

  function end(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== e.pointerId) return;
    release(e.pointerId);
    drag.current = null;
    e.currentTarget.style.removeProperty("--dx");
    e.currentTarget.style.removeProperty("--dy");
  }

  return (
    <div
      ref={pad}
      className={s.touchpad}
      role="group"
      aria-label="Movement touchpad"
      aria-disabled={disabled}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0 || drag.current) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        const origin = drag.current;
        if (disabled || !origin || origin.id !== e.pointerId) return;
        const x = e.clientX - origin.x;
        const y = e.clientY - origin.y;
        const distance = Math.hypot(x, y);
        const radius = e.currentTarget.clientWidth / 3;
        const scale = distance > radius ? radius / distance : 1;
        e.currentTarget.style.setProperty("--dx", x * scale + "px");
        e.currentTarget.style.setProperty("--dy", y * scale + "px");
        if (distance < radius * 0.18) {
          origin.horizontal = undefined;
          release(e.pointerId);
          return;
        }
        // Keep the current axis near a diagonal so a slight wobble cannot turn a corner.
        const bias =
          origin.horizontal === undefined ? 1 : origin.horizontal ? 0.8 : 1.25;
        origin.horizontal = Math.abs(x) > Math.abs(y) * bias;
        const direction = origin.horizontal ? (x > 0 ? 8 : 2) : y > 0 ? 4 : 1;
        move(e.pointerId, direction, Math.min(1, distance / radius));
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <span className={s.bearings} aria-hidden="true">
        <i>▴</i>
        <i>▸</i>
        <i>▾</i>
        <i>◂</i>
      </span>
      <span className={s.thumb} aria-hidden="true" />
    </div>
  );
}
