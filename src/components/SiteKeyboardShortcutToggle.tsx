"use client";

import { useEffect, useState } from "react";
import { FaKeyboard } from "react-icons/fa6";

import {
  readSiteKeyboardShortcutsEnabled,
  setSiteKeyboardShortcutsEnabled,
  SITE_KEYBOARD_SHORTCUTS_CHANGED_EVENT,
  SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY,
} from "@/components/SiteKeyboardShortcuts";

export function SiteKeyboardShortcutToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(readSiteKeyboardShortcutsEnabled());

    const syncEnabled = () => {
      setEnabled(readSiteKeyboardShortcutsEnabled());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY) {
        syncEnabled();
      }
    };

    window.addEventListener(SITE_KEYBOARD_SHORTCUTS_CHANGED_EVENT, syncEnabled);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        SITE_KEYBOARD_SHORTCUTS_CHANGED_EVENT,
        syncEnabled
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleShortcuts = () => {
    const nextEnabled = !enabled;

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
      <FaKeyboard aria-hidden="true" />
    </button>
  );
}
