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
  variant?: "standard" | "dense";
  className?: string;
};

export function BlogPostCard({
  post,
  coverPriority = false,
  variant = "standard",
  className = "",
}: BlogPostCardProps) {
  const dense = variant === "dense";
  const cardCoverImage = getCoverVariantPath(post.coverImage, "card");
  const cardCoverSrcSet = getCoverVariantSourceSet(post.coverImage, "card");
  const coverAlt = post.coverAlt || `Cover for ${post.title}`;
  const coverSizes = dense
    ? "(min-width: 768px) 144px, 96px"
    : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";
  const surfaceClasses = dense ? "mb-0 p-4" : "mb-8 p-6";
  const contentLayoutClasses = dense
    ? "grid grid-cols-[6rem_minmax(0,1fr)] gap-4 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-5"
    : "block";
  const imageWrapperClasses = dense ? "" : "mb-5";
  const imageClassName = dense ? "" : "mb-4";
  const titleClassName = dense
    ? "mb-1 text-lg font-semibold md:text-xl"
    : "mb-3 text-2xl font-bold";
  const dateClassName = dense
    ? "mb-2 text-xs text-muted md:text-sm"
    : "mb-4 text-sm text-muted";
  const excerptClassName = dense
    ? "hidden text-sm leading-relaxed text-muted md:line-clamp-2 md:block"
    : "text-base leading-relaxed text-muted";
  const readPostClassName = dense
    ? "mt-3 hidden items-center gap-2 text-sm font-semibold text-accent-link transition-colors group-hover:text-accent-link-hover group-focus-within:text-accent-link-hover md:inline-flex"
    : "mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-link transition-colors group-hover:text-accent-link-hover group-focus-within:text-accent-link-hover";
  const tagContainerClassName = dense
    ? "relative z-20 mt-3 hidden flex-wrap gap-2 md:flex"
    : "relative z-20 mt-4 flex flex-wrap gap-2";
  const visibleTags = dense ? post.tags.slice(0, 2) : post.tags;

  return (
    <Surface
      element="article"
      interactive
      className={`group relative focus-within:border-accent-link/50 focus-within:-translate-y-0.5 focus-within:bg-white focus-within:shadow-md ${surfaceClasses} ${className}`.trim()}
    >
      <Link
        href={`/blog/${post.slug}/`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        aria-label={post.title}
      />
      <div className={`pointer-events-none relative ${contentLayoutClasses}`}>
        <div className={imageWrapperClasses}>
          <CoverImage
            src={cardCoverImage || post.coverImage}
            srcSet={cardCoverSrcSet}
            alt={coverAlt}
            variant="card"
            sizes={coverSizes}
            priority={coverPriority}
            compactOnMobile={dense}
            thumbnail={dense}
            className={imageClassName}
            imageClassName="transition-opacity duration-200 group-hover:opacity-90 group-focus-within:opacity-90"
          />
        </div>
        <div>
          <h2
            className={`leading-snug text-ink transition-colors group-hover:text-accent-link-hover group-focus-within:text-accent-link-hover ${titleClassName}`}
          >
            {post.title}
          </h2>
          <div className={dateClassName}>
            {formatIsoDateForDisplay(post.date)}
          </div>
          {post.excerpt ? (
            <p className={excerptClassName}>
              <ExcerptText text={post.excerpt} />
            </p>
          ) : null}
          <span className={readPostClassName}>
            Read post
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 ease-expo-out group-hover:translate-x-1 group-focus-within:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </div>
      {visibleTags.length > 0 && (
        <div className={tagContainerClassName}>
          {visibleTags.map((tag) => (
            <Tag key={`${post.slug}-${tag}`} href={getTagPath(tag)}>
              {tag}
            </Tag>
          ))}
        </div>
      )}
    </Surface>
  );
}
