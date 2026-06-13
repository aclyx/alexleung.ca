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
  className?: string;
};

export function BlogPostCard({
  post,
  coverPriority = false,
  className = "",
}: BlogPostCardProps) {
  const cardCoverImage = getCoverVariantPath(post.coverImage, "card");
  const cardCoverSrcSet = getCoverVariantSourceSet(post.coverImage, "card");
  const coverAlt = post.coverAlt || `Cover for ${post.title}`;

  return (
    <Surface
      element="article"
      interactive
      className={`group mb-8 p-6 ${className}`.trim()}
    >
      <Link
        href={`/blog/${post.slug}/`}
        className="block"
        aria-label={post.title}
      >
        <div className="mb-5">
          <CoverImage
            src={cardCoverImage || post.coverImage}
            srcSet={cardCoverSrcSet}
            alt={coverAlt}
            variant="card"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            priority={coverPriority}
            className="mb-4"
            imageClassName="transition-opacity duration-200 group-hover:opacity-90"
          />
        </div>
        <h2 className="mb-3 text-2xl font-bold leading-snug text-white transition-colors group-hover:text-accent-link">
          {post.title}
        </h2>
        <div className="mb-4 text-sm text-gray-300">
          {formatIsoDateForDisplay(post.date)}
        </div>
        {post.excerpt ? (
          <p className="text-base leading-relaxed text-gray-200 md:text-gray-300">
            <ExcerptText text={post.excerpt} />
          </p>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-link transition-colors group-hover:text-accent-link-hover">
          Read post
          <span aria-hidden="true">→</span>
        </span>
      </Link>
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
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
