import Link from "next/link";

import { ExcerptText } from "@/components/ExcerptText";
import type { Post } from "@/lib/blogApi";
import { formatIsoDateForDisplay } from "@/lib/date";

type WritingListProps = {
  posts: Pick<Post, "slug" | "title" | "date" | "excerpt">[];
  variant?: "archive" | "selected";
  headingLevel?: "h2" | "h3";
  className?: string;
};

export function WritingList({
  posts,
  variant = "archive",
  headingLevel = "h2",
  className = "",
}: WritingListProps) {
  const Heading = headingLevel;
  const archive = variant === "archive";

  return (
    <div className={className}>
      {posts.map((post) => (
        <article
          key={post.slug}
          className={
            archive
              ? "border-t border-line"
              : "border-b border-line last:border-b-0"
          }
        >
          <Link
            href={`/blog/${post.slug}/`}
            aria-label={post.title}
            className={`group grid gap-2.5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper ${archive ? "md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6 md:py-6" : ""}`.trim()}
          >
            <time
              dateTime={post.date}
              className={`font-mono text-xs leading-relaxed text-muted ${archive ? "md:pt-1.5" : ""}`.trim()}
            >
              {formatIsoDateForDisplay(post.date)}
            </time>
            <div>
              <Heading className="text-editorial-heading text-ink group-hover:underline group-hover:decoration-line group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4">
                {post.title}
              </Heading>
              {post.excerpt ? (
                <p className="text-body-sm mt-2 leading-relaxed text-muted">
                  <ExcerptText text={post.excerpt} />
                </p>
              ) : null}
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
