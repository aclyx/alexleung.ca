import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPosting } from "schema-dts";

import { CoverImage } from "@/components/CoverImage";
import { FollowItSubscribeForm } from "@/components/FollowItSubscribeForm";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ProseContent } from "@/components/ProseContent";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Tag } from "@/components/Tag";
import { WritingList } from "@/components/WritingList";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  getSeriesNavigation,
} from "@/lib/blogApi";
import {
  getCoverVariant,
  getCoverVariantPath,
  getCoverVariantSourceSet,
} from "@/lib/coverVariants";
import { formatIsoDateForDisplay } from "@/lib/date";
import markdownToHtml from "@/lib/markdownToHtml";
import {
  buildBlogPostingSchema,
  buildPageMetadata,
  toCanonical,
} from "@/lib/seo";
import { getTagPath } from "@/lib/tags";

import { BlogPostAnalytics } from "./_components/BlogPostAnalytics";
import { ReadingProgress } from "./_components/ReadingProgress";

export const dynamicParams = false;

const seriesLinkClassName =
  "group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper";
const seriesTitleClassName =
  "text-editorial-heading mt-1 block group-hover:underline group-hover:decoration-line group-hover:underline-offset-4";

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params_awaited = await props.params;
  const post = getPostBySlug(params_awaited.slug, [
    "title",
    "excerpt",
    "coverImage",
    "coverAlt",
    "date",
    "updated",
    "tags",
    "unlisted",
  ]);

  if (!post) {
    return notFound();
  }

  const title = `${post.title} | Alex Leung`;
  const description =
    post.excerpt || `Read ${post.title} on Alex Leung's blog.`;
  const path = `/blog/${params_awaited.slug}`;
  const metadataCoverImage = getCoverVariant(post.coverImage, "hero");
  const metadataImage = post.coverImage
    ? {
        url: metadataCoverImage?.path || post.coverImage,
        alt: post.coverAlt || `Cover for ${post.title}`,
        ...(metadataCoverImage
          ? {
              width: metadataCoverImage.width,
              height: metadataCoverImage.height,
            }
          : {}),
      }
    : undefined;

  const metadata = buildPageMetadata({
    title,
    description,
    path,
    type: "article",
    images: metadataImage ? [metadataImage] : undefined,
  });

  return {
    ...metadata,
    ...(post.unlisted ? { robots: { index: false, follow: true } } : {}),
    authors: [{ name: "Alex Leung", url: toCanonical("/") }],
    openGraph: {
      type: "article",
      title,
      description,
      url: toCanonical(path),
      images: metadata.openGraph?.images,
      siteName: metadata.openGraph?.siteName,
      locale: metadata.openGraph?.locale,
      publishedTime: new Date(post.date).toISOString(),
      modifiedTime: new Date(post.updated || post.date).toISOString(),
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts(["slug"], { includeUnlisted: true });

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Post({ params }: Props) {
  const params_awaited = await params;
  const post = getPostBySlug(params_awaited.slug, [
    "title",
    "date",
    "updated",
    "slug",
    "content",
    "coverImage",
    "coverAlt",
    "excerpt",
    "tags",
  ]);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");
  const relatedPosts = getRelatedPosts(post.slug, { limit: 3 });
  const seriesNavigation = getSeriesNavigation(post.slug);
  const heroCoverImage = getCoverVariantPath(post.coverImage, "hero");
  const heroCoverSrcSet = getCoverVariantSourceSet(post.coverImage, "hero");
  const heroCoverAlt = post.coverAlt || `Cover for ${post.title}`;

  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "Writing", item: "/blog" },
          { name: post.title, item: `/blog/${post.slug}` },
        ]}
      />
      <JsonLd<BlogPosting>
        item={buildBlogPostingSchema({
          slug: post.slug,
          title: post.title,
          description: post.excerpt,
          coverImage: post.coverImage,
          date: post.date,
          updated: post.updated,
          tags: post.tags,
        })}
      />
      <BlogPostAnalytics slug={post.slug} title={post.title} />
      <ReadingProgress startId="post-title" endSelector="main article .prose" />
      <PageShell
        title={post.title}
        titleId="post-title"
        headerRail="prose"
        metadata={
          <div className="space-y-1">
            <p>
              <time dateTime={post.date}>
                Published {formatIsoDateForDisplay(post.date)}
              </time>
            </p>
            {seriesNavigation ? (
              <p>
                Part {seriesNavigation.currentPart} of{" "}
                {seriesNavigation.totalParts} in {seriesNavigation.name}
              </p>
            ) : null}
          </div>
        }
      >
        <ResponsiveContainer
          element="article"
          variant="prose"
          className="mb-12"
        >
          <div className="mx-auto">
            {post.coverImage ? (
              <CoverImage
                src={heroCoverImage || post.coverImage}
                srcSet={heroCoverSrcSet}
                alt={heroCoverAlt}
                sizes="(min-width: 768px) 720px, (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2.5rem)"
                className="mb-6 sm:mx-0 md:mb-10"
                priority
              />
            ) : null}
            <ProseContent html={content} size="lg" />
            {seriesNavigation &&
            (seriesNavigation.previousPost || seriesNavigation.nextPost) ? (
              <nav
                aria-label={`${seriesNavigation.name} series navigation`}
                className="mt-10 grid gap-6 border-t border-line pt-6 md:grid-cols-2 md:gap-8"
              >
                {seriesNavigation.previousPost ? (
                  <Link
                    href={`/blog/${seriesNavigation.previousPost.slug}/`}
                    className={seriesLinkClassName}
                  >
                    <span className="block text-sm text-muted">
                      Previous part
                    </span>
                    <span className={seriesTitleClassName}>
                      {seriesNavigation.previousPost.title}
                    </span>
                  </Link>
                ) : null}
                {seriesNavigation.nextPost ? (
                  <Link
                    href={`/blog/${seriesNavigation.nextPost.slug}/`}
                    className={`${seriesLinkClassName} md:col-start-2 md:text-right`}
                  >
                    <span className="block text-sm text-muted">Next part</span>
                    <span className={seriesTitleClassName}>
                      {seriesNavigation.nextPost.title}
                    </span>
                  </Link>
                ) : null}
              </nav>
            ) : null}
            {post.tags.length > 0 && (
              <section aria-label="Post tags" className="mt-8 pt-2">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Tag key={`${post.slug}-${tag}`} href={getTagPath(tag)}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </section>
            )}
            <FollowItSubscribeForm
              analyticsPlacement="blog_post"
              className="mt-10"
            />

            {relatedPosts.length > 0 && (
              <section
                aria-labelledby="related-posts-heading"
                className="mt-12 border-t border-line pt-8"
              >
                <h2
                  id="related-posts-heading"
                  className="text-editorial-heading mb-3 text-ink"
                >
                  Related posts
                </h2>
                <WritingList posts={relatedPosts} headingLevel="h3" />
              </section>
            )}
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
