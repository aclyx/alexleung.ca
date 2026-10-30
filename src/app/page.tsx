import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";

import type { ProfilePage } from "schema-dts";

import { BrowserToolGrid } from "@/app/_components/BrowserToolGrid";
import { Hero } from "@/components/Hero";
import { HomeSectionAnalytics } from "@/components/HomeSectionAnalytics";
import { LinkText } from "@/components/LinkText";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { WritingList } from "@/components/WritingList";
import { getPostBySlug } from "@/lib/blogApi";
import {
  getStaticImageFallback,
  getStaticImageSourceSet,
} from "@/lib/localImageMetadata";
import { buildPageMetadata, buildProfilePageSchema } from "@/lib/seo";

const title = "Alex Leung | Software Engineer and Writer";
const description =
  "Alex Leung works on ChatGPT at OpenAI and writes about software, technical books, and life outside work.";
const path = "/";
const selectedPostSlugs = [
  "humanitys-cosmic-endowment",
  "farming-expensive-coding-agent-sessions",
  "making-responsive-images-just-work",
];

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path,
  images: [
    {
      url: "/assets/alex_vibing.webp",
      width: 1536,
      height: 1024,
      alt: "Alex Leung in an art studio",
    },
  ],
});

export default function Page() {
  const selectedPosts = selectedPostSlugs
    .map((slug) =>
      getPostBySlug(slug, [
        "slug",
        "title",
        "date",
        "excerpt",
        "coverImage",
        "coverAlt",
        "unlisted",
      ])
    )
    .filter((post) => post !== null)
    .filter((post) => !post.unlisted);
  const featuredPost = getPostBySlug("two-nights-in-desolation-wilderness", [
    "slug",
    "title",
    "unlisted",
  ]);
  const photo = getStaticImageFallback("homeFeature");
  const featuredPhoto =
    featuredPost && !featuredPost.unlisted ? (
      <figure>
        <Link
          href={`/blog/${featuredPost.slug}/`}
          aria-label={`Read ${featuredPost.title}`}
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
        >
          <ResponsiveImage
            src={photo.path}
            srcSet={getStaticImageSourceSet("homeFeature")}
            alt="A cup held in front of Upper Velma Lake and the granite above it"
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 1120px) 440px, (min-width: 768px) 40vw, calc(100vw - 2.5rem)"
            className="aspect-[3/2] w-full rounded-lg object-cover"
            pictureClassName="block"
            decoding="async"
          />
        </Link>
        <figcaption className="mt-3 text-sm leading-relaxed text-muted">
          Upper Velma Lake, from{" "}
          <LinkText href={`/blog/${featuredPost.slug}/`}>
            {featuredPost.title}
          </LinkText>
          .
        </figcaption>
      </figure>
    ) : null;

  return (
    <>
      <JsonLd<ProfilePage>
        item={buildProfilePageSchema({ path, title, description })}
      />
      <HomeSectionAnalytics />
      <Hero aside={featuredPhoto} />
      <ResponsiveContainer>
        <section
          id="writing"
          aria-labelledby="selected-writing-heading"
          className="py-8 md:py-10"
        >
          <div className="mb-2 flex items-center justify-between gap-5">
            <h2 id="selected-writing-heading" className="text-editorial-label">
              Selected writing
            </h2>
            <div className="flex text-sm">
              <LinkText href="/blog/" standalone>
                All writing →
              </LinkText>
            </div>
          </div>
          <WritingList posts={selectedPosts} headingLevel="h3" />
        </section>
        <section
          id="tools"
          aria-labelledby="browser-tools-heading"
          className="border-t border-line py-8 md:py-10"
        >
          <h2 id="browser-tools-heading" className="text-editorial-label mb-5">
            Browser tools
          </h2>
          <BrowserToolGrid />
        </section>
      </ResponsiveContainer>
    </>
  );
}
