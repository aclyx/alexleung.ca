import { JsonLd } from "react-schemaorg";

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionPage, ItemList } from "schema-dts";

import { ExcerptText } from "@/components/ExcerptText";
import { JsonLdBreadcrumbs } from "@/components/JsonLdBreadcrumbs";
import { LinkText } from "@/components/LinkText";
import { PageShell } from "@/components/PageShell";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { getAllPosts } from "@/lib/blogApi";
import {
  getCoverVariantPath,
  getCoverVariantSourceSet,
} from "@/lib/coverVariants";
import { formatIsoDateForDisplay } from "@/lib/date";
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
          <div>
            {posts.map((post) => (
              <article key={post.slug} className="border-t border-line">
                <Link
                  href={`/blog/${post.slug}/`}
                  aria-label={post.title}
                  className="group grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper md:grid-cols-[7rem_minmax(0,1fr)] md:gap-x-6 md:py-6"
                >
                  {post.coverImage ? (
                    <ResponsiveImage
                      src={
                        getCoverVariantPath(post.coverImage, "card") ||
                        post.coverImage
                      }
                      srcSet={getCoverVariantSourceSet(post.coverImage, "card")}
                      alt={post.coverAlt || `Cover for ${post.title}`}
                      width={1200}
                      height={630}
                      sizes="(min-width: 768px) 112px, 80px"
                      loading="lazy"
                      decoding="async"
                      pictureClassName="mt-1 block md:row-span-2"
                      className="aspect-[3/2] w-full object-cover"
                    />
                  ) : null}
                  <div className={post.coverImage ? "" : "col-span-2"}>
                    <time
                      dateTime={post.date}
                      className="font-mono text-xs leading-relaxed text-muted"
                    >
                      {formatIsoDateForDisplay(post.date)}
                    </time>
                    <h2 className="text-editorial-heading mt-2 text-ink group-hover:underline group-hover:decoration-line group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4">
                      {post.title}
                    </h2>
                  </div>
                  {post.excerpt ? (
                    <p
                      className={`text-body-sm col-span-2 leading-relaxed text-muted ${post.coverImage ? "md:col-span-1 md:col-start-2" : ""}`.trim()}
                    >
                      <ExcerptText text={post.excerpt} />
                    </p>
                  ) : null}
                </Link>
              </article>
            ))}
          </div>
        </ResponsiveContainer>
      </PageShell>
    </>
  );
}
