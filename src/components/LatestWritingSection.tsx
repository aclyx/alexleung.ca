import { HiOutlineArrowRight } from "react-icons/hi";

import Link from "next/link";

import { ExcerptText } from "@/components/ExcerptText";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SectionBlock } from "@/components/SectionBlock";
import { Surface } from "@/components/Surface";
import { formatIsoDateForDisplay } from "@/lib/date";

type LatestWritingPost = {
  date: string;
  excerpt?: string;
  slug: string;
  title: string;
};

type LatestWritingSectionProps = {
  posts: LatestWritingPost[];
  title?: string;
  ctaLabel?: string;
};

export function LatestWritingSection({
  posts,
  title = "Latest Writing",
  ctaLabel = "See all posts",
}: LatestWritingSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer element="section" className="pb-12">
      <SectionBlock title={title} spacing="lg">
        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="block"
            >
              <Surface
                className="h-full p-4 transition-colors hover:border-white/30"
                interactive
              >
                <h3 className="text-heading-sm font-semibold text-white">
                  {post.title}
                </h3>
                <p className="text-body-sm mt-2 text-gray-300">
                  {formatIsoDateForDisplay(post.date)}
                </p>
                {post.excerpt ? (
                  <p className="text-body-sm mt-3 text-gray-200">
                    <ExcerptText text={post.excerpt} />
                  </p>
                ) : null}
              </Surface>
            </Link>
          ))}
        </div>
        <div>
          <Link
            href="/blog/"
            className="text-body -ml-3 inline-flex min-h-11 items-center gap-2 rounded-md px-3 font-semibold text-accent-link transition-colors hover:text-accent-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {ctaLabel}
            <HiOutlineArrowRight aria-hidden="true" className="text-lg" />
          </Link>
        </div>
      </SectionBlock>
    </ResponsiveContainer>
  );
}
