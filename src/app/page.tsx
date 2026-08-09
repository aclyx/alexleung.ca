import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import type { WebPage } from "schema-dts";

import { Hero } from "@/components/Hero";
import { LatestWritingSection } from "@/components/LatestWritingSection";
import { getAllPosts } from "@/lib/blogApi";
import { buildHomePageSchema, buildPageMetadata } from "@/lib/seo";

const title = "Alex Leung | Software Engineer and Writer";
const description =
  "Writing and interactive experiments from Alex Leung, including notes on building software, working with AI tools, reading technical books, and life outside work.";
const path = "/";

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  images: [
    {
      url: "/assets/alex_vibing.webp",
      width: 1536,
      height: 1024,
      alt: "Portrait of Alex Leung",
    },
  ],
});

export default function Page() {
  const latestPosts = getAllPosts(["slug", "title", "date", "excerpt"]).slice(
    0,
    3
  );

  return (
    <>
      <JsonLd<WebPage>
        item={buildHomePageSchema({
          path,
          title,
          description,
        })}
      />
      <Hero />
      <LatestWritingSection posts={latestPosts} />
    </>
  );
}
