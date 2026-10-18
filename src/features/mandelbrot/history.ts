import { PreciseViewport } from "@/features/mandelbrot/types";
import { cloneViewport, viewportsEqual } from "@/features/mandelbrot/viewport";

const MAX_HISTORY_LENGTH = 200;

export type ViewportHistory = {
  past: PreciseViewport[];
  present: PreciseViewport;
};

export function createViewportHistory(
  initialViewport: PreciseViewport
): ViewportHistory {
  return {
    past: [],
    present: cloneViewport(initialViewport),
  };
}

export function replaceViewport(
  history: ViewportHistory,
  nextViewport: PreciseViewport
): ViewportHistory {
  return {
    ...history,
    present: cloneViewport(nextViewport),
  };
}

export function pushViewport(
  history: ViewportHistory,
  nextViewport: PreciseViewport
): ViewportHistory {
  if (viewportsEqual(history.present, nextViewport)) {
    return history;
  }

  return {
    past: [...history.past, cloneViewport(history.present)].slice(
      -MAX_HISTORY_LENGTH
    ),
    present: cloneViewport(nextViewport),
  };
}

export function undoViewport(history: ViewportHistory): ViewportHistory {
  const previousViewport = history.past.at(-1);

  if (!previousViewport) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: cloneViewport(previousViewport),
  };
}
