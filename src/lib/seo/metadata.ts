import type { Metadata } from "next";

import { toAbsoluteUrl, toCanonical } from "@/lib/seo/url";

import type { SeoInput } from "./types";

const SITE_NAME = "Alex Leung";
const DEFAULT_LOCALE = "en_CA";
// Pages without their own image still get a large share card.
const DEFAULT_IMAGES = [
  {
    url: "/assets/alex_vibing.webp",
    width: 1536,
    height: 1024,
    alt: "Alex Leung in an art studio",
  },
];

export function buildPageMetadata(input: SeoInput): Metadata {
  const canonicalUrl = toCanonical(input.path);
  const images = input.images?.length ? input.images : DEFAULT_IMAGES;
  const normalizedImages = images.map((image) => ({
    ...image,
    url: toAbsoluteUrl(image.url),
  }));
  const twitterCard = input.twitterCard || "summary_large_image";
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
            title: "Alex Leung's Writing RSS Feed",
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
      images: normalizedImages,
    },
    twitter: {
      card: twitterCard,
      title: input.title,
      description: input.description,
      images: normalizedImages,
    },
  };
}
