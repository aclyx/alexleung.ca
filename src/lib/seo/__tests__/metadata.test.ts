import { buildPageMetadata } from "@/lib/seo/metadata";

describe("buildPageMetadata", () => {
  it("builds canonical, Open Graph, and Twitter metadata with defaults", () => {
    const metadata = buildPageMetadata({
      title: "About Me | Alex Leung",
      description: "Learn more about Alex Leung.",
      path: "/about",
    });

    const openGraph = metadata.openGraph;
    const twitter = metadata.twitter;

    expect(metadata.alternates?.canonical).toBe("https://alexleung.ca/about/");
    expect(metadata.alternates?.types).toEqual({
      "application/rss+xml": [
        {
          url: "https://alexleung.ca/feed.xml",
          title: "Alex Leung Blog RSS Feed",
        },
      ],
    });
    expect(openGraph?.url).toBe("https://alexleung.ca/about/");

    expect(openGraph).toMatchObject({ type: "website" });

    expect(openGraph?.siteName).toBe("Alex Leung");

    expect(twitter).toMatchObject({ card: "summary" });
  });

  it("normalizes image URLs and uses large-image twitter card when images exist", () => {
    const metadata = buildPageMetadata({
      title: "Blog | Alex Leung",
      description: "Latest writing.",
      path: "/blog",
      images: [
        {
          url: "/assets/screenshot.png",
          alt: "Blog screenshot",
          width: 1200,
          height: 630,
        },
      ],
    });

    const twitter = metadata.twitter;

    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://alexleung.ca/assets/screenshot.png",
        alt: "Blog screenshot",
        width: 1200,
        height: 630,
      },
    ]);
    expect(twitter?.images).toEqual([
      {
        url: "https://alexleung.ca/assets/screenshot.png",
        alt: "Blog screenshot",
        width: 1200,
        height: 630,
      },
    ]);

    expect(twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("supports overriding metadata type and twitter card", () => {
    const metadata = buildPageMetadata({
      title: "A post | Alex Leung",
      description: "A deep dive post.",
      path: "/blog/deep-dive",
      type: "article",
      twitterCard: "summary",
    });

    const openGraph = metadata.openGraph;
    const twitter = metadata.twitter;

    expect(openGraph).toMatchObject({ type: "article" });

    expect(twitter).toMatchObject({ card: "summary" });
  });
});
