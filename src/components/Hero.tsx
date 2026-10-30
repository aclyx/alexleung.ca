import type { ReactNode } from "react";

import { LinkText } from "@/components/LinkText";
import { NOW_CONTENT } from "@/constants/now";

type HeroProps = {
  aside?: ReactNode;
};

export function Hero({ aside }: HeroProps) {
  return (
    <section id="about" aria-labelledby="home-title" className="section-center">
      <div
        className={`border-b border-line py-8 md:py-11 ${aside ? "grid gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:items-center md:gap-14" : ""}`.trim()}
      >
        <div>
          <h1 id="home-title" className="text-hero-title text-ink">
            Alex Leung
          </h1>
          <p className="text-hero-description mt-5 max-w-xl leading-relaxed text-ink">
            I work on ChatGPT at OpenAI. I write about software, technical
            books, and life outside work.
          </p>
          <div className="text-body-sm mt-5 max-w-2xl space-y-1.5 leading-relaxed text-muted">
            <p>
              {NOW_CONTENT.homePreview}{" "}
              <LinkText href="/now/" standalone="inline">
                Now →
              </LinkText>
            </p>
            <p>Previously at Jetson, Google, Cash App, and North.</p>
          </div>
        </div>
        {aside}
      </div>
    </section>
  );
}
