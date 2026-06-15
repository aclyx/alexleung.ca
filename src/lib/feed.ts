import { Feed } from "feed";

import { BASE_URL } from "@/constants";
import { toCanonical } from "@/lib/seo";

type FeedPost = {
  title: string;
  slug: string;
  date: string;
  updated?: string;
  excerpt?: string;
  tags?: string[];
};

const FEED_TITLE = "Alex Leung's Blog";
const FEED_DESCRIPTION =
  "Notes on software systems, AI-assisted coding, deep learning, Next.js static sites, and small browser experiments.";
const FEED_IMAGE_URL = `${BASE_URL}/icon4.png`;

export function buildRssFeedXml(posts: readonly FeedPost[]): string {
  const firstPost = posts[0];
  const lastUpdated = firstPost
    ? posts.reduce((latest, post) => {
        const candidate = post.updated ?? post.date;
        return new Date(candidate).getTime() > new Date(latest).getTime()
          ? candidate
          : latest;
      }, firstPost.updated ?? firstPost.date)
    : new Date().toISOString();

  const feed = new Feed({
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    id: toCanonical("/blog"),
    link: toCanonical("/blog"),
    image: FEED_IMAGE_URL,
    language: "en-CA",
    feedLinks: {
      rss: `${BASE_URL}/feed.xml`,
    },
    updated: new Date(lastUpdated),
  });

  for (const post of posts) {
    const url = toCanonical(`/blog/${post.slug}`);
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      date: new Date(post.date),
      category: post.tags?.map((tag) => ({ name: tag })) ?? [],
      ...(post.excerpt ? { description: post.excerpt } : {}),
    });
  }

  return feed.rss2();
}
