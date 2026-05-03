import { MetadataRoute } from "next";

import { NOW_PAGE_LAST_UPDATED_ISO } from "@/app/now/page";
import { EXPERIMENTS, EXPERIMENTS_HUB } from "@/constants/experiments";
import { getAllPosts } from "@/lib/blogApi";
import { toCanonical } from "@/lib/seo/url";
import { getAllTags, getTagPath, isIndexableTag } from "@/lib/tags";

export const dynamic = "force-static";

type SitemapEntry = MetadataRoute.Sitemap[number];
const MONTHLY: SitemapEntry["changeFrequency"] = "monthly";
const WEEKLY: SitemapEntry["changeFrequency"] = "weekly";
const YEARLY: SitemapEntry["changeFrequency"] = "yearly";

const PAGE_LAST_MODIFIED: Record<string, string> = {
  about: "2026-02-14",
  now: NOW_PAGE_LAST_UPDATED_ISO,
  contact: "2026-02-14",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts(["slug", "date", "updated"]);
  const tags = getAllTags().filter(isIndexableTag);

  const blogPosts = posts.map((post) => ({
    url: toCanonical(`/blog/${post.slug}`),
    lastModified: new Date(
      post.updated || post.date || PAGE_LAST_MODIFIED.about
    ),
    changeFrequency: MONTHLY,
    priority: 0.7,
  }));

  const experimentalPages = EXPERIMENTS.map((experiment) => ({
    url: toCanonical(experiment.path),
    lastModified: new Date(experiment.lastModified),
    changeFrequency: MONTHLY,
    priority: 0.7,
  }));

  const tagPages = tags.map((tag) => ({
    url: toCanonical(getTagPath(tag.name)),
    lastModified: new Date(tag.latestModified),
    changeFrequency: MONTHLY,
    priority: 0.6,
  }));

  const latestPostUpdate =
    posts.length > 0
      ? new Date(
          posts
            .map((post) => post.updated || post.date)
            .filter((date): date is string => Boolean(date))
            .sort()
            .at(-1) || PAGE_LAST_MODIFIED.about
        )
      : new Date(PAGE_LAST_MODIFIED.about);

  return [
    {
      url: toCanonical("/"),
      lastModified: latestPostUpdate,
      changeFrequency: MONTHLY,
      priority: 1,
    },
    {
      url: toCanonical("/about"),
      lastModified: new Date(PAGE_LAST_MODIFIED.about),
      changeFrequency: MONTHLY,
      priority: 0.8,
    },
    {
      url: toCanonical("/now"),
      lastModified: new Date(PAGE_LAST_MODIFIED.now),
      changeFrequency: MONTHLY,
      priority: 0.8,
    },
    {
      url: toCanonical("/blog"),
      lastModified: latestPostUpdate,
      changeFrequency: WEEKLY,
      priority: 0.8,
    },
    {
      url: toCanonical(EXPERIMENTS_HUB.path),
      lastModified: new Date(EXPERIMENTS_HUB.lastModified),
      changeFrequency: MONTHLY,
      priority: 0.7,
    },
    {
      url: toCanonical("/contact"),
      lastModified: new Date(PAGE_LAST_MODIFIED.contact),
      changeFrequency: YEARLY,
      priority: 0.5,
    },
    ...experimentalPages,
    ...tagPages,
    ...blogPosts,
  ];
}
