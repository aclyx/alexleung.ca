import {
  buildArticleSchema,
  buildBlogCollectionPageSchema,
  buildBlogItemListSchema,
  buildBlogPostingSchema,
  buildCollectionPageSchema,
  buildContactPageSchema,
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
      path: "/",
      title: "Alex Leung | Software Engineer and Writer",
      description: "Homepage description",
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

    expect(profile["@id"]).toBe("https://alexleung.ca/");
    expect(contact["@id"]).toBe("https://alexleung.ca/contact/");
    expect(now["@id"]).toBe("https://alexleung.ca/now/");
    expect(profile.mainEntity).toMatchObject({
      "@id": "https://alexleung.ca/#person",
      name: "Alex Leung",
      url: "https://alexleung.ca/",
      image: "https://alexleung.ca/assets/alex_vibing.webp",
      description:
        "Alex Leung is a software engineer and writer in San Francisco. His previous work includes home electrification, AR and AI hardware, and consumer finance.",
    });
    expect(profile.description).toBe("Homepage description");
    expect(now.mainEntity).toBeUndefined();
  });

  it("builds blog collection and item list schemas", () => {
    const archive = buildCollectionPageSchema({
      path: "/archive",
      title: "Archive | Alex Leung",
      description: "Archive description",
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

    expect(archive["@type"]).toBe("CollectionPage");
    expect(archive["@id"]).toBe("https://alexleung.ca/archive/");
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

  it("builds the website schema", () => {
    const website = buildWebsiteSchema({
      description: "Website description",
    });

    const hasPart = expectSchemaArray<{
      "@type"?: string;
      "@id"?: string;
    }>(website.hasPart);

    expect(hasPart).toEqual([
      {
        "@type": "CollectionPage",
        "@id": "https://alexleung.ca/blog/",
      },
      {
        "@type": "WebPage",
        "@id": "https://alexleung.ca/now/",
      },
      {
        "@type": "ContactPage",
        "@id": "https://alexleung.ca/contact/",
      },
    ]);
  });

  it("builds site navigation schema with configured destinations", () => {
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
        "@id": "https://alexleung.ca/#site-navigation-experience",
        name: "Experience",
        url: "https://alexleung.ca/#experience",
      },
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-writing",
        name: "Writing",
        url: "https://alexleung.ca/blog/",
      },
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-now",
        name: "Now",
        url: "https://alexleung.ca/now/",
      },
      {
        "@type": "SiteNavigationElement",
        "@id": "https://alexleung.ca/#site-navigation-contact",
        name: "Contact",
        url: "https://alexleung.ca/contact/",
      },
    ]);
  });

  it("builds person schema with durable identity metadata", () => {
    const person = buildPersonSchema();
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
    expect(person.image).toEqual([
      {
        "@type": "ImageObject",
        url: "https://alexleung.ca/assets/alex_vibing.webp",
        caption: "Alex Leung in an art studio",
      },
      {
        "@type": "ImageObject",
        url: "https://alexleung.ca/assets/alex_mountain.webp",
        caption: "Alex Leung's portrait on a mountain",
      },
    ]);
    expect(person.knowsLanguage).toEqual(["en-CA"]);
    expect(person.sameAs).toContain("https://www.linkedin.com/in/aclyx");
    expect(person.sameAs).toContain("https://ca.linkedin.com/in/aclyx");
    expect(person.sameAs).toContain("https://github.com/aclyx");
    expect(person.sameAs).toContain("https://github.com/aclyx-oai");
    expect(person.hasOccupation).toBeUndefined();
    expect(person.worksFor).toBeUndefined();
    expect(person.address).toBeUndefined();
    expect(person.disambiguatingDescription).toBeUndefined();
    expect(person.description).toBe(
      "Alex Leung is a software engineer and writer in San Francisco. His previous work includes home electrification, AR and AI hardware, and consumer finance."
    );
    expect(person.knowsAbout).toEqual(
      expect.arrayContaining([
        "Software Engineering",
        "AI Tools",
        "Distributed Systems",
        "Embedded Systems",
      ])
    );
    expect(person.alternateName).toEqual(
      expect.arrayContaining([
        "aclinic",
        "acl",
        "aclyxpse",
        "aclyx",
        "aclyx-oai",
        "yattaro",
        "rootpanda",
      ])
    );
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
      url: "https://alexleung.ca/",
      image: "https://alexleung.ca/assets/alex_vibing.webp",
    });
    expect(posting.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://alexleung.ca/blog/deep-dive/",
    });
  });

  it("includes generated cover variants in blog posting image metadata", () => {
    const posting = buildBlogPostingSchema({
      slug: "everyone-is-a-builder",
      title: "Everyone Is a Builder",
      description: "A post with generated cover variants",
      coverImage: "/assets/blog/everyone-is-a-builder/cover.webp",
      date: "2026-02-16",
      tags: ["ai"],
    });

    expect(posting.image).toEqual([
      "https://alexleung.ca/assets/blog/everyone-is-a-builder/cover.webp",
      "https://alexleung.ca/assets/blog/everyone-is-a-builder/cover-hero.webp",
      "https://alexleung.ca/assets/blog/everyone-is-a-builder/cover-card.webp",
    ]);
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
