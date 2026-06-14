"use client";

type AnalyticsParam = boolean | number | string;
type AnalyticsParams = Record<string, AnalyticsParam | null | undefined>;

const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
const keyEventCategory = "key_event";
const engagementCategory = "engagement";
const navigationCategory = "navigation";

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
  trackEvent(eventName, keyEventCategory, params);
}

function trackEvent(
  eventName: string,
  eventCategory: string,
  params: AnalyticsParams = {}
) {
  if (!analyticsEnabled || typeof window === "undefined") {
    return;
  }

  const eventParams = compactParams({
    event_category: eventCategory,
    ...params,
  });

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(["event", eventName, eventParams]);
  }
}

function getUrlHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
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
    link_host: getUrlHost(url),
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
    form_id: "follow_it_subscribe",
    method: "follow_it",
    placement,
  });
}

type LinkClickParams = {
  current_path: string;
  link_text: string;
  link_url: string;
};

export function trackInternalLinkClick({
  destination_path,
  ...params
}: LinkClickParams & {
  destination_path: string;
}) {
  trackEvent("internal_link_click", navigationCategory, {
    ...params,
    destination_path,
    link_type: "internal",
  });
}

export function trackExternalLinkClick({
  link_host,
  ...params
}: LinkClickParams & {
  link_host: string;
}) {
  trackEvent("external_link_click", navigationCategory, {
    ...params,
    link_host,
    link_type: "external",
    outbound: true,
  });
}

export function trackArticleScrollDepth({
  depth,
  slug,
  title,
}: {
  depth: 50 | 90;
  slug: string;
  title: string;
}) {
  trackEvent(`article_scroll_${depth}`, engagementCategory, {
    article_slug: slug,
    article_title: title,
    scroll_depth: depth,
  });
}

export function trackArticleEngagedRead({
  minimumSeconds,
  scrollDepth,
  slug,
  title,
}: {
  minimumSeconds: number;
  scrollDepth: number;
  slug: string;
  title: string;
}) {
  trackEvent("article_engaged_read", engagementCategory, {
    article_slug: slug,
    article_title: title,
    minimum_seconds: minimumSeconds,
    scroll_depth: scrollDepth,
  });
}
