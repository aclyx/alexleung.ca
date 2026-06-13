"use client";

import { useState } from "react";

import { chipClassName } from "@/components/Chip";
import { Tag } from "@/components/Tag";

const INITIAL_VISIBLE_TOPIC_COUNT = 5;
const TOPIC_REVEAL_INCREMENT = 4;

export type TopicLink = {
  href: string;
  name: string;
};

type TopicRevealListProps = {
  topics: TopicLink[];
};

export function TopicRevealList({ topics }: TopicRevealListProps) {
  const initialVisibleCount = Math.min(
    INITIAL_VISIBLE_TOPIC_COUNT,
    topics.length
  );
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const visibleTopics = topics.slice(0, visibleCount);
  const hiddenCount = topics.length - visibleCount;
  const revealCount = Math.min(TOPIC_REVEAL_INCREMENT, hiddenCount);

  if (topics.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">
        Topics
      </h3>
      <div
        id="blog-topic-list"
        className="flex flex-wrap gap-2 md:justify-center"
      >
        {visibleTopics.map((topic) => (
          <Tag key={topic.href} href={topic.href}>
            {topic.name}
          </Tag>
        ))}
        {hiddenCount > 0 ? (
          <button
            type="button"
            aria-controls="blog-topic-list"
            className={chipClassName(
              "border-gray-500/50 bg-slate-950/30 text-gray-200 transition-colors hover:border-accent-secondary hover:bg-accent-secondary/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            )}
            onClick={() =>
              setVisibleCount((currentCount) =>
                Math.min(currentCount + TOPIC_REVEAL_INCREMENT, topics.length)
              )
            }
          >
            View {revealCount} more
          </button>
        ) : null}
      </div>
    </div>
  );
}
