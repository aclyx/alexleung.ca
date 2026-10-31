import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionPage, ItemList } from "schema-dts";

import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { LinkText } from "@/components/LinkText";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { WritingList } from "@/components/WritingList";
import { getAllPosts } from "@/lib/blogApi";
import {
  buildBlogCollectionPageSchema,
  buildBlogItemListSchema,
  buildPageMetadata,
  toAbsoluteUrl,
} from "@/lib/seo";
import {
  getAllTags,
  getTagBySlug,
  getTagPath,
  isIndexableTag,
  type TagEntry,
} from "@/lib/tags";

export const dynamicParams = false;

type Props = {
  params: Promise<{
    tag: string;
  }>;
};

function getPostsForTag(tagName: string) {
  return getAllPosts([
    "title",
    "date",
    "slug",
    "coverImage",
    "coverAlt",
    "excerpt",
    "tags",
  ]).filter((post) => post.tags.includes(tagName));
}

const TAG_DESCRIPTIONS: Record<string, string> = {
  ai: "Notes on coding agents, AI-assisted projects, and questions about AI’s future.",
  architecture:
    "How this site is put together: Markdown files in the repository, build-time image variants, and a static export to GitHub Pages.",
  "book-notes":
    "Reading notes from technical books, such as Goodfellow, Bengio, and Courville’s Deep Learning.",
  "deep-learning":
    "Notes on neural networks from Goodfellow, Bengio, and Courville’s Deep Learning.",
  "developer-workflow":
    "Notes on coding agents, code review, and build tooling for repeated development work.",
  learning:
    "Notes on revisiting subjects from coursework and earlier work by building small browser tools.",
  lifestyle:
    "Personal notes on moving, travel, backpacking, and the everyday gear that goes with them.",
  "next-js":
    "The Next.js side of this static site: generated routes, static export, and build-time metadata.",
  reflection:
    "Personal notes on moving, trips, old interests, and how I think about AI.",
  regularization:
    "Notes on dropout, shared parameters, and model averaging as regularization mechanisms.",
  review:
    "Hands-on notes on the 11-inch iPad Air for reading, annotation, and remote access.",
};

function getTagDescription(tag: TagEntry): string {
  if (tag.count === 0) {
    return "There are no listed posts in this topic. Browse all writing for current posts.";
  }

  return TAG_DESCRIPTIONS[tag.slug] ?? `Posts about ${tag.name}.`;
}

export function generateStaticParams() {
  return getAllTags({ includeEmpty: true }).map((tag) => ({
    tag: tag.slug,
  }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const tag = getTagBySlug(params.tag);

  if (!tag) {
    return notFound();
  }

  const posts = getPostsForTag(tag.name);
  const firstCoverImage = posts.find((post) => post.coverImage)?.coverImage;
  const description = getTagDescription(tag);
  const metadata = buildPageMetadata({
    title: `${tag.name} | Alex Leung`,
    description,
    path: getTagPath(tag.name),
    images: firstCoverImage
      ? [
          {
            url: toAbsoluteUrl(firstCoverImage),
          },
        ]
      : undefined,
  });

  return isIndexableTag(tag)
    ? metadata
    : {
        ...metadata,
        robots: { index: false, follow: true },
      };
}

export default async function TagArchivePage({ params }: Props) {
  const awaitedParams = await params;
  const tag = getTagBySlug(awaitedParams.tag);

  if (!tag) {
    return notFound();
  }

  const posts = getPostsForTag(tag.name);
  const path = getTagPath(tag.name);
  const description = getTagDescription(tag);

  return (
    <>
      <JsonLdBreadcrumbs
        items={[
          { name: "Home", item: "/" },
          { name: "Writing", item: "/blog/" },
          { name: tag.name, item: path },
        ]}
      />
      <JsonLd<CollectionPage>
        item={buildBlogCollectionPageSchema({
          path,
          title: `${tag.name} | Alex Leung`,
          description,
        })}
      />
      <JsonLd<ItemList>
        item={buildBlogItemListSchema(
          posts.map((post) => ({ slug: post.slug, title: post.title })),
          path
        )}
      />

      <PageShell
        title={tag.name}
        titleId={`tag-${tag.slug}`}
        eyebrow={
          <LinkText href="/blog/" standalone>
            <span className="font-normal normal-case tracking-normal">
              <span aria-hidden="true">←&nbsp;</span>All writing
            </span>
          </LinkText>
        }
        description={description}
        metadata={`${tag.count} ${tag.count === 1 ? "post" : "posts"}`}
      >
        <ResponsiveContainer>
          <WritingList posts={posts} />
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
