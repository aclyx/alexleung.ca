import type { Action } from "@/features/clockwerx/engine";

import styles from "./game.module.css";

export const controls: {
  action: Action;
  label: string;
  key: string;
  codes: string[];
  description: string;
}[] = [
  {
    action: "swing",
    label: "Swing",
    key: "X",
    codes: ["KeyX", "Period"],
    description: "Hold to grab the next peg and change rotation.",
  },
  {
    action: "flip",
    label: "Flip",
    key: "Shift",
    codes: ["ShiftLeft", "ShiftRight"],
    description: "Hold to grab the next peg and keep your rotation.",
  },
  {
    action: "bounce",
    label: "Bounce",
    key: "Z",
    codes: ["KeyZ", "Slash"],
    description: "Hold to turn back when the tip meets a peg.",
  },
  {
    action: "reverse",
    label: "Reverse",
    key: "Space",
    codes: ["Space"],
    description: "Tap to turn back immediately around your current peg.",
  },
];

// The open circle is the other peg. The filled circle is the pivot after the move.
export function ControlIcon({ action }: { action: Action }) {
  const transfer = action === "swing" || action === "flip";
  return (
    <svg
      className={styles.controlIcon}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 32 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {transfer && (
        <>
          <circle cx="7.5" cy="13" r="2.2" strokeWidth="1.6" />
          <circle cx="24.5" cy="13" r="2.6" fill="currentColor" stroke="none" />
          <path d="M4.5 5 A8.5 8.5 0 0 1 16 13" />
          {action === "swing" ? (
            <>
              <path d="M16 13 A8.5 8.5 0 0 0 28.5 20.5" />
              <path d="m24 18.3 4.7 2.1-2 4.5" />
            </>
          ) : (
            <>
              <path d="M16 13 A8.5 8.5 0 0 1 28.5 5.5" />
              <path d="m26.7 1.2 2.1 4.5-4.7 2" />
            </>
          )}
        </>
      )}
      {action === "bounce" && (
        <>
          <circle cx="8" cy="19" r="2.6" fill="currentColor" stroke="none" />
          <circle cx="26" cy="13" r="2.2" strokeWidth="1.6" />
          <path d="M9 3.5 Q18 3.5 22.5 12.5 Q17 9.5 11.5 10.5" />
          <path d="m14.6 6.8-3.4 3.9 4.3 2.7" />
        </>
      )}
      {action === "reverse" && (
        <>
          <circle cx="16" cy="13" r="2.6" fill="currentColor" stroke="none" />
          <path d="m16 13 5.3 6.3" />
          <path d="M20.5 22 A10 10 0 1 0 6 13.5" />
          <path d="m2.5 9.9 3.5 4 3.6-3.8" />
        </>
      )}
    </svg>
  );
}
