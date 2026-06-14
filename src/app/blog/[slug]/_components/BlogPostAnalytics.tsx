"use client";

import { useEffect, useRef } from "react";

import {
  trackArticleEngagedRead,
  trackArticleScrollDepth,
} from "@/lib/analytics";

const ENGAGED_READ_SECONDS = 45;
const SCROLL_DEPTH_THRESHOLDS: readonly ScrollDepth[] = [50, 90];

type ScrollDepth = 50 | 90;

type BlogPostAnalyticsProps = {
  slug: string;
  title: string;
};

function getArticleScrollDepth(article: HTMLElement) {
  const rect = article.getBoundingClientRect();
  const articleHeight = Math.max(article.scrollHeight, article.offsetHeight);

  if (articleHeight <= 0) {
    return 0;
  }

  const visibleBottom = Math.min(
    articleHeight,
    Math.max(0, window.innerHeight - rect.top)
  );

  return Math.min(100, Math.max(0, (visibleBottom / articleHeight) * 100));
}

export function BlogPostAnalytics({ slug, title }: BlogPostAnalyticsProps) {
  const maxScrollDepthRef = useRef(0);
  const firedScrollDepthsRef = useRef<Set<ScrollDepth>>(new Set());
  const elapsedEnoughTimeRef = useRef(false);
  const firedEngagedReadRef = useRef(false);

  useEffect(() => {
    const article = document.querySelector<HTMLElement>("main article");

    if (!article) {
      return;
    }

    const articleElement = article;

    function maybeTrackEngagedRead() {
      if (
        firedEngagedReadRef.current ||
        !elapsedEnoughTimeRef.current ||
        maxScrollDepthRef.current < 50
      ) {
        return;
      }

      firedEngagedReadRef.current = true;
      trackArticleEngagedRead({
        minimumSeconds: ENGAGED_READ_SECONDS,
        scrollDepth: Math.round(maxScrollDepthRef.current),
        slug,
        title,
      });
    }

    function updateScrollDepth() {
      const depth = getArticleScrollDepth(articleElement);
      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, depth);

      for (const threshold of SCROLL_DEPTH_THRESHOLDS) {
        if (
          maxScrollDepthRef.current >= threshold &&
          !firedScrollDepthsRef.current.has(threshold)
        ) {
          firedScrollDepthsRef.current.add(threshold);
          trackArticleScrollDepth({
            depth: threshold,
            slug,
            title,
          });
        }
      }

      maybeTrackEngagedRead();
    }

    const engagedReadTimer = window.setTimeout(() => {
      elapsedEnoughTimeRef.current = true;
      maybeTrackEngagedRead();
    }, ENGAGED_READ_SECONDS * 1000);

    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    window.addEventListener("resize", updateScrollDepth);

    return () => {
      window.clearTimeout(engagedReadTimer);
      window.removeEventListener("scroll", updateScrollDepth);
      window.removeEventListener("resize", updateScrollDepth);
    };
  }, [slug, title]);

  return null;
}
