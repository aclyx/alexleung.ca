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
      updated: "2026-09-05T00:00:00.000Z",
      tags: ["Deep Learning"],
    },
  ]),
}));

describe("sitemap", () => {
  it("emits canonical trailing-slash URLs for primary and indexable tag pages", () => {
    const entries = sitemap();
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://alexleung.ca/" }),
        expect.objectContaining({ url: "https://alexleung.ca/now/" }),
        expect.objectContaining({ url: "https://alexleung.ca/blog/" }),
        expect.objectContaining({ url: "https://alexleung.ca/contact/" }),
        expect.objectContaining({
          url: "https://alexleung.ca/experimental/mandelbrot/",
          lastModified: new Date("2026-08-29"),
          priority: 0.6,
        }),
        expect.objectContaining({
          url: "https://alexleung.ca/blog/tags/deep-learning/",
        }),
      ])
    );

    const blogPostEntry = entries.find(
      (entry) => entry.url === "https://alexleung.ca/blog/my-post/"
    );
    const tagEntry = entries.find(
      (entry) => entry.url === "https://alexleung.ca/blog/tags/deep-learning/"
    );

    expect(blogPostEntry).toBeDefined();
    expect(tagEntry).toBeDefined();
    expect(
      entries.find((entry) => entry.url === "https://alexleung.ca/")
        ?.lastModified
    ).toEqual(new Date("2026-09-05"));
    expect(
      entries.find((entry) => entry.url === "https://alexleung.ca/blog/")
        ?.lastModified
    ).toEqual(new Date("2026-09-05"));
    expect(
      entries.find((entry) => entry.url === "https://alexleung.ca/contact/")
        ?.lastModified
    ).toEqual(new Date("2026-08-29"));
    expect(
      entries.some(
        (entry) => entry.url === "https://alexleung.ca/blog/tags/ai/"
      )
    ).toBe(false);
  });

  it("omits retired routes while indexing the active Mandelbrot explorer", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls.includes("https://alexleung.ca/about/")).toBe(false);
    expect(urls).toContain("https://alexleung.ca/experimental/mandelbrot/");
    expect(urls).not.toContain("https://alexleung.ca/experimental/");
    expect(urls).not.toContain("https://alexleung.ca/experimental/load-flow/");
    expect(urls).not.toContain(
      "https://alexleung.ca/experimental/pid-controller/"
    );
  });

  it("uses the freshest post update as the homepage lastModified value", () => {
    const entries = sitemap();
    const homeEntry = entries.find(
      (entry) => entry.url === "https://alexleung.ca/"
    );

    expect(homeEntry?.lastModified).toEqual(
      new Date("2026-09-05T00:00:00.000Z")
    );
  });
});
