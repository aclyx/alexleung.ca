"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineMail } from "react-icons/hi";

import { actionClassNames } from "@/components/controlStyles";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Subtitle } from "@/components/Subtitle";
import { surfaceClassNames } from "@/components/Surface";

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
    <ResponsiveContainer element="section" className="space-y-6">
      <Subtitle title="Email" id="email" />
      <div
        className={surfaceClassNames({
          padding: "responsive",
          className: "max-w-2xl",
        })}
      >
        <p className="text-body text-muted">
          Email me about a software project or something I wrote.
        </p>
        <p className="mt-3 font-semibold text-ink">{EMAIL_ADDRESS}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a href={`mailto:${EMAIL_ADDRESS}`} className={actionClassNames()}>
            <HiOutlineMail aria-hidden="true" className="text-lg" />
            Email me
          </a>
          <button
            type="button"
            onClick={copyEmail}
            aria-label="Copy email"
            data-copy-status={copyStatus}
            className={actionClassNames({
              variant: "secondary",
              className: "sm:w-32",
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
                Copy email
              </span>
              <span
                className={`col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none ${
                  copyStatus === "copied" ? "opacity-100" : "opacity-0"
                }`}
              >
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
      </div>
    </ResponsiveContainer>
  );
}
