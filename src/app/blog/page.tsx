import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { CollectionPage, ItemList } from "schema-dts";

import { BlogPostCard } from "@/components/BlogPostCard";
import { FollowItSubscribeForm } from "@/components/FollowItSubscribeForm";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Tag } from "@/components/Tag";
import { getAllPosts, getSeriesSummaries } from "@/lib/blogApi";
import {
  buildBlogCollectionPageSchema,
  buildBlogItemListSchema,
  buildPageMetadata,
  toAbsoluteUrl,
} from "@/lib/seo";
import { getAllTags, getTagPath, isIndexableTag } from "@/lib/tags";

const title = "Blog | Alex Leung";
const description =
  "Notes on software systems, AI tools, learning, and small experiments.";
const path = "/blog";

export function generateMetadata(): Metadata {
  const posts = getAllPosts(["coverImage"]);
  const firstCoverImage = posts.find((post) => post.coverImage)?.coverImage;

  return buildPageMetadata({
    title,
    description,
    path,
    images: firstCoverImage
      ? [
          {
            url: toAbsoluteUrl(firstCoverImage),
          },
        ]
      : undefined,
  });
}

export default function BlogIndex() {
  const allPosts = getAllPosts([
    "title",
    "date",
    "slug",
    "coverImage",
    "excerpt",
    "tags",
  ]);
  const [firstPost, ...remainingPosts] = allPosts;
  const topics = getAllTags().filter(isIndexableTag);
  const seriesSummaries = getSeriesSummaries();

  return (
    <>
      <PageShell title="Blog">
        <ResponsiveContainer variant="wide" className="space-y-8">
          <section
            aria-labelledby="blog-orientation-heading"
            className="max-w-3xl space-y-5"
          >
            <div className="space-y-2">
              <h2
                id="blog-orientation-heading"
                className="text-heading-sm text-white"
              >
                Notes from the workbench
              </h2>
              <p className="text-body text-gray-200">
                I write here when a tool, system, book, or small experiment
                changes how I think about building software.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {topics.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <Tag key={topic.slug} href={getTagPath(topic.name)}>
                        {topic.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              ) : null}
              {seriesSummaries.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">
                    Series
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {seriesSummaries.map((series) => (
                      <Tag
                        key={series.name}
                        href={`/blog/${series.firstPost.slug}/`}
                      >
                        {series.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {firstPost ? (
              <BlogPostCard
                key={firstPost.slug}
                post={firstPost}
                coverPriority
              />
            ) : null}
            {remainingPosts.map((post) => (
              <BlogPostCard
                key={post.slug}
                post={post}
                className="[content-visibility:auto] [contain-intrinsic-size:520px]"
              />
            ))}
          </div>
          <FollowItSubscribeForm
            analyticsPlacement="blog_index"
            className="my-6"
          />
        </ResponsiveContainer>
      </PageShell>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "Blog", item: "/blog" },
        ]}
      />
      <JsonLd<CollectionPage>
        item={buildBlogCollectionPageSchema({ path, title, description })}
      />
      <JsonLd<ItemList>
        item={buildBlogItemListSchema(
          allPosts.map((post) => ({ slug: post.slug, title: post.title }))
        )}
      />
    </>
  );
}
