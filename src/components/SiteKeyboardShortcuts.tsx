"use client";

import { useEffect } from "react";

const MIN_SCROLL_STEP = 160;
const MAX_SCROLL_STEP = 320;
const SCROLL_VIEWPORT_RATIO = 0.28;
const IGNORED_TARGET_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "[role='button']",
  "[contenteditable]:not([contenteditable='false'])",
].join(",");

function getScrollStep() {
  const viewportStep = Math.round(window.innerHeight * SCROLL_VIEWPORT_RATIO);

  return Math.min(MAX_SCROLL_STEP, Math.max(MIN_SCROLL_STEP, viewportStep));
}

function shouldIgnoreElement(element: Element | null) {
  if (!element) {
    return false;
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    return true;
  }

  return element.closest(IGNORED_TARGET_SELECTOR) !== null;
}

function shouldIgnoreTarget(target: EventTarget | null) {
  const targetElement = target instanceof Element ? target : null;
  const activeElement =
    document.activeElement instanceof Element ? document.activeElement : null;

  return (
    shouldIgnoreElement(targetElement) || shouldIgnoreElement(activeElement)
  );
}

function hasModifierKey(event: KeyboardEvent) {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

export default function SiteKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        hasModifierKey(event) ||
        shouldIgnoreTarget(event.target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key !== "j" && key !== "k") {
        return;
      }

      window.scrollBy({
        top: (key === "j" ? 1 : -1) * getScrollStep(),
        left: 0,
      });
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
