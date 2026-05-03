import { getAllPosts } from "@/lib/blogApi";

const INDEXABLE_TAG_MIN_POST_COUNT = 2;

export type TagEntry = {
  count: number;
  latestModified: string;
  name: string;
  slug: string;
};

function toTagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTagPath(tag: string): string {
  return `/blog/tags/${toTagSlug(tag)}/`;
}

export function getAllTags(): TagEntry[] {
  const posts = getAllPosts(["tags", "date", "updated"]);
  const tagMap = new Map<string, TagEntry>();

  for (const post of posts) {
    const latestModified = post.updated || post.date;

    for (const tag of post.tags) {
      const slug = toTagSlug(tag);
      const existing = tagMap.get(slug);

      if (!existing) {
        tagMap.set(slug, {
          name: tag,
          slug,
          count: 1,
          latestModified,
        });
        continue;
      }

      if (existing.name !== tag) {
        throw new Error(
          `Tag slug collision between "${existing.name}" and "${tag}" for slug "${slug}"`
        );
      }

      existing.count += 1;

      if (
        new Date(latestModified).getTime() >
        new Date(existing.latestModified).getTime()
      ) {
        existing.latestModified = latestModified;
      }
    }
  }

  return [...tagMap.values()];
}

export function isIndexableTag(tag: Pick<TagEntry, "count">): boolean {
  return tag.count >= INDEXABLE_TAG_MIN_POST_COUNT;
}

export function getTagBySlug(tagSlug: string): TagEntry | null {
  return getAllTags().find((tag) => tag.slug === tagSlug) ?? null;
}
