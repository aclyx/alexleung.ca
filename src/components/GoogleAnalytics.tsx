"use client";

import { useEffect } from "react";

const GOOGLE_ANALYTICS_SCRIPT_ID = "google-analytics-gtag";
const initializedMeasurementIds = new Set<string>();

type GoogleAnalyticsProps = {
  measurementId: string;
};

function ensureDataLayer() {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });
}

function loadGoogleAnalyticsScript(measurementId: string) {
  if (document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = GOOGLE_ANALYTICS_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    measurementId
  )}`;

  document.head.appendChild(script);
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    ensureDataLayer();
    loadGoogleAnalyticsScript(measurementId);

    if (!initializedMeasurementIds.has(measurementId)) {
      window.gtag?.("js", new Date());
      window.gtag?.("config", measurementId);
      initializedMeasurementIds.add(measurementId);
    }
  }, [measurementId]);

  return null;
}
