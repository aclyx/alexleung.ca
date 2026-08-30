import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionPage, ItemList } from "schema-dts";

import { BlogPostCard } from "@/components/BlogPostCard";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
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
  ai: "Posts on coding agents, AI-assisted prototypes, and using generative tools to edit software and explore visuals.",
  architecture:
    "How this static Next.js site stores Markdown, generates responsive images, and keeps build-time conventions in one place.",
  "book-notes":
    "Notes on the mathematical foundations, network structure, and regularization sections of Deep Learning.",
  "deep-learning":
    "Notes on the mathematics, feedforward networks, and regularization mechanisms in Goodfellow, Bengio, and Courville's Deep Learning.",
  "developer-workflow":
    "Posts on software tooling, coding agents, verification, and systems that make repeated development work easier to maintain.",
  lifestyle:
    "Notes on moving to San Francisco, traveling through southern Utah, and using an iPad for study and remote access.",
  "ml-theory":
    "Notes on representation, optimization, and regularization in neural networks.",
  "next-js":
    "How this static Next.js site handles Markdown posts, generated image variants, and build-time metadata.",
  reflection:
    "Personal notes on moving and travel, alongside reflections on coding agents, prototypes, and visual tools.",
  regularization:
    "Notes on dropout, shared parameters, and model averaging as regularization mechanisms.",
  review:
    "Hands-on notes on the 11-inch iPad Air for reading, annotation, and remote access.",
};

function getTagDescription(tag: TagEntry): string {
  return TAG_DESCRIPTIONS[tag.slug] ?? `Posts about ${tag.name}.`;
}

export function generateStaticParams() {
  return getAllTags().map((tag) => ({
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
          { name: "Blog", item: "/blog/" },
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
        description={description}
        metadata={`${tag.count} ${tag.count === 1 ? "post" : "posts"}`}
      >
        <ResponsiveContainer className="space-y-8">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} variant="dense" />
            ))}
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
