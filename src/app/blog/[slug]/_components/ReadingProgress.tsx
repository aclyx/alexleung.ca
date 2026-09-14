"use client";

import { useEffect, useRef } from "react";

type ReadingProgressProps = {
  endSelector: string;
  startId: string;
};

export function calculateReadingProgress(
  scrollPosition: number,
  startPosition: number,
  endPosition: number
) {
  if (
    !Number.isFinite(scrollPosition) ||
    !Number.isFinite(startPosition) ||
    !Number.isFinite(endPosition) ||
    endPosition <= startPosition
  ) {
    return null;
  }

  return Math.min(
    1,
    Math.max(
      0,
      (scrollPosition - startPosition) / (endPosition - startPosition)
    )
  );
}

export function ReadingProgress({
  endSelector,
  startId,
}: ReadingProgressProps) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progressElement = progressRef.current;

    if (!progressElement) {
      return;
    }

    let animationFrame: number | null = null;
    let endPosition = 0;
    let needsMeasurement = true;
    let startPosition = 0;

    const render = () => {
      animationFrame = null;

      if (needsMeasurement) {
        needsMeasurement = false;
        const headerElement =
          document.querySelector<HTMLElement>("header.fixed");
        const startElement = document.getElementById(startId);
        const endElement = document.querySelector<HTMLElement>(endSelector);

        if (!headerElement || !startElement || !endElement) {
          progressElement.hidden = true;
          return;
        }

        const scrollPosition = window.scrollY;
        startPosition =
          startElement.getBoundingClientRect().top +
          scrollPosition -
          headerElement.getBoundingClientRect().height;
        endPosition =
          endElement.getBoundingClientRect().bottom +
          scrollPosition -
          window.innerHeight;
      }

      const progress = calculateReadingProgress(
        window.scrollY,
        startPosition,
        endPosition
      );

      progressElement.hidden = progress === null;
      progressElement.style.transform = `scaleX(${progress ?? 0})`;
    };

    const schedule = (measure = false) => {
      needsMeasurement ||= measure;

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const measure = () => schedule(true);
    const update = () => schedule();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => measure());

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("load", measure, { once: true });
    resizeObserver?.observe(document.documentElement);
    schedule(true);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      resizeObserver?.disconnect();
    };
  }, [endSelector, startId]);

  return (
    <div
      ref={progressRef}
      aria-hidden="true"
      data-reading-progress
      hidden
      className="pointer-events-none fixed inset-x-0 top-[var(--header-height)] z-50 h-0.5 origin-left bg-accent-link motion-reduce:hidden"
    />
  );
}
