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
    "excerpt",
    "tags",
  ]).filter((post) => post.tags.includes(tagName));
}

const TAG_DESCRIPTIONS: Record<string, string> = {
  ai: "Posts about AI tools, coding agents, creativity, and how software work changes when rough prototypes get cheaper.",
  architecture:
    "Notes on software architecture, static site trade-offs, and the small systems that keep this site maintainable.",
  "book-notes":
    "Book notes from Alex Leung, with a focus on deep learning, machine learning foundations, and technical reading.",
  "deep-learning":
    "Posts on deep learning concepts, textbook notes, regularization, and the structural assumptions behind neural networks.",
  "developer-workflow":
    "Notes on developer workflow, AI coding tools, verification loops, and small improvements to the way software gets built.",
  "future-of-work":
    "Reflections on how AI tools change software work, prototyping, review, and who gets to test rough ideas.",
  lifestyle:
    "Personal notes on tools, moving, study routines, and the small practical details around work and life.",
  "ml-theory":
    "Machine learning theory notes on regularization, model structure, optimization, and the reasoning behind familiar techniques.",
  "next-js":
    "Posts about building this Next.js site, including static export, image handling, and practical architecture choices.",
  reflection:
    "Personal reflections on software, AI tools, creativity, learning, and the texture of day-to-day work.",
  review:
    "Short reviews and impressions of books, tools, and devices that changed how I work or learn.",
};

function getTagDescription(tag: TagEntry): string {
  return (
    TAG_DESCRIPTIONS[tag.slug] ??
    `Posts tagged ${tag.name} on Alex Leung's blog.`
  );
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

      <PageShell title={tag.name} titleId={`tag-${tag.slug}`}>
        <ResponsiveContainer variant="wide" className="space-y-8">
          <p className="text-body max-w-3xl text-gray-300">{description}</p>
          <p className="text-body-sm max-w-3xl text-gray-400">
            {tag.count} {tag.count === 1 ? "post" : "posts"} currently filed
            under <strong className="text-white">{tag.name}</strong>.
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
