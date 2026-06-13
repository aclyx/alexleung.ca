import fs from "fs";
import os from "os";
import path from "path";

type NodeEnv = "development" | "production" | "test";

function setupTempPosts(markdownBySlug: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-api-test-"));
  const postsDir = path.join(tempDir, "content", "posts");

  fs.mkdirSync(postsDir, { recursive: true });

  Object.entries(markdownBySlug).forEach(([slug, markdown]) => {
    fs.writeFileSync(path.join(postsDir, `${slug}.md`), markdown, "utf8");
  });

  return tempDir;
}

async function loadBlogApiAtCwd(cwd: string, options?: { nodeEnv?: NodeEnv }) {
  jest.resetModules();
  const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue(cwd);
  const envSpy = jest.replaceProperty(process, "env", {
    ...process.env,
    NODE_ENV: options?.nodeEnv ?? process.env.NODE_ENV ?? "test",
  });

  try {
    const blogApi = await import("@/lib/blogApi");

    return blogApi;
  } finally {
    cwdSpy.mockRestore();
    envSpy.restore();
  }
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
});

describe("blogApi front matter validation", () => {
  test("parses required front matter and applies defaults", async () => {
    const tempDir = setupTempPosts({
      "default-fields": `---\ntitle: "Hello"\ndate: "2026-02-16"\n---\nBody`,
    });

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);
    const post = getPostBySlug("default-fields");

    expect(post).not.toBeNull();
    expect(post?.title).toBe("Hello");
    expect(post?.tags).toEqual([]);
    expect(post?.draft).toBe(false);
  });

  test("parses explicit tags and readingTimeMinutes", async () => {
    const tempDir = setupTempPosts({
      tagged: `---\ntitle: "Tagged"\ndate: "2026-02-16"\ntags:\n  - "AI"\n  - "Systems"\nreadingTimeMinutes: 7\n---\nBody`,
    });

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);
    const post = getPostBySlug("tagged");

    expect(post?.tags).toEqual(["AI", "Systems"]);
    expect(post?.readingTimeMinutes).toBe(7);
  });

  test("throws when front matter contains invalid types", async () => {
    const tempDir = setupTempPosts({
      "bad-types": `---\ntitle: "Hello"\ndate: "2026-02-16"\ntags: test\n---\nBody`,
    });

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);

    expect(() => getPostBySlug("bad-types")).toThrow(
      /Invalid front matter.*tags/
    );
  });

  test("throws when front matter contains unknown keys", async () => {
    const tempDir = setupTempPosts({
      "unknown-key": `---\ntitle: "Hello"\ndate: "2026-02-16"\nauthor: "Alex"\n---\nBody`,
    });

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);

    expect(() => getPostBySlug("unknown-key")).toThrow(
      /Invalid front matter.*Unrecognized key/
    );
  });

  test("throws when seriesOrder exists without series", async () => {
    const tempDir = setupTempPosts({
      "bad-series": `---\ntitle: "Bad"\ndate: "2026-02-16"\nseriesOrder: 1\n---\nBody`,
    });

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);

    expect(() => getPostBySlug("bad-series")).toThrow(
      /seriesOrder requires series/
    );
  });

  test("throws when date front matter is not a real ISO calendar date", async () => {
    const tempDir = setupTempPosts({
      "bad-date": `---\ntitle: "Bad date"\ndate: "2026-02-30"\n---\nBody`,
      "bad-updated": `---\ntitle: "Bad updated"\ndate: "2026-02-16"\nupdated: "2026-13-01"\n---\nBody`,
    });

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);

    expect(() => getPostBySlug("bad-date")).toThrow(
      'Invalid date in post "bad-date": 2026-02-30'
    );
    expect(() => getPostBySlug("bad-updated")).toThrow(
      'Invalid updated in post "bad-updated": 2026-13-01'
    );
  });

  test("excludes draft posts by default", async () => {
    const tempDir = setupTempPosts({
      published: `---\ntitle: "Published"\ndate: "2026-02-16"\n---\nBody`,
      draft: `---\ntitle: "Draft"\ndate: "2026-02-17"\ndraft: true\n---\nBody`,
    });

    const { getAllPosts, getPostBySlug } = await loadBlogApiAtCwd(tempDir);
    const posts = getAllPosts(["slug"]);

    expect(posts).toEqual([{ slug: "published" }]);
    expect(getPostBySlug("draft")).toBeNull();
  });

  test("can include drafts when requested", async () => {
    const tempDir = setupTempPosts({
      published: `---\ntitle: "Published"\ndate: "2026-02-16"\n---\nBody`,
      draft: `---\ntitle: "Draft"\ndate: "2026-02-17"\ndraft: true\n---\nBody`,
    });

    const { getAllPosts, getPostBySlug } = await loadBlogApiAtCwd(tempDir);
    const posts = getAllPosts(["slug"], { includeDrafts: true });

    expect(posts).toEqual([{ slug: "draft" }, { slug: "published" }]);
    expect(getPostBySlug("draft", ["slug"], { includeDrafts: true })).toEqual({
      slug: "draft",
    });
  });

  test("supports options-only overload for getPostBySlug", async () => {
    const tempDir = setupTempPosts({
      draft: `---\ntitle: "Draft"\ndate: "2026-02-17"\ndraft: true\n---\nBody`,
    });

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);

    expect(getPostBySlug("draft", { includeDrafts: true })?.slug).toBe("draft");
  });

  test("supports options-only overload for getAllPosts", async () => {
    const tempDir = setupTempPosts({
      draft: `---\ntitle: "Draft"\ndate: "2026-02-17"\ndraft: true\n---\nBody`,
    });

    const { getAllPosts } = await loadBlogApiAtCwd(tempDir);

    expect(
      getAllPosts({ includeDrafts: true }).map((post) => post.slug)
    ).toEqual(["draft"]);
  });

  test("throws when callers request unsupported post fields", async () => {
    const tempDir = setupTempPosts({
      published: `---\ntitle: "Published"\ndate: "2026-02-16"\n---\nBody`,
    });

    const { getAllPosts } = await loadBlogApiAtCwd(tempDir);
    const invokeGetAllPostsWithRuntimeFields = (fields: readonly string[]) =>
      Reflect.apply(getAllPosts, undefined, [fields]);

    expect(() =>
      invokeGetAllPostsWithRuntimeFields(["slug", "notAField"])
    ).toThrow(/Unsupported post field requested: notAField/);
  });

  test("throws when seriesOrder duplicates within the same series", async () => {
    const tempDir = setupTempPosts({
      a: `---\ntitle: "A"\ndate: "2026-02-16"\nseries: "s"\nseriesOrder: 1\n---\nBody`,
      b: `---\ntitle: "B"\ndate: "2026-02-15"\nseries: "s"\nseriesOrder: 1\n---\nBody`,
    });

    const { getAllPosts } = await loadBlogApiAtCwd(tempDir);

    expect(() => getAllPosts()).toThrow(/Duplicate seriesOrder/);
  });

  test("reuses cached post parsing between repeated API calls", async () => {
    const tempDir = setupTempPosts({
      first: `---
title: "First"
date: "2026-02-16"
---
Body`,
      second: `---
title: "Second"
date: "2026-02-15"
---
Body`,
    });

    const readFileSpy = jest.spyOn(fs, "readFileSync");
    const { getAllPosts, getPostBySlug } = await loadBlogApiAtCwd(tempDir);

    getAllPosts();
    getAllPosts(["slug"]);
    getPostBySlug("first");
    getPostBySlug("second", ["slug"]);

    expect(readFileSpy).toHaveBeenCalledTimes(2);
  });

  test("reloads post content on each call during development", async () => {
    const tempDir = setupTempPosts({
      draft: `---\ntitle: "Original"\ndate: "2026-02-17"\n---\nBody`,
    });
    const postPath = path.join(tempDir, "content", "posts", "draft.md");
    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir, {
      nodeEnv: "development",
    });

    expect(getPostBySlug("draft")?.title).toBe("Original");

    fs.writeFileSync(
      postPath,
      `---\ntitle: "Updated"\ndate: "2026-02-17"\n---\nBody`,
      "utf8"
    );

    expect(getPostBySlug("draft")?.title).toBe("Updated");
  });

  test("returns null when slug resolves to a directory", async () => {
    const tempDir = setupTempPosts({
      published: `---
title: "Published"
date: "2026-02-16"
---
Body`,
    });

    fs.mkdirSync(path.join(tempDir, "content", "posts", "folder.md"));

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);

    expect(getPostBySlug("folder")).toBeNull();
  });

  test("returns null for traversal-like slugs outside content/posts", async () => {
    const tempDir = setupTempPosts({
      published: `---\ntitle: "Published"\ndate: "2026-02-16"\n---\nBody`,
    });

    fs.writeFileSync(
      path.join(tempDir, "content", "secret.md"),
      `---\ntitle: "Secret"\ndate: "2026-02-16"\n---\nSensitive`,
      "utf8"
    );

    const { getPostBySlug } = await loadBlogApiAtCwd(tempDir);

    expect(getPostBySlug("../secret")).toBeNull();
  });
});

describe("getRelatedPosts", () => {
  test("ranks by score and then date for automatic selection", async () => {
    const tempDir = setupTempPosts({
      target: `---\ntitle: "Target"\ndate: "2026-02-16"\ntags:\n  - "AI"\n  - "Systems"\nseries: "notes"\n---\nBody`,
      strong: `---\ntitle: "Strong"\ndate: "2026-02-15"\ntags:\n  - "AI"\n  - "Systems"\nseries: "notes"\n---\nBody`,
      medium: `---\ntitle: "Medium"\ndate: "2026-02-14"\ntags:\n  - "AI"\n---\nBody`,
      weak: `---\ntitle: "Weak"\ndate: "2025-01-01"\ntags:\n  - "Other"\n---\nBody`,
    });

    const { getRelatedPosts } = await loadBlogApiAtCwd(tempDir);

    expect(getRelatedPosts("target").map((post) => post.slug)).toEqual([
      "strong",
      "medium",
      "weak",
    ]);
  });

  test("falls back to newest posts when no candidate has a positive score", async () => {
    const tempDir = setupTempPosts({
      target: `---\ntitle: "Target"\ndate: "2026-02-16"\ntags:\n  - "AI"\n---\nBody`,
      newest: `---\ntitle: "Newest"\ndate: "2024-03-02"\ntags:\n  - "X"\n---\nBody`,
      older: `---\ntitle: "Older"\ndate: "2024-03-01"\ntags:\n  - "Y"\n---\nBody`,
      oldest: `---\ntitle: "Oldest"\ndate: "2024-02-20"\ntags:\n  - "Z"\n---\nBody`,
    });

    const { getRelatedPosts } = await loadBlogApiAtCwd(tempDir);

    expect(
      getRelatedPosts("target", { limit: 2 }).map((post) => post.slug)
    ).toEqual(["newest", "older"]);
  });

  test("does not include drafts by default", async () => {
    const tempDir = setupTempPosts({
      published: `---
title: "Published"
date: "2026-02-16"
tags:
  - "AI"
---
Body`,
      "draft-post": `---
title: "Draft"
date: "2026-02-17"
tags:
  - "AI"
draft: true
---
Body`,
    });

    const { getRelatedPosts } = await loadBlogApiAtCwd(tempDir);
    expect(getRelatedPosts("published")).toEqual([]);
  });

  test("includes draft candidates when includeDrafts is true", async () => {
    const tempDir = setupTempPosts({
      published: `---
title: "Published"
date: "2026-02-16"
tags:
  - "AI"
---
Body`,
      "draft-post": `---
title: "Draft"
date: "2026-02-17"
tags:
  - "AI"
draft: true
---
Body`,
    });

    const { getRelatedPosts } = await loadBlogApiAtCwd(tempDir);

    expect(
      getRelatedPosts("published", { includeDrafts: true }).map(
        (post) => post.slug
      )
    ).toEqual(["draft-post"]);
  });

  test("returns an empty list for missing post or zero limit", async () => {
    const tempDir = setupTempPosts({
      a: `---\ntitle: "A"\ndate: "2026-02-16"\n---\nBody`,
      b: `---\ntitle: "B"\ndate: "2026-02-15"\n---\nBody`,
    });

    const { getRelatedPosts } = await loadBlogApiAtCwd(tempDir);

    expect(getRelatedPosts("missing")).toEqual([]);
    expect(getRelatedPosts("a", { limit: 0 })).toEqual([]);
  });
});

describe("series helpers", () => {
  test("returns ordered navigation for multi-post series", async () => {
    const tempDir = setupTempPosts({
      first: `---\ntitle: "First"\ndate: "2026-02-14"\nseries: "Notes"\nseriesOrder: 1\n---\nBody`,
      second: `---\ntitle: "Second"\ndate: "2026-02-16"\nseries: "Notes"\nseriesOrder: 2\n---\nBody`,
      third: `---\ntitle: "Third"\ndate: "2026-02-15"\nseries: "Notes"\nseriesOrder: 3\n---\nBody`,
    });

    const { getSeriesNavigation } = await loadBlogApiAtCwd(tempDir);

    expect(getSeriesNavigation("second")).toEqual({
      name: "Notes",
      currentPart: 2,
      totalParts: 3,
      previousPost: {
        slug: "first",
        title: "First",
        seriesOrder: 1,
      },
      nextPost: {
        slug: "third",
        title: "Third",
        seriesOrder: 3,
      },
    });
  });

  test("omits navigation for standalone and single-post series", async () => {
    const tempDir = setupTempPosts({
      standalone: `---\ntitle: "Standalone"\ndate: "2026-02-16"\n---\nBody`,
      solo: `---\ntitle: "Solo"\ndate: "2026-02-15"\nseries: "Solo Series"\nseriesOrder: 1\n---\nBody`,
    });

    const { getSeriesNavigation } = await loadBlogApiAtCwd(tempDir);

    expect(getSeriesNavigation("standalone")).toBeNull();
    expect(getSeriesNavigation("solo")).toBeNull();
  });

  test("returns multi-post series summaries linked to their first posts", async () => {
    const tempDir = setupTempPosts({
      "alpha-two": `---\ntitle: "Alpha Two"\ndate: "2026-02-16"\nseries: "Alpha"\nseriesOrder: 2\n---\nBody`,
      "alpha-one": `---\ntitle: "Alpha One"\ndate: "2026-02-15"\nseries: "Alpha"\nseriesOrder: 1\n---\nBody`,
      "beta-one": `---\ntitle: "Beta One"\ndate: "2026-02-14"\nseries: "Beta"\nseriesOrder: 1\n---\nBody`,
      unlisted: `---\ntitle: "Unlisted"\ndate: "2026-02-13"\nseries: "Unlisted"\n---\nBody`,
    });

    const { getSeriesSummaries } = await loadBlogApiAtCwd(tempDir);

    expect(getSeriesSummaries()).toEqual([
      {
        name: "Alpha",
        count: 2,
        firstPost: {
          slug: "alpha-one",
          title: "Alpha One",
          seriesOrder: 1,
        },
      },
    ]);
  });
});
