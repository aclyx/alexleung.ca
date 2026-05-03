import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Article, BlogPosting } from "schema-dts";

import { CoverImage } from "@/components/CoverImage";
import { ExcerptText } from "@/components/ExcerptText";
import { FollowItSubscribeForm } from "@/components/FollowItSubscribeForm";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ProseContent } from "@/components/ProseContent";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Surface } from "@/components/Surface";
import { Tag } from "@/components/Tag";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blogApi";
import {
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

export const dynamicParams = false;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params_awaited = await props.params;
  const post = getPostBySlug(params_awaited.slug, [
    "title",
    "excerpt",
    "coverImage",
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

  const metadata = buildPageMetadata({
    title,
    description,
    path,
    type: "article",
    images: post.coverImage
      ? [
          {
            url: post.coverImage,
          },
        ]
      : undefined,
  });

  return {
    ...metadata,
    authors: [{ name: "Alex Leung", url: toCanonical("/about") }],
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
    "excerpt",
    "tags",
  ]);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");
  const relatedPosts = getRelatedPosts(post.slug, { limit: 3 });
  const heroCoverImage = getCoverVariantPath(post.coverImage, "hero");
  const heroCoverSrcSet = getCoverVariantSourceSet(post.coverImage, "hero");

  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "Blog", item: "/blog" },
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
      <PageShell title={post.title}>
        <ResponsiveContainer
          element="article"
          variant="prose"
          className="mb-12"
        >
          <Surface className="mx-auto" padding="sm">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-lg text-gray-300">
              <time dateTime={post.date}>
                Published {formatIsoDateForDisplay(post.date)}
              </time>
              {post.updated && post.updated !== post.date && (
                <time dateTime={post.updated}>
                  Updated {formatIsoDateForDisplay(post.updated)}
                </time>
              )}
            </div>
            <CoverImage
              src={heroCoverImage || post.coverImage}
              srcSet={heroCoverSrcSet}
              alt={`Cover for ${post.title}`}
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
                className="mt-12 border-t border-white/10 pt-8"
              >
                <h2
                  id="related-posts-heading"
                  className="mb-5 text-2xl font-bold text-white"
                >
                  Related posts
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/blog/${relatedPost.slug}/`}
                      className="block"
                    >
                      <Surface
                        className="h-full p-4 transition-colors hover:border-white/30"
                        interactive
                      >
                        <h3 className="text-base font-semibold text-white">
                          {relatedPost.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-300">
                          {formatIsoDateForDisplay(relatedPost.date)}
                        </p>
                        {relatedPost.excerpt ? (
                          <p className="mt-2 line-clamp-3 text-sm text-gray-200">
                            <ExcerptText text={relatedPost.excerpt} />
                          </p>
                        ) : null}
                      </Surface>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </Surface>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
