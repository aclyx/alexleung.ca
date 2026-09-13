import Link from "next/link";

import { ExcerptText } from "@/components/ExcerptText";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { formatIsoDateForDisplay } from "@/lib/date";

type LatestWritingPost = {
  date: string;
  excerpt?: string;
  slug: string;
  tags?: string[];
  title: string;
};

type LatestWritingSectionProps = {
  posts: LatestWritingPost[];
  id?: string;
  title?: string;
  ctaLabel?: string;
};

export function LatestWritingSection({
  posts,
  id = "writing",
  title = "Latest writing",
  ctaLabel = "See all posts",
}: LatestWritingSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer
      element="section"
      className="border-t border-line py-16 md:py-24"
    >
      <div id={id} className="grid gap-8 md:grid-cols-[15rem_minmax(0,1fr)]">
        <SectionHeading eyebrow="Notes and essays" title={title} />
        <div>
          <div className="border-b border-line">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}/`}
                className="group grid min-h-11 gap-3 border-t border-line py-5 transition-colors hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper md:grid-cols-[8rem_minmax(0,1fr)_auto] md:items-start md:gap-5"
              >
                <time className="text-sm text-muted" dateTime={post.date}>
                  {formatIsoDateForDisplay(post.date)}
                </time>
                <div>
                  <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-accent-link-hover group-focus-visible:text-accent-link-hover">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      <ExcerptText text={post.excerpt} />
                    </p>
                  ) : null}
                </div>
                <span
                  aria-hidden="true"
                  className="hidden translate-x-0 text-lg text-accent-link transition-transform duration-200 ease-expo-out group-hover:translate-x-1 group-focus-visible:translate-x-1 md:block"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/blog/"
            className="link-arrow mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-accent-link underline decoration-accent-link/35 underline-offset-4 hover:text-accent-link-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
          >
            {ctaLabel} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
