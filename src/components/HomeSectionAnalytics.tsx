"use client";

import { useEffect } from "react";

import { trackHomeSectionView, type HomeSectionId } from "@/lib/analytics";

const homeSectionIds: readonly HomeSectionId[] = [
  "experience",
  "interests",
  "writing",
];

export function HomeSectionAnalytics() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const sections: Array<{ element: HTMLElement; id: HomeSectionId }> = [];

    for (const id of homeSectionIds) {
      const section = document.getElementById(id);
      const element =
        section?.querySelector<HTMLElement>("h2") ?? section ?? undefined;

      if (element) {
        sections.push({ element, id });
      }
    }

    if (sections.length === 0) {
      return;
    }

    const sectionIdsByElement = new Map<Element, HomeSectionId>(
      sections.map(({ element, id }) => [element, id])
    );
    const viewedSections = new Set<HomeSectionId>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = sectionIdsByElement.get(entry.target);

          if (
            !entry.isIntersecting ||
            !sectionId ||
            viewedSections.has(sectionId)
          ) {
            continue;
          }

          viewedSections.add(sectionId);
          trackHomeSectionView(sectionId);
          observer.unobserve(entry.target);
        }

        if (viewedSections.size === sections.length) {
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    for (const { element } of sections) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
