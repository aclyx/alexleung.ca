import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";

import type { ProfilePage } from "schema-dts";

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
  "dropout-as-implicit-bagging",
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
    .map((slug) => getPostBySlug(slug, ["slug", "title", "date", "excerpt"]))
    .filter((post) => post !== null);
  const featuredPost = getPostBySlug("two-nights-in-desolation-wilderness", [
    "slug",
    "title",
  ]);
  const photo = getStaticImageFallback("homeFeature");

  return (
    <>
      <JsonLd<ProfilePage>
        item={buildProfilePageSchema({ path, title, description })}
      />
      <HomeSectionAnalytics />
      <Hero />
      <ResponsiveContainer>
        <div className="grid gap-8 py-8 md:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)] md:gap-16 md:py-10">
          <section id="writing" aria-labelledby="selected-writing-heading">
            <div className="mb-2 flex items-center justify-between gap-5">
              <h2
                id="selected-writing-heading"
                className="text-editorial-label"
              >
                Selected writing
              </h2>
              <div className="flex text-sm">
                <LinkText href="/blog/" standalone>
                  All writing →
                </LinkText>
              </div>
            </div>
            <WritingList
              posts={selectedPosts}
              variant="selected"
              headingLevel="h3"
            />
          </section>
          <aside
            id="interests"
            aria-label="More from this site"
            className="border-t border-line pt-6 md:border-t-0 md:pt-3"
          >
            {featuredPost ? (
              <section aria-labelledby="featured-writing-heading">
                <h2
                  id="featured-writing-heading"
                  className="text-editorial-label"
                >
                  From the blog
                </h2>
                <article className="mt-4">
                  <Link
                    href={`/blog/${featuredPost.slug}/`}
                    aria-label={`Read ${featuredPost.title}`}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                  >
                    <ResponsiveImage
                      src={photo.path}
                      srcSet={getStaticImageSourceSet("homeFeature")}
                      alt="A cup held in front of Upper Velma Lake and the granite above it"
                      width={photo.width}
                      height={photo.height}
                      sizes="(min-width: 1120px) 366px, (min-width: 768px) 36vw, calc(100vw - 2.5rem)"
                      className="aspect-[1.9] w-full object-cover"
                      pictureClassName="block"
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                  <h3 className="text-editorial-heading mt-4">
                    <LinkText href={`/blog/${featuredPost.slug}/`}>
                      {featuredPost.title}
                    </LinkText>
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    A new sleep setup and more food than we needed.
                  </p>
                </article>
              </section>
            ) : null}
          </aside>
        </div>
        <section
          id="experience"
          aria-labelledby="work-heading"
          className="grid gap-3 border-t border-line py-6 md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-6"
        >
          <h2 id="work-heading" className="text-editorial-label">
            Work
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Previously at Jetson, Google, Cash App, and North.
          </p>
        </section>
      </ResponsiveContainer>
    </>
  );
}
