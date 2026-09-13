"use client";

import { useEffect, useState } from "react";

import { chipClassName } from "@/components/Chip";
import { Tag } from "@/components/Tag";

const INITIAL_VISIBLE_TOPIC_COUNT = 5;
const TOPIC_REVEAL_INCREMENT = 4;

export type TopicLink = {
  href: string;
  name: string;
};

type TopicRevealListProps = {
  heading?: string;
  headingLevel?: "h2" | "h3";
  listId?: string;
  topics: TopicLink[];
};

export function TopicRevealList({
  heading = "Topics",
  headingLevel = "h2",
  listId = "blog-topic-list",
  topics,
}: TopicRevealListProps) {
  const initialVisibleCount = Math.min(
    INITIAL_VISIBLE_TOPIC_COUNT,
    topics.length
  );
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [revealStartIndex, setRevealStartIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const visibleTopics = topics.slice(0, visibleCount);
  const hiddenCount = topics.length - visibleCount;
  const revealCount = Math.min(TOPIC_REVEAL_INCREMENT, hiddenCount);
  const Heading = headingLevel === "h2" ? "h2" : "h3";

  useEffect(() => {
    if (focusIndex === null) {
      return;
    }

    const links = document
      .getElementById(listId)
      ?.querySelectorAll<HTMLAnchorElement>("a");
    links?.[focusIndex]?.focus();
  }, [focusIndex, listId, visibleCount]);

  if (topics.length === 0) {
    return null;
  }

  return (
    <div>
      <Heading className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {heading}
      </Heading>
      <div id={listId} className="flex flex-wrap gap-2">
        {visibleTopics.map((topic, index) => (
          <Tag
            key={topic.href}
            href={topic.href}
            className={
              revealStartIndex !== null && index >= revealStartIndex
                ? "topic-enter"
                : ""
            }
          >
            {topic.name}
          </Tag>
        ))}
        {hiddenCount > 0 ? (
          <button
            type="button"
            aria-controls={listId}
            className={chipClassName(
              "border-control-border bg-surface text-muted transition-[background-color,border-color,color,translate] duration-200 ease-expo-out hover:border-accent-link/50 hover:bg-accent-secondary-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-px"
            )}
            onClick={() => {
              const nextVisibleCount = Math.min(
                visibleCount + TOPIC_REVEAL_INCREMENT,
                topics.length
              );

              setRevealStartIndex(visibleCount);
              setVisibleCount(nextVisibleCount);
              setFocusIndex(visibleCount);
            }}
          >
            View {revealCount} more
          </button>
        ) : null}
      </div>
    </div>
  );
}
