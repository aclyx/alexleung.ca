"use client";

import { useEffect } from "react";

const MIN_SCROLL_STEP = 160;
const MAX_SCROLL_STEP = 320;
const SCROLL_VIEWPORT_RATIO = 0.28;
export const SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY =
  "alexleung.ca.siteKeyboardShortcuts";
export const SITE_KEYBOARD_SHORTCUTS_CHANGED_EVENT =
  "site-keyboard-shortcuts-changed";
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

export function readSiteKeyboardShortcutsEnabled() {
  try {
    return (
      window.localStorage.getItem(SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY) !== "off"
    );
  } catch {
    return true;
  }
}

export function setSiteKeyboardShortcutsEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(
      SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY,
      enabled ? "on" : "off"
    );
  } catch {
    // Keep the runtime preference active even if storage is unavailable.
  }

  window.dispatchEvent(
    new CustomEvent(SITE_KEYBOARD_SHORTCUTS_CHANGED_EVENT, {
      detail: { enabled },
    })
  );
}

export default function SiteKeyboardShortcuts() {
  useEffect(() => {
    let enabled = readSiteKeyboardShortcutsEnabled();

    const handlePreferenceChange = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail !== null &&
        typeof event.detail === "object"
      ) {
        const detail = event.detail;

        if (typeof detail.enabled === "boolean") {
          enabled = detail.enabled;
          return;
        }
      }

      enabled = readSiteKeyboardShortcutsEnabled();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY) {
        enabled = readSiteKeyboardShortcutsEnabled();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !enabled ||
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
    window.addEventListener(
      SITE_KEYBOARD_SHORTCUTS_CHANGED_EVENT,
      handlePreferenceChange
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(
        SITE_KEYBOARD_SHORTCUTS_CHANGED_EVENT,
        handlePreferenceChange
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
