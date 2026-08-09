"use client";

import { useState } from "react";
import { HiOutlineMail } from "react-icons/hi";

import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Subtitle } from "@/components/Subtitle";
import { surfaceClassNames } from "@/components/Surface";

const EMAIL_ADDRESS = "alex@alexleung.ca";

export function EmailMe() {
  const [copyLabel, setCopyLabel] = useState("Copy email");

  const copyEmail = async () => {
    if (!navigator.clipboard) {
      setCopyLabel("Copy unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(EMAIL_ADDRESS);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy unavailable");
    }
  };

  return (
    <ResponsiveContainer element="section" className="text-center">
      <Subtitle title="Email" id="email" />
      <div
        className={surfaceClassNames({
          className: "mx-auto max-w-2xl p-6 md:p-8",
        })}
      >
        <p className="text-body text-gray-200">
          Email me about a software project or something I wrote.
        </p>
        <p className="mt-3 font-semibold text-white">{EMAIL_ADDRESS}</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={`mailto:${EMAIL_ADDRESS}`}
            className="text-body inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-br from-blue-500 to-accent-primary px-5 py-2.5 font-bold text-white transition-colors hover:from-blue-600 hover:to-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <HiOutlineMail aria-hidden="true" className="text-lg" />
            Email me
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="text-body inline-flex min-h-11 items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-2.5 font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {copyLabel}
          </button>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
