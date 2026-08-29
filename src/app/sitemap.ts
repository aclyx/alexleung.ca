import { MetadataRoute } from "next";

import { NOW_PAGE_LAST_UPDATED_ISO } from "@/app/now/page";
import { getAllPosts } from "@/lib/blogApi";
import { toCanonical } from "@/lib/seo/url";
import { getAllTags, getTagPath, isIndexableTag } from "@/lib/tags";

export const dynamic = "force-static";

type SitemapEntry = MetadataRoute.Sitemap[number];
const MONTHLY: SitemapEntry["changeFrequency"] = "monthly";
const WEEKLY: SitemapEntry["changeFrequency"] = "weekly";
const YEARLY: SitemapEntry["changeFrequency"] = "yearly";

const PAGE_LAST_MODIFIED: Record<string, string> = {
  home: "2026-08-29",
  now: NOW_PAGE_LAST_UPDATED_ISO,
  blog: "2026-08-29",
  contact: "2026-08-29",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts(["slug", "date", "updated"]);
  const tags = getAllTags().filter(isIndexableTag);

  const blogPosts = posts.map((post) => ({
    url: toCanonical(`/blog/${post.slug}`),
    lastModified: new Date(
      post.updated || post.date || PAGE_LAST_MODIFIED.blog
    ),
    changeFrequency: MONTHLY,
    priority: 0.7,
  }));

  const tagPages = tags.map((tag) => ({
    url: toCanonical(getTagPath(tag.name)),
    lastModified: new Date(tag.latestModified),
    changeFrequency: MONTHLY,
    priority: 0.6,
  }));

  const latestPostUpdateIso =
    posts.length > 0
      ? posts
          .map((post) => post.updated || post.date)
          .filter((date): date is string => Boolean(date))
          .sort()
          .at(-1) || PAGE_LAST_MODIFIED.blog
      : PAGE_LAST_MODIFIED.blog;
  const homeLastModified = new Date(
    [PAGE_LAST_MODIFIED.home, latestPostUpdateIso].sort().at(-1)!
  );
  const blogLastModified = new Date(
    [PAGE_LAST_MODIFIED.blog, latestPostUpdateIso].sort().at(-1)!
  );

  return [
    {
      url: toCanonical("/"),
      lastModified: homeLastModified,
      changeFrequency: MONTHLY,
      priority: 1,
    },
    {
      url: toCanonical("/now"),
      lastModified: new Date(PAGE_LAST_MODIFIED.now),
      changeFrequency: MONTHLY,
      priority: 0.8,
    },
    {
      url: toCanonical("/blog"),
      lastModified: blogLastModified,
      changeFrequency: WEEKLY,
      priority: 0.8,
    },
    {
      url: toCanonical("/contact"),
      lastModified: new Date(PAGE_LAST_MODIFIED.contact),
      changeFrequency: YEARLY,
      priority: 0.5,
    },
    ...tagPages,
    ...blogPosts,
  ];
}
