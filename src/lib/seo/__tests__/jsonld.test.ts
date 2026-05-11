import {
  buildArticleSchema,
  buildBlogCollectionPageSchema,
  buildBlogItemListSchema,
  buildBlogPostingSchema,
  buildCollectionPageSchema,
  buildContactPageSchema,
  buildHomePageSchema,
  buildPersonSchema,
  buildProfilePageSchema,
  buildSiteNavigationSchema,
  buildWebPageSchema,
  buildWebsiteSchema,
} from "@/lib/seo";

function expectSchemaArray<T>(value: unknown): readonly T[] {
  expect(Array.isArray(value)).toBe(true);

  if (!Array.isArray(value)) {
    throw new Error("Expected schema array");
  }

  return value;
}

describe("seo jsonld builders", () => {
  it("builds profile/contact/web page schemas with canonical IDs", () => {
    const profile = buildProfilePageSchema({
      path: "/about",
      title: "About Alex Leung | Software Engineer",
      description: "About page description",
    });
    const contact = buildContactPageSchema({
      path: "/contact",
      title: "Contact | Alex Leung",
      description: "Contact page description",
    });
    const now = buildWebPageSchema({
      path: "/now",
      title: "What I'm Doing Now | Alex Leung",
      description: "Now page description",
    });

    expect(profile["@id"]).toBe("https://alexleung.ca/about/");
    expect(contact["@id"]).toBe("https://alexleung.ca/contact/");
    expect(now["@id"]).toBe("https://alexleung.ca/now/");
    expect(profile.mainEntity).toMatchObject({
      "@id": "https://alexleung.ca/#person",
      name: "Alex Leung",
      url: "https://alexleung.ca/about/",
      image: "https://alexleung.ca/assets/about_portrait.webp",
    });
  });

  it("builds blog collection and item list schemas", () => {
    const experiments = buildCollectionPageSchema({
      path: "/experimental",
      title: "Experiments | Alex Leung",
      description: "Experiments index description",
    });
    const collection = buildBlogCollectionPageSchema({
      path: "/blog",
      title: "Blog | Alex Leung",
      description: "Blog index description",
    });
    const itemList = buildBlogItemListSchema([
      { slug: "post-1", title: "Post 1" },
      { slug: "post-2", title: "Post 2" },
    ]);
    const tagItemList = buildBlogItemListSchema(
      [{ slug: "post-1", title: "Post 1" }],
      "/blog/tags/ai/"
    );

    expect(experiments["@type"]).toBe("CollectionPage");
    expect(experiments["@id"]).toBe("https://alexleung.ca/experimental/");
    expect(collection.mainEntity).toBeDefined();
    expect(itemList["@id"]).toBe("https://alexleung.ca/blog/#itemlist");
    expect(tagItemList["@id"]).toBe(
      "https://alexleung.ca/blog/tags/ai/#itemlist"
    );

    const itemListElement = expectSchemaArray<{
      name?: string;
      position?: number;
      url?: string;
    }>(itemList.itemListElement);
    expect(itemList.numberOfItems).toBe(2);

    expect(itemListElement[0]).toMatchObject({
      name: "Post 1",
      position: 1,
      url: "https://alexleung.ca/blog/post-1/",
    });
  });

  it("builds enhanced home and website schemas", () => {
    const home = buildHomePageSchema({
      path: "/",
      title:
        "Alex Leung | Software Engineer for AI Systems, Product Engineering, and Distributed Systems",
      description: "Homepage description",
    });
    const website = buildWebsiteSchema({
      description: "Website description",
    });

    expect(home.primaryImageOfPage).toMatchObject({
      "@type": "ImageObject",
      url: "https://alexleung.ca/assets/alex_vibing.webp",
    });

    const hasPart = expectSchemaArray<{
      "@type"?: string;
      "@id"?: string;
    }>(website.hasPart);

    expect(hasPart).toHaveLength(5);
    expect(hasPart[0]).toEqual({
      "@type": "WebPage",
      "@id": "https://alexleung.ca/about/",
    });
    expect(hasPart[3]).toEqual({
      "@type": "CollectionPage",
      "@id": "https://alexleung.ca/experimental/",
    });
  });

  it("builds site navigation schema with canonical nav entry urls", () => {
    const navigation = buildSiteNavigationSchema();
    const hasPart = expectSchemaArray<{
      "@type"?: string;
      "@id"?: string;
      name?: string;
      url?: string;
    }>(navigation.hasPart);

    expect(navigation["@id"]).toBe("https://alexleung.ca/#site-navigation");
    expect(navigation.isPartOf).toEqual({
      "@type": "WebSite",
      "@id": "https://alexleung.ca/#website",
    });
    expect(hasPart).toEqual([
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-home",
        name: "Home",
        url: "https://alexleung.ca/",
      },
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-about",
        name: "About",
        url: "https://alexleung.ca/about/",
      },
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-now",
        name: "Now",
        url: "https://alexleung.ca/now/",
      },
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-blog",
        name: "Blog",
        url: "https://alexleung.ca/blog/",
      },
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-experiments",
        name: "Experiments",
        url: "https://alexleung.ca/experimental/",
      },
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-contact",
        name: "Contact",
        url: "https://alexleung.ca/contact/",
      },
    ]);
  });

  it("builds person schema with richer identity metadata", () => {
    const person = buildPersonSchema({
      description: "Person description",
    });
    expect(typeof person).toBe("object");
    if (typeof person !== "object" || person === null) {
      throw new Error("Expected person schema object");
    }

    expect(person.givenName).toBe("Alex");
    expect(person.familyName).toBe("Leung");
    expect(person.honorificSuffix).toBe("P.Eng.");
    expect(person.memberOf).toMatchObject({
      "@type": "Organization",
      name: "Professional Engineers Ontario",
    });
    expect(person.knowsLanguage).toEqual(["en-CA"]);
    expect(person.sameAs).toContain("https://github.com/aclyx");
    expect(person.hasOccupation).toMatchObject({
      "@type": "Occupation",
      name: "Software Engineer",
      occupationLocation: {
        "@type": "City",
        name: "San Francisco, California, United States",
      },
      skills: expect.stringContaining("technical writing"),
    });
    expect(person.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "San Francisco",
      addressRegion: "California",
      addressCountry: "United States",
    });
    expect(person.disambiguatingDescription).toBe(
      "San Francisco-based software engineer writing notes on software systems, AI tools, and small experiments."
    );
    expect(person.knowsAbout).toEqual(
      expect.arrayContaining([
        "AI-Assisted Software Development and Tools",
        "AI-Assisted Software Workflows",
        "Backend Architecture and Reliability",
        "Full-Stack Product Engineering",
      ])
    );
    expect(person.alternateName).toEqual(
      expect.arrayContaining([
        "aclinic",
        "acl",
        "aclyxpse",
        "aclyx",
        "yattaro",
        "rootpanda",
      ])
    );
    expect(person.worksFor).toMatchObject({
      "@type": "Organization",
      name: "OpenAI",
      url: "https://openai.com/",
    });
  });

  it("builds blog posting schema with normalized urls and keywords", () => {
    const posting = buildBlogPostingSchema({
      slug: "deep-dive",
      title: "Deep Dive",
      description: "A deep dive post",
      coverImage: "/assets/blog/cover.webp",
      date: "2026-02-16",
      updated: "2026-02-18",
      tags: ["ai", "systems"],
    });

    expect(posting.url).toBe("https://alexleung.ca/blog/deep-dive/");
    expect(posting["@id"]).toBe(
      "https://alexleung.ca/blog/deep-dive/#blogposting"
    );
    expect(posting.image).toEqual([
      "https://alexleung.ca/assets/blog/cover.webp",
    ]);
    expect(posting.keywords).toBe("ai, systems");
    expect(posting.datePublished).toBe("2026-02-16T00:00:00.000Z");
    expect(posting.dateModified).toBe("2026-02-18T00:00:00.000Z");
    expect(posting.author).toMatchObject({
      "@id": "https://alexleung.ca/#person",
      name: "Alex Leung",
      url: "https://alexleung.ca/about/",
      image: "https://alexleung.ca/assets/about_portrait.webp",
    });
    expect(posting.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://alexleung.ca/blog/deep-dive/",
    });
  });

  it("builds article schema for blog posts", () => {
    const article = buildArticleSchema({
      slug: "deep-dive",
      title: "Deep Dive",
      description: "A deep dive post",
      coverImage: "/assets/blog/cover.webp",
      date: "2026-02-16",
      updated: "2026-02-18",
      tags: ["ai", "systems"],
    });

    expect(article["@id"]).toBe("https://alexleung.ca/blog/deep-dive/#article");
    expect(article.url).toBe("https://alexleung.ca/blog/deep-dive/");
  });
});
