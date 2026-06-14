async function loadAnalytics({ enabled }: { enabled: boolean }) {
  jest.resetModules();
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = enabled ? "true" : "false";

  return import("../analytics");
}

describe("analytics helpers", () => {
  const originalAnalyticsEnv = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS;

  beforeEach(() => {
    delete window.dataLayer;
    delete window.gtag;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = originalAnalyticsEnv;
  });

  it("does not emit events when analytics are disabled", async () => {
    window.gtag = jest.fn();
    const { trackArticleEngagedRead } = await loadAnalytics({
      enabled: false,
    });

    trackArticleEngagedRead({
      minimumSeconds: 45,
      scrollDepth: 60,
      slug: "post",
      title: "Post",
    });

    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.dataLayer).toBeUndefined();
  });

  it("emits article engagement events through gtag", async () => {
    window.gtag = jest.fn();
    const { trackArticleEngagedRead } = await loadAnalytics({
      enabled: true,
    });

    trackArticleEngagedRead({
      minimumSeconds: 45,
      scrollDepth: 60,
      slug: "post",
      title: "Post",
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "article_engaged_read", {
      article_slug: "post",
      article_title: "Post",
      event_category: "engagement",
      minimum_seconds: 45,
      scroll_depth: 60,
    });
  });

  it("falls back to dataLayer when gtag is not ready", async () => {
    window.dataLayer = [];
    const { trackExternalLinkClick } = await loadAnalytics({
      enabled: true,
    });

    trackExternalLinkClick({
      current_path: "/blog/post/",
      link_host: "example.com",
      link_text: "Example",
      link_url: "https://example.com",
    });

    expect(window.dataLayer).toEqual([
      [
        "event",
        "external_link_click",
        {
          current_path: "/blog/post/",
          event_category: "navigation",
          link_host: "example.com",
          link_text: "Example",
          link_type: "external",
          link_url: "https://example.com",
          outbound: true,
        },
      ],
    ]);
  });
});
