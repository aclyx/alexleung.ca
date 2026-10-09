import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Article, BlogPosting } from "schema-dts";

import { CoverImage } from "@/components/CoverImage";
import { FollowItSubscribeForm } from "@/components/FollowItSubscribeForm";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ProseContent } from "@/components/ProseContent";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Tag } from "@/components/Tag";
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
  buildArticleSchema,
  buildBlogPostingSchema,
  buildPageMetadata,
  toCanonical,
} from "@/lib/seo";
import { getTagPath } from "@/lib/tags";

import { BlogPostAnalytics } from "./_components/BlogPostAnalytics";
import { ReadingProgress } from "./_components/ReadingProgress";

export const dynamicParams = false;

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
  const posts = getAllPosts(["slug"]);

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
      <JsonLd<Article>
        item={buildArticleSchema({
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <time dateTime={post.date}>
              Published {formatIsoDateForDisplay(post.date)}
            </time>
            {post.updated && post.updated !== post.date ? (
              <time dateTime={post.updated}>
                Updated {formatIsoDateForDisplay(post.updated)}
              </time>
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
            {seriesNavigation ? (
              <nav
                aria-label={`${seriesNavigation.name} series navigation`}
                className="mb-6 border-y border-line py-4"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-muted">
                  {seriesNavigation.name}
                </p>
                <p className="mt-1 text-body-sm text-ink">
                  Part {seriesNavigation.currentPart} of{" "}
                  {seriesNavigation.totalParts}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {seriesNavigation.previousPost ? (
                    <Link
                      href={`/blog/${seriesNavigation.previousPost.slug}/`}
                      className="text-body-sm text-accent-link transition-colors hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                    >
                      <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                        Previous
                      </span>
                      {seriesNavigation.previousPost.title}
                    </Link>
                  ) : (
                    <span />
                  )}
                  {seriesNavigation.nextPost ? (
                    <Link
                      href={`/blog/${seriesNavigation.nextPost.slug}/`}
                      className="text-body-sm text-accent-link transition-colors hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper md:text-right"
                    >
                      <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                        Next
                      </span>
                      {seriesNavigation.nextPost.title}
                    </Link>
                  ) : null}
                </div>
              </nav>
            ) : null}
            <CoverImage
              src={heroCoverImage || post.coverImage}
              srcSet={heroCoverSrcSet}
              alt={heroCoverAlt}
              variant="hero"
              sizes="(min-width: 1024px) 896px, 100vw"
              className="mb-6 sm:mx-0 md:mb-10"
            />
            <ProseContent html={content} size="lg" />
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
                <div className="divide-y divide-line">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/blog/${relatedPost.slug}/`}
                      aria-label={relatedPost.title}
                      className="group block py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                    >
                      <h3 className="text-body-lg font-serif leading-snug text-ink group-hover:underline group-hover:decoration-line group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4">
                        {relatedPost.title}
                      </h3>
                      <time
                        dateTime={relatedPost.date}
                        className="mt-1 block font-mono text-xs leading-relaxed text-muted"
                      >
                        {formatIsoDateForDisplay(relatedPost.date)}
                      </time>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
