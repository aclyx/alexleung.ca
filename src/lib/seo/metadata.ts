import type { Metadata } from "next";

import { toAbsoluteUrl, toCanonical } from "@/lib/seo/url";

import type { SeoInput } from "./types";

const SITE_NAME = "Alex Leung";
const DEFAULT_LOCALE = "en_CA";

export function buildPageMetadata(input: SeoInput): Metadata {
  const canonicalUrl = toCanonical(input.path);
  const normalizedImages =
    input.images?.map((image) => ({
      ...image,
      url: toAbsoluteUrl(image.url),
    })) ?? [];
  const hasImages = normalizedImages.length > 0;
  const twitterCard =
    input.twitterCard || (hasImages ? "summary_large_image" : "summary");
  const rssFeedUrl = toAbsoluteUrl("/feed.xml");

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl,
      types: {
        "application/rss+xml": [
          {
            url: rssFeedUrl,
            title: "Alex Leung Blog RSS Feed",
          },
        ],
      },
    },
    openGraph: {
      title: input.title,
      description: input.description,
      type: input.type || "website",
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      images: hasImages ? normalizedImages : undefined,
    },
    twitter: {
      card: twitterCard,
      title: input.title,
      description: input.description,
      images: hasImages ? normalizedImages : undefined,
    },
  };
}
