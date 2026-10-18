import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";

import { CollectionPage, ItemList } from "schema-dts";

import {
  TopicRevealList,
  type TopicLink,
} from "@/app/blog/_components/TopicRevealList";
import {
  DisclosureIndicator,
  disclosureSummaryClassNames,
} from "@/components/Disclosure";
import { FollowItSubscribeForm } from "@/components/FollowItSubscribeForm";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Tag } from "@/components/Tag";
import { WritingList } from "@/components/WritingList";
import { getAllPosts, getSeriesSummaries } from "@/lib/blogApi";
import { getCoverVariant } from "@/lib/coverVariants";
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

const title = "Writing | Alex Leung";
const description =
  "Essays and notes on software, AI tools, technical books, and life outside work.";
const path = "/blog";

function SeriesLinks({
  seriesSummaries,
}: {
  seriesSummaries: ReturnType<typeof getSeriesSummaries>;
}) {
  if (seriesSummaries.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        Series
      </h2>
      <div className="flex flex-wrap gap-2">
        {seriesSummaries.map((series) => (
          <Tag key={series.name} href={`/blog/${series.firstPost.slug}/`}>
            {series.name}
          </Tag>
        ))}
      </div>
    </div>
  );
}

export function generateMetadata(): Metadata {
  const firstCoverPost = getAllPosts(["coverImage", "coverAlt", "title"]).find(
    (post) => post.coverImage
  );
  const metadataCoverImage = getCoverVariant(
    firstCoverPost?.coverImage,
    "hero"
  );
  const metadataImage = firstCoverPost?.coverImage
    ? {
        url: metadataCoverImage?.path || firstCoverPost.coverImage,
        alt: firstCoverPost.coverAlt || `Cover for ${firstCoverPost.title}`,
        ...(metadataCoverImage
          ? {
              width: metadataCoverImage.width,
              height: metadataCoverImage.height,
            }
          : {}),
      }
    : undefined;

  return buildPageMetadata({
    title,
    description,
    path,
    images: metadataImage ? [metadataImage] : undefined,
  });
}

export default function BlogIndex() {
  const allPosts = getAllPosts(["title", "date", "slug", "excerpt"]);
  const topics: TopicLink[] = sortTagsByPopularity(
    getAllTags().filter(isIndexableTag)
  ).map((topic) => ({
    name: topic.name,
    href: getTagPath(topic.name),
  }));
  const seriesSummaries = getSeriesSummaries();

  return (
    <>
      <PageShell
        title="Writing"
        titleId="writing"
        description="Software, AI tools, technical books, and life outside work."
        metadata={
          <details className="group border-y border-line text-left">
            <summary className={disclosureSummaryClassNames()}>
              <span>Browse topics and series</span>
              <DisclosureIndicator />
            </summary>
            <div className="space-y-4 border-t border-line px-4 py-4">
              <TopicRevealList topics={topics} />
              <SeriesLinks seriesSummaries={seriesSummaries} />
            </div>
          </details>
        }
      >
        <ResponsiveContainer className="space-y-8 md:space-y-10">
          <WritingList posts={allPosts} />
          <FollowItSubscribeForm
            analyticsPlacement="blog_index"
            className="my-6"
          />
        </ResponsiveContainer>
      </PageShell>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "Writing", item: "/blog" },
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
