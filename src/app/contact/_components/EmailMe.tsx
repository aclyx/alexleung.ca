"use client";

import { useEffect, useRef, useState } from "react";

import { actionClassNames } from "@/components/controlStyles";

const EMAIL_ADDRESS = "alex@alexleung.ca";
const COPY_FEEDBACK_DURATION_MS = 2_000;

type CopyStatus = "idle" | "copied" | "failed";

export function EmailMe() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    },
    []
  );

  const showCopyFeedback = (status: Exclude<CopyStatus, "idle">) => {
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }

    setCopyStatus(status);
    resetTimer.current = window.setTimeout(() => {
      setCopyStatus("idle");
      resetTimer.current = null;
    }, COPY_FEEDBACK_DURATION_MS);
  };

  const copyEmail = async () => {
    if (!navigator.clipboard) {
      showCopyFeedback("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(EMAIL_ADDRESS);
      showCopyFeedback("copied");
    } catch {
      showCopyFeedback("failed");
    }
  };

  return (
    <section id="email" aria-label="Email">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={`mailto:${EMAIL_ADDRESS}`}
          className="text-body-lg inline-flex min-h-11 items-center text-accent-link underline decoration-accent-link/40 underline-offset-4 transition-colors hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {EMAIL_ADDRESS}
        </a>
        <button
          type="button"
          onClick={copyEmail}
          aria-label="Copy email"
          data-copy-status={copyStatus}
          className={actionClassNames({
            variant: "quiet",
            size: "sm",
            className: "w-24",
          })}
        >
          <span
            aria-hidden="true"
            className="grid motion-reduce:transition-none"
          >
            <span
              className={`col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none ${
                copyStatus === "idle" ? "opacity-100" : "opacity-0"
              }`}
            >
              Copy
            </span>
            <span
              className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 transition-opacity duration-150 motion-reduce:transition-none ${
                copyStatus === "copied" ? "opacity-100" : "opacity-0"
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-4 shrink-0"
                fill="none"
              >
                <path
                  className="copy-check-path"
                  pathLength="1"
                  d="m3 8.5 3 3L13 4.75"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Copied
            </span>
            <span
              className={`col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none ${
                copyStatus === "failed" ? "opacity-100" : "opacity-0"
              }`}
            >
              Try again
            </span>
          </span>
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copyStatus === "copied"
            ? "Email address copied to clipboard."
            : copyStatus === "failed"
              ? "Could not copy email address."
              : ""}
        </span>
      </div>
      <p className="text-body-sm mt-2 leading-relaxed text-muted">
        Email me about a software project or something I wrote.
      </p>
    </section>
  );
}
