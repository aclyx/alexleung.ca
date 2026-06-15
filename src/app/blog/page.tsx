import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { CollectionPage, ItemList } from "schema-dts";

import {
  TopicRevealList,
  type TopicLink,
} from "@/app/blog/_components/TopicRevealList";
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
} from "@/lib/seo";
import {
  getAllTags,
  getTagPath,
  isIndexableTag,
  sortTagsByPopularity,
} from "@/lib/tags";

const title = "Blog | Alex Leung";
const description =
  "Notes on software systems, AI-assisted coding, deep learning, Next.js static sites, and small browser experiments.";
const path = "/blog";

export function generateMetadata(): Metadata {
  const firstCoverPost = getAllPosts(["coverImage", "coverAlt", "title"]).find(
    (post) => post.coverImage
  );

  return buildPageMetadata({
    title,
    description,
    path,
    images: firstCoverPost?.coverImage
      ? [
          {
            url: firstCoverPost.coverImage,
            alt: firstCoverPost.coverAlt || `Cover for ${firstCoverPost.title}`,
            width: 1200,
            height: 630,
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
    "coverAlt",
    "excerpt",
    "tags",
  ]);
  const [firstPost, ...remainingPosts] = allPosts;
  const topics: TopicLink[] = sortTagsByPopularity(
    getAllTags().filter(isIndexableTag)
  ).map((topic) => ({
    name: topic.name,
    href: getTagPath(topic.name),
  }));
  const seriesSummaries = getSeriesSummaries();

  return (
    <>
      <PageShell title="Blog">
        <ResponsiveContainer variant="wide" className="space-y-8">
          <section
            aria-label="Blog overview"
            className="mx-auto max-w-5xl space-y-4 text-left md:text-center"
          >
            <p className="mx-auto max-w-2xl text-body text-gray-200">
              Software systems, AI-assisted coding, deep learning, and browser
              experiments.
            </p>
            <div className="space-y-3">
              <TopicRevealList topics={topics} />
              {seriesSummaries.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">
                    Series
                  </h3>
                  <div className="flex flex-wrap gap-2 md:justify-center">
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {firstPost ? (
              <BlogPostCard
                key={firstPost.slug}
                post={firstPost}
                coverPriority
              />
            ) : null}
            {remainingPosts.map((post) => (
              <BlogPostCard key={post.slug} post={post} compactOnMobile />
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
