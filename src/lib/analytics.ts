"use client";

import { sendGAEvent } from "@next/third-parties/google";

type AnalyticsParam = boolean | number | string;
type AnalyticsParams = Record<string, AnalyticsParam | null | undefined>;

const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
const keyEventCategory = "key_event";

function compactParams(
  params: AnalyticsParams
): Record<string, AnalyticsParam> {
  const compacted: Record<string, AnalyticsParam> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      compacted[key] = value;
    }
  }

  return compacted;
}

function trackKeyEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!analyticsEnabled) {
    return;
  }

  sendGAEvent(
    "event",
    eventName,
    compactParams({
      event_category: keyEventCategory,
      ...params,
    })
  );
}

export function trackContactLinkClick({
  label,
  placement,
  url,
}: {
  label: string;
  placement: string;
  url: string;
}) {
  trackKeyEvent("contact_link_click", {
    link_text: label,
    link_url: url,
    placement,
  });
}

export function trackExperimentInteraction(
  experiment: string,
  action: string,
  params: AnalyticsParams = {}
) {
  trackKeyEvent("experiment_interaction", {
    action,
    experiment,
    ...params,
  });
}

export function trackNewsletterSubscribe(placement: string) {
  trackKeyEvent("newsletter_subscribe_submit", {
    method: "follow_it",
    placement,
  });
}
