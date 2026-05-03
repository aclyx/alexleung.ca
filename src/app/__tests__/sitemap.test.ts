import sitemap from "@/app/sitemap";

jest.mock("@/app/now/page", () => ({
  NOW_PAGE_LAST_UPDATED_ISO: "2026-01-15",
}));

jest.mock("@/lib/blogApi", () => ({
  getAllPosts: jest.fn(() => [
    {
      slug: "my-post",
      date: "2026-01-10T00:00:00.000Z",
      updated: "2026-01-20T00:00:00.000Z",
      tags: ["AI", "Deep Learning"],
    },
    {
      slug: "second-post",
      date: "2026-01-25T00:00:00.000Z",
      updated: "2026-02-05T00:00:00.000Z",
      tags: ["Deep Learning"],
    },
  ]),
}));

describe("sitemap", () => {
  it("emits canonical trailing-slash URLs for top-level, experiment, and indexable tag pages", () => {
    const entries = sitemap();
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://alexleung.ca/" }),
        expect.objectContaining({ url: "https://alexleung.ca/about/" }),
        expect.objectContaining({ url: "https://alexleung.ca/now/" }),
        expect.objectContaining({ url: "https://alexleung.ca/blog/" }),
        expect.objectContaining({ url: "https://alexleung.ca/experimental/" }),
        expect.objectContaining({ url: "https://alexleung.ca/contact/" }),
        expect.objectContaining({
          url: "https://alexleung.ca/blog/tags/deep-learning/",
        }),
      ])
    );

    const blogPostEntry = entries.find(
      (entry) => entry.url === "https://alexleung.ca/blog/my-post/"
    );
    const pidControllerEntry = entries.find(
      (entry) =>
        entry.url === "https://alexleung.ca/experimental/pid-controller/"
    );
    const tagEntry = entries.find(
      (entry) => entry.url === "https://alexleung.ca/blog/tags/deep-learning/"
    );

    expect(blogPostEntry).toBeDefined();
    expect(pidControllerEntry).toBeDefined();
    expect(tagEntry).toBeDefined();
    expect(
      entries.some(
        (entry) => entry.url === "https://alexleung.ca/blog/tags/ai/"
      )
    ).toBe(false);
  });

  it("includes all crawlable experimental tools", () => {
    const entries = sitemap();
    expect(
      entries.some((entry) => entry.url.includes("/experimental/event-loop/"))
    ).toBe(true);
    expect(
      entries.some((entry) =>
        entry.url.includes("/experimental/learning-dynamics/")
      )
    ).toBe(true);
  });

  it("uses the freshest post update as the homepage lastModified value", () => {
    const entries = sitemap();
    const homeEntry = entries.find(
      (entry) => entry.url === "https://alexleung.ca/"
    );

    expect(homeEntry?.lastModified).toEqual(
      new Date("2026-02-05T00:00:00.000Z")
    );
  });
});
