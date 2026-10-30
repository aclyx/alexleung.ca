import Link from "next/link";

import { ExcerptText } from "@/components/ExcerptText";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import type { Post } from "@/lib/blogApi";
import {
  getCoverVariantPath,
  getCoverVariantSourceSet,
} from "@/lib/coverVariants";
import { formatIsoDateForDisplay } from "@/lib/date";

type WritingListPost = Pick<Post, "slug" | "title" | "date" | "excerpt"> &
  Partial<Pick<Post, "coverImage">>;

type WritingListProps = {
  posts: WritingListPost[];
  headingLevel?: "h2" | "h3";
  className?: string;
};

// One row shape for every post list: date, title, excerpt, and a small cover.
// Mobile stacks the date above a title-and-thumbnail line with the excerpt
// spanning the full row; md and up moves the date and cover into side columns.
export function WritingList({
  posts,
  headingLevel = "h2",
  className = "",
}: WritingListProps) {
  const Heading = headingLevel;

  return (
    <div className={className}>
      {posts.map((post) => (
        <article
          key={post.slug}
          className="border-t border-line first:border-t-0"
        >
          <Link
            href={`/blog/${post.slug}/`}
            aria-label={post.title}
            className="group grid grid-cols-[minmax(0,1fr)_5rem] gap-x-4 gap-y-2 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper md:grid-cols-[8.5rem_minmax(0,1fr)_9rem] md:gap-x-6 md:py-6"
          >
            <time
              dateTime={post.date}
              className="col-span-2 font-mono text-xs leading-relaxed text-muted md:col-span-1 md:row-span-2 md:pt-1.5"
            >
              {formatIsoDateForDisplay(post.date)}
            </time>
            <Heading
              className={`text-editorial-heading text-ink group-hover:underline group-hover:decoration-line group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4 ${post.coverImage ? "" : "col-span-2 md:col-span-1"}`.trim()}
            >
              {post.title}
            </Heading>
            {post.coverImage ? (
              <ResponsiveImage
                src={
                  getCoverVariantPath(post.coverImage, "card") ||
                  post.coverImage
                }
                srcSet={getCoverVariantSourceSet(post.coverImage, "card")}
                alt=""
                width={1200}
                height={800}
                sizes="(min-width: 768px) 144px, 80px"
                loading="lazy"
                decoding="async"
                pictureClassName="col-start-2 row-start-2 block md:col-start-3 md:row-span-2 md:row-start-1"
                className="aspect-[3/2] w-full rounded-md object-cover"
              />
            ) : null}
            {post.excerpt ? (
              <p className="text-body-sm col-span-2 leading-relaxed text-muted md:col-span-1 md:col-start-2">
                <ExcerptText text={post.excerpt} />
              </p>
            ) : null}
          </Link>
        </article>
      ))}
    </div>
  );
}
