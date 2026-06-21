"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const MIN_SCROLL_STEP = 160;
const MAX_SCROLL_STEP = 320;
const SCROLL_VIEWPORT_RATIO = 0.28;
export const SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY =
  "alexleung.ca.siteKeyboardShortcuts";
const SITE_KEYBOARD_SHORTCUTS_CHANGED_EVENT = "site-keyboard-shortcuts-changed";
const IGNORED_TARGET_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "[role='button']",
  "[contenteditable]:not([contenteditable='false'])",
].join(",");

type SiteKeyboardShortcutToggleProps = {
  children: ReactNode;
};

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

function readSiteKeyboardShortcutsEnabled() {
  try {
    return (
      window.localStorage.getItem(SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY) !== "off"
    );
  } catch {
    return true;
  }
}

function setSiteKeyboardShortcutsEnabled(enabled: boolean) {
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

export function SiteKeyboardShortcutToggle({
  children,
}: SiteKeyboardShortcutToggleProps) {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);

  useEffect(() => {
    const applyEnabled = (nextEnabled: boolean) => {
      enabledRef.current = nextEnabled;
      setEnabled(nextEnabled);
    };

    const syncEnabled = () => {
      applyEnabled(readSiteKeyboardShortcutsEnabled());
    };

    const handlePreferenceChange = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail !== null &&
        typeof event.detail === "object"
      ) {
        const detail = event.detail;

        if (typeof detail.enabled === "boolean") {
          applyEnabled(detail.enabled);
          return;
        }
      }

      syncEnabled();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY) {
        syncEnabled();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !enabledRef.current ||
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

    syncEnabled();
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

  const toggleShortcuts = () => {
    const nextEnabled = !enabled;

    enabledRef.current = nextEnabled;
    setEnabled(nextEnabled);
    setSiteKeyboardShortcutsEnabled(nextEnabled);
  };

  const label = enabled ? "Disable j/k shortcuts" : "Enable j/k shortcuts";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      title={label}
      onClick={toggleShortcuts}
      className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-link ${
        enabled
          ? "border-accent-secondary/60 bg-accent-secondary/10 text-accent-secondary"
          : "border-white/10 bg-white/5 text-gray-400 hover:border-accent-secondary/60 hover:text-accent-secondary"
      }`}
    >
      {children}
    </button>
  );
}
