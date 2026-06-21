import { Feed } from "feed";

import { buildRssFeedXml } from "@/lib/feed";

const mockAddItem = jest.fn();
const mockRss2 = jest.fn(() => "<rss>mock</rss>");

jest.mock(
  "feed",
  () => ({
    Feed: jest.fn().mockImplementation(() => ({
      addItem: mockAddItem,
      rss2: mockRss2,
    })),
  }),
  { virtual: true }
);

const mockFeed = jest.mocked(Feed);

describe("buildRssFeedXml", () => {
  beforeEach(() => {
    mockAddItem.mockClear();
    mockRss2.mockClear();
    mockFeed.mockClear();
  });

  it("configures feed metadata and adds canonical post items", () => {
    const xml = buildRssFeedXml([
      {
        title: "Test Post",
        slug: "test-post",
        date: "2026-03-01T00:00:00.000Z",
        updated: "2026-03-04T00:00:00.000Z",
        excerpt: "Short description",
        tags: ["AI", "Systems"],
      },
    ]);

    expect(xml).toBe("<rss>mock</rss>");
    expect(Feed).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Alex Leung's Blog",
        description:
          "Notes on software systems, AI-assisted coding, deep learning, Next.js static sites, and browser experiments.",
        id: "https://alexleung.ca/blog/",
        link: "https://alexleung.ca/blog/",
        image: "https://alexleung.ca/icon4.png",
        language: "en-CA",
        feedLinks: { rss: "https://alexleung.ca/feed.xml" },
      })
    );
    expect(mockAddItem).toHaveBeenCalledWith({
      title: "Test Post",
      id: "https://alexleung.ca/blog/test-post/",
      link: "https://alexleung.ca/blog/test-post/",
      date: new Date("2026-03-01T00:00:00.000Z"),
      description: "Short description",
      category: [{ name: "AI" }, { name: "Systems" }],
    });
    expect(mockRss2).toHaveBeenCalledTimes(1);
  });

  it("omits optional fields when excerpt and tags are missing", () => {
    buildRssFeedXml([
      {
        title: "No Extras",
        slug: "no-extras",
        date: "2026-03-02T00:00:00.000Z",
      },
    ]);

    expect(mockAddItem).toHaveBeenCalledWith({
      title: "No Extras",
      id: "https://alexleung.ca/blog/no-extras/",
      link: "https://alexleung.ca/blog/no-extras/",
      date: new Date("2026-03-02T00:00:00.000Z"),
      category: [],
    });
  });
});
