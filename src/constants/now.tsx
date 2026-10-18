import { ReactNode } from "react";

import ExternalLink from "@/components/ExternalLink";

export type NowEntryContent = {
  id: string;
  title: string;
  body: ReactNode;
};

export const NOW_CONTENT = {
  updatedAt: "2026-10-03",
  entries: [
    {
      id: "reading",
      title: "Currently reading",
      body: (
        <p>
          I’m reading{" "}
          <ExternalLink href="https://rlhfbook.com/">
            <em>Reinforcement Learning from Human Feedback</em>
          </ExternalLink>{" "}
          by Nathan Lambert.
        </p>
      ),
    },
    {
      id: "sake",
      title: "Trying new sake",
      body: (
        <p>
          We’ve been enjoying trying new sake. We recently tried an
          unpasteurized sake, and I particularly liked its effervescence and
          brighter aroma.
        </p>
      ),
    },
  ],
} satisfies { updatedAt: string; entries: NowEntryContent[] };

export const NOW_PAGE_LAST_UPDATED_ISO = NOW_CONTENT.updatedAt;

export const NOW_PAGE_LAST_UPDATED_DISPLAY = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${NOW_CONTENT.updatedAt}T00:00:00Z`));
