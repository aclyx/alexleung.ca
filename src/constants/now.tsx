import { ReactNode } from "react";

import ExternalLink from "@/components/ExternalLink";

export type NowEntryContent = {
  id: string;
  title: string;
  body: ReactNode;
};

const currentBookLink = (
  <ExternalLink href="https://rlhfbook.com/">
    <em>Reinforcement Learning from Human Feedback</em>
  </ExternalLink>
);

export const NOW_CONTENT = {
  updatedAt: "2026-10-25",
  homePreview: <>Currently reading: {currentBookLink}.</>,
  entries: [
    {
      id: "reading",
      title: "Currently reading",
      body: <p>I’m reading {currentBookLink} by Nathan Lambert.</p>,
    },
    {
      id: "rust",
      title: "Revisiting Rust",
      body: (
        <p>
          I’m revisiting Rust after six years away, working through{" "}
          <ExternalLink href="https://rust-exercises.com/100-exercises/01_intro/00_welcome">
            <em>100 Exercises to Learn Rust</em>
          </ExternalLink>
          . In the age of coding agents, it’s refreshing to get back into the
          details of the code and solve the exercises myself.
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
} satisfies {
  updatedAt: string;
  homePreview: ReactNode;
  entries: NowEntryContent[];
};

export const NOW_PAGE_LAST_UPDATED_ISO = NOW_CONTENT.updatedAt;

export const NOW_PAGE_LAST_UPDATED_DISPLAY = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${NOW_CONTENT.updatedAt}T00:00:00Z`));
