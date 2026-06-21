import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import type { WebPage } from "schema-dts";

import { Hero } from "@/components/Hero";
import { LatestWritingSection } from "@/components/LatestWritingSection";
import { PhotoGrid, type PhotoGridItem } from "@/components/PhotoGrid";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";
import { getAllPosts } from "@/lib/blogApi";
import { buildHomePageSchema, buildPageMetadata } from "@/lib/seo";

const title = "Alex Leung | Software Engineer and Writer";
const description =
  "Alex Leung is a software engineer in San Francisco writing about AI product development, software systems, deep learning notes, and small browser experiments.";
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

const recentPhotos: readonly PhotoGridItem[] = [
  {
    src: "/assets/site-photos/lake-louise-reflection.webp",
    alt: "Lake Louise at sunrise with mountains reflected on the water",
    caption: "Lake Louise",
    width: 1400,
    height: 1867,
    aspectClassName: "aspect-[4/3]",
    imageClassName: "object-center",
  },
  {
    src: "/assets/site-photos/twin-peaks-view.webp",
    alt: "San Francisco skyline viewed from Twin Peaks on a clear afternoon",
    caption: "Twin Peaks",
    width: 1400,
    height: 1050,
  },
  {
    src: "/assets/site-photos/chengdu-street.webp",
    alt: "Street-side restaurant scene in Chengdu at night",
    caption: "Chengdu",
    width: 1400,
    height: 1050,
  },
];

function RecentPhotosSection() {
  return (
    <ResponsiveContainer element="section" className="pb-12 md:pb-14">
      <SectionBlock title="Recent Photos" titleId="recent-photos" spacing="lg">
        <PhotoGrid photos={recentPhotos} />
      </SectionBlock>
    </ResponsiveContainer>
  );
}

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
      <RecentPhotosSection />
      <LatestWritingSection posts={latestPosts} />
    </>
  );
}
