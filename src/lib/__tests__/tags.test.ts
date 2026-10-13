import { getAllPosts } from "../blogApi";
import {
  getAllTags,
  getTagBySlug,
  isIndexableTag,
  sortTagsByPopularity,
} from "../tags";

jest.mock("../blogApi", () => ({ getAllPosts: jest.fn() }));

describe("unlisted post tags", () => {
  beforeEach(() => {
    const posts = [
      {
        slug: "unlisted",
        title: "Unlisted",
        date: "2026-02-17T00:00:00.000Z",
        tags: ["AI", "Retired Topic"],
        unlisted: true,
        draft: false,
        content: "",
      },
      {
        slug: "listed",
        title: "Listed",
        date: "2026-02-16T00:00:00.000Z",
        tags: ["AI"],
        unlisted: false,
        draft: false,
        content: "",
      },
    ];
    jest
      .mocked(getAllPosts)
      .mockImplementation((_fields, options) =>
        posts.filter((post) => options?.includeUnlisted || !post.unlisted)
      );
  });

  it("counts only listed posts and leaves empty topics out of discovery", () => {
    expect(getAllTags()).toEqual([
      {
        name: "AI",
        slug: "ai",
        count: 1,
        latestModified: "2026-02-16T00:00:00.000Z",
      },
    ]);
    expect(getTagBySlug("ai")).toEqual(getAllTags()[0]);
  });

  it("preserves empty tag URLs without making them indexable", () => {
    const tag = getTagBySlug("retired-topic");
    expect(tag).toMatchObject({ name: "Retired Topic", count: 0 });
    expect(getAllTags({ includeEmpty: true })).toContainEqual(tag);
    expect(isIndexableTag(tag!)).toBe(false);
    expect(getTagBySlug("unknown-topic")).toBeNull();
  });
});

describe("sortTagsByPopularity", () => {
  it("orders tags by count descending and name ascending", () => {
    const tags = [
      { name: "Review", count: 2 },
      { name: "AI", count: 4 },
      { name: "Book Notes", count: 3 },
      { name: "Architecture", count: 2 },
    ];

    expect(sortTagsByPopularity(tags)).toEqual([
      { name: "AI", count: 4 },
      { name: "Book Notes", count: 3 },
      { name: "Architecture", count: 2 },
      { name: "Review", count: 2 },
    ]);
    expect(tags[0]).toEqual({ name: "Review", count: 2 });
  });
});
