import Link from "next/link";

import { CoverImage } from "@/components/CoverImage";
import { ExcerptText } from "@/components/ExcerptText";
import { Surface } from "@/components/Surface";
import { Tag } from "@/components/Tag";
import { Post } from "@/lib/blogApi";
import {
  getCoverVariantPath,
  getCoverVariantSourceSet,
} from "@/lib/coverVariants";
import { formatIsoDateForDisplay } from "@/lib/date";
import { getTagPath } from "@/lib/tags";

type BlogPostCardProps = {
  post: Pick<
    Post,
    "slug" | "title" | "date" | "coverImage" | "coverAlt" | "excerpt" | "tags"
  >;
  coverPriority?: boolean;
  compactOnMobile?: boolean;
  className?: string;
};

export function BlogPostCard({
  post,
  coverPriority = false,
  compactOnMobile = false,
  className = "",
}: BlogPostCardProps) {
  const cardCoverImage = getCoverVariantPath(post.coverImage, "card");
  const cardCoverSrcSet = getCoverVariantSourceSet(post.coverImage, "card");
  const coverAlt = post.coverAlt || `Cover for ${post.title}`;

  return (
    <Surface
      element="article"
      interactive
      className={`group relative ${
        compactOnMobile ? "mb-3 p-4 md:mb-8 md:p-6" : "mb-8 p-6"
      } ${className}`.trim()}
    >
      <Link
        href={`/blog/${post.slug}/`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        aria-label={post.title}
      />
      <div
        className={`pointer-events-none relative ${
          compactOnMobile
            ? "grid grid-cols-[6rem_minmax(0,1fr)] gap-4 md:block"
            : "block"
        }`}
      >
        <div className={compactOnMobile ? "md:mb-5" : "mb-5"}>
          <CoverImage
            src={cardCoverImage || post.coverImage}
            srcSet={cardCoverSrcSet}
            alt={coverAlt}
            variant="card"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            priority={coverPriority}
            compactOnMobile={compactOnMobile}
            className={compactOnMobile ? "md:mb-4" : "mb-4"}
            imageClassName="transition-opacity duration-200 group-hover:opacity-90"
          />
        </div>
        <div>
          <h2
            className={`leading-snug text-white transition-colors group-hover:text-accent-link ${
              compactOnMobile
                ? "mb-1 text-lg font-semibold md:mb-3 md:text-2xl md:font-bold"
                : "mb-3 text-2xl font-bold"
            }`}
          >
            {post.title}
          </h2>
          <div
            className={
              compactOnMobile
                ? "mb-0 text-xs text-gray-300 md:mb-4 md:text-sm"
                : "mb-4 text-sm text-gray-300"
            }
          >
            {formatIsoDateForDisplay(post.date)}
          </div>
          {post.excerpt ? (
            <p
              className={
                compactOnMobile
                  ? "hidden text-base leading-relaxed text-gray-300 md:block"
                  : "text-base leading-relaxed text-gray-200 md:text-gray-300"
              }
            >
              <ExcerptText text={post.excerpt} />
            </p>
          ) : null}
          <span
            className={
              compactOnMobile
                ? "mt-4 hidden items-center gap-2 text-sm font-semibold text-accent-link transition-colors group-hover:text-accent-link-hover md:inline-flex"
                : "mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-link transition-colors group-hover:text-accent-link-hover"
            }
          >
            Read post
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
      {post.tags.length > 0 && (
        <div
          className={
            compactOnMobile
              ? "relative z-20 mt-4 hidden flex-wrap gap-2 md:flex"
              : "relative z-20 mt-4 flex flex-wrap gap-2"
          }
        >
          {post.tags.map((tag) => (
            <Tag key={`${post.slug}-${tag}`} href={getTagPath(tag)}>
              {tag}
            </Tag>
          ))}
        </div>
      )}
    </Surface>
  );
}
