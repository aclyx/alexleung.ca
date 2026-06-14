import type {
  Article,
  BlogPosting,
  CollectionPage,
  ContactPage,
  ItemList,
  Occupation,
  Organization,
  Person,
  ProfilePage,
  SiteNavigationElement,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";

import { NAV_LINKS } from "@/constants/navigation";
import { getCoverVariantPath } from "@/lib/coverVariants";
import { toAbsoluteUrl, toCanonical } from "@/lib/seo/url";

const PERSON_ID = "/#person";
const WEBSITE_ID = "/#website";
const SITE_NAVIGATION_ID = "/#site-navigation";
const ABOUT_PATH = "/about";
const SITE_ROOT = toAbsoluteUrl("/").replace(/\/$/, "");
const SCHEMA_CONTEXT: "https://schema.org" = "https://schema.org";
const PERSON_TYPE: "Person" = "Person";
const WEBSITE_TYPE: "WebSite" = "WebSite";
const WEBPAGE_TYPE: "WebPage" = "WebPage";
const SITE_NAVIGATION_ELEMENT_TYPE: "SiteNavigationElement" =
  "SiteNavigationElement";
const SOCIAL_PROFILES = [
  "https://www.linkedin.com/in/aclyx",
  "https://ca.linkedin.com/in/aclyx",
  "https://github.com/aclyx",
  "https://www.x.com/aclyxpse",
  "https://bsky.app/profile/alexleung.ca",
  "https://www.instagram.com/rootpanda",
  "https://scholar.google.ca/citations?user=NcOOsPIAAAAJ",
];
const OPENAI_ORGANIZATION: Organization = {
  "@type": "Organization",
  name: "OpenAI",
  url: "https://openai.com/",
};
type PersonReference = {
  "@type": "Person";
  "@id": string;
  name: string;
  url: string;
  image: string;
  sameAs: string[];
};

type BasePageSchema<TPageType extends string> = {
  "@context": "https://schema.org";
  "@type": TPageType;
  "@id": string;
  url: string;
  name: string;
  description: string;
  inLanguage: string;
  isPartOf: Pick<WebSite, "@type" | "@id">;
};

type BasePostSchema = {
  canonicalPostUrl: string;
  schema: {
    url: string;
    headline: string;
    description?: string;
    keywords?: string;
    image?: string[];
    datePublished: string;
    dateModified: string;
    author: PersonReference;
    publisher: PersonReference;
    inLanguage: string;
    mainEntityOfPage: Pick<WebPage, "@type" | "@id">;
  };
};

const PERSON_REFERENCE: PersonReference = {
  "@type": PERSON_TYPE,
  "@id": toAbsoluteUrl(PERSON_ID),
  name: "Alex Leung",
  url: toCanonical(ABOUT_PATH),
  image: toAbsoluteUrl("/assets/about_portrait.webp"),
  sameAs: SOCIAL_PROFILES,
};

type PostSchemaInput = {
  coverImage?: string;
  date: string;
  description?: string;
  slug: string;
  tags: string[];
  title: string;
  updated?: string;
};

function buildBasePageSchema<TPageType extends string>({
  description,
  pageType,
  path,
  title,
}: {
  description: string;
  pageType: TPageType;
  path: string;
  title: string;
}): BasePageSchema<TPageType> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": pageType,
    "@id": toCanonical(path),
    url: toCanonical(path),
    name: title,
    description,
    inLanguage: "en-CA",
    isPartOf: {
      "@type": WEBSITE_TYPE,
      "@id": toAbsoluteUrl(WEBSITE_ID),
    },
  };
}

function buildPostImageUrls(
  coverImage: string | undefined
): string[] | undefined {
  if (!coverImage) {
    return undefined;
  }

  return Array.from(
    new Set(
      [
        coverImage,
        getCoverVariantPath(coverImage, "hero"),
        getCoverVariantPath(coverImage, "card"),
      ]
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
        .map(toAbsoluteUrl)
    )
  );
}

function buildBasePostSchema(input: PostSchemaInput): BasePostSchema {
  const canonicalPostUrl = toCanonical(`/blog/${input.slug}`);

  return {
    canonicalPostUrl,
    schema: {
      url: canonicalPostUrl,
      headline: input.title,
      description: input.description,
      keywords: input.tags.length > 0 ? input.tags.join(", ") : undefined,
      image: buildPostImageUrls(input.coverImage),
      datePublished: new Date(input.date).toISOString(),
      dateModified: new Date(input.updated ?? input.date).toISOString(),
      author: PERSON_REFERENCE,
      publisher: PERSON_REFERENCE,
      inLanguage: "en-CA",
      mainEntityOfPage: {
        "@type": WEBPAGE_TYPE,
        "@id": canonicalPostUrl,
      },
    },
  };
}

export function buildProfilePageSchema(input: {
  description: string;
  path: string;
  title: string;
}): WithContext<ProfilePage> {
  return {
    ...buildBasePageSchema({ ...input, pageType: "ProfilePage" }),
    mainEntity: {
      ...PERSON_REFERENCE,
      description: input.description,
    },
  };
}

export function buildContactPageSchema(input: {
  description: string;
  path: string;
  title: string;
}): WithContext<ContactPage> {
  return {
    ...buildBasePageSchema({ ...input, pageType: "ContactPage" }),
    mainEntity: {
      "@type": "Person",
      "@id": toAbsoluteUrl(PERSON_ID),
    },
  };
}

export function buildWebPageSchema(input: {
  description: string;
  path: string;
  title: string;
}): WithContext<WebPage> {
  return {
    ...buildBasePageSchema({ ...input, pageType: "WebPage" }),
    mainEntity: {
      "@type": "Person",
      "@id": toAbsoluteUrl(PERSON_ID),
    },
  };
}

export function buildCollectionPageSchema(input: {
  description: string;
  path: string;
  title: string;
}): WithContext<CollectionPage> {
  return {
    ...buildBasePageSchema({ ...input, pageType: "CollectionPage" }),
  };
}

export function buildHomePageSchema(input: {
  description: string;
  path: string;
  title: string;
}): WithContext<WebPage> {
  return {
    ...buildBasePageSchema({ ...input, pageType: "WebPage" }),
    about: {
      "@id": toAbsoluteUrl(PERSON_ID),
    },
    mainEntity: {
      "@type": "Person",
      "@id": toAbsoluteUrl(PERSON_ID),
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: toAbsoluteUrl("/assets/alex_vibing.webp"),
      caption: "Alex Leung",
    },
  };
}

export function buildBlogCollectionPageSchema(input: {
  description: string;
  path: string;
  title: string;
}): WithContext<CollectionPage> {
  return {
    ...buildCollectionPageSchema(input),
    mainEntity: {
      "@type": "Blog",
      "@id": toAbsoluteUrl("/blog/#blog"),
      name: "Alex Leung's Blog",
      description: input.description,
      publisher: {
        "@id": toAbsoluteUrl(PERSON_ID),
      },
    },
  };
}

export function buildBlogItemListSchema(
  posts: Array<{ slug: string; title: string }>,
  path = "/blog"
): WithContext<ItemList> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ItemList",
    "@id": `${toCanonical(path)}#itemlist`,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: toCanonical(`/blog/${post.slug}`),
      name: post.title,
    })),
    numberOfItems: posts.length,
  };
}

export function buildBlogPostingSchema(
  input: PostSchemaInput
): WithContext<BlogPosting> {
  const { canonicalPostUrl, schema } = buildBasePostSchema(input);

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BlogPosting",
    "@id": `${canonicalPostUrl}#blogposting`,
    ...schema,
    isPartOf: {
      "@type": "Blog",
      "@id": toAbsoluteUrl("/blog/#blog"),
      name: "Blog | Alex Leung",
    },
  };
}

export function buildArticleSchema(
  input: PostSchemaInput
): WithContext<Article> {
  const { canonicalPostUrl, schema } = buildBasePostSchema(input);

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    "@id": `${canonicalPostUrl}#article`,
    ...schema,
  };
}

export function buildPersonSchema(input: {
  description: string;
}): WithContext<Person> {
  const currentOccupation: Occupation = {
    "@type": "Occupation",
    name: "Software Engineer",
    occupationLocation: {
      "@type": "City",
      name: "San Francisco, California, United States",
    },
    skills:
      "Software engineering, systems design, AI-assisted software workflows, distributed systems, backend reliability, product engineering, and technical writing",
  };

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Person",
    "@id": toAbsoluteUrl(PERSON_ID),
    name: "Alex Leung",
    givenName: "Alex",
    familyName: "Leung",
    honorificSuffix: "P.Eng.",
    alternateName: [
      "Alexander Leung",
      "Alexander Clayton Leung",
      "Alex C Leung",
      "aclinic",
      "acl",
      "aclyxpse",
      "aclyx",
      "yattaro",
      "rootpanda",
    ],
    url: SITE_ROOT,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": SITE_ROOT,
    },
    image: [
      {
        "@type": "ImageObject",
        url: toAbsoluteUrl("/assets/about_portrait.webp"),
        caption: "Alex Leung",
      },
      {
        "@type": "ImageObject",
        url: toAbsoluteUrl("/assets/about_portrait_mountain.webp"),
        caption: "Alex Leung's portrait on a mountain",
      },
    ],
    jobTitle: "Software Engineer",
    hasOccupation: currentOccupation,
    worksFor: OPENAI_ORGANIZATION,
    description: input.description,
    disambiguatingDescription:
      "San Francisco-based software engineer writing notes on software systems, AI tools, and small experiments.",
    knowsLanguage: ["en-CA"],
    sameAs: SOCIAL_PROFILES,
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Francisco",
      addressRegion: "California",
      addressCountry: "United States",
    },
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "University of Waterloo",
        sameAs: "https://en.wikipedia.org/wiki/University_of_Waterloo",
      },
      {
        "@type": "CollegeOrUniversity",
        name: "Georgia Institute of Technology",
        sameAs: "https://en.wikipedia.org/wiki/Georgia_Institute_of_Technology",
      },
    ],
    knowsAbout: [
      "Software Engineering",
      "AI-Assisted Software Development and Tools",
      "AI-Assisted Software Workflows",
      "Distributed Systems",
      "Backend Architecture and Reliability",
      "Full-Stack Product Engineering",
      "Systems Design",
      "Embedded Systems",
      "Electrical Engineering",
    ],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        name: "Professional Engineer (P.Eng.)",
        credentialCategory: "Professional License",
        recognizedBy: {
          "@type": "Organization",
          name: "Professional Engineers Ontario",
          url: "https://www.peo.on.ca",
          sameAs:
            "https://en.wikipedia.org/wiki/Professional_Engineers_Ontario",
        },
      },
      {
        "@type": "EducationalOccupationalCredential",
        name: "Master of Science in Electrical and Computer Engineering",
        credentialCategory: "Degree",
        educationalLevel: "Master's Degree",
        recognizedBy: {
          "@type": "CollegeOrUniversity",
          name: "Georgia Institute of Technology",
          sameAs:
            "https://en.wikipedia.org/wiki/Georgia_Institute_of_Technology",
        },
      },
      {
        "@type": "EducationalOccupationalCredential",
        name: "Bachelor of Applied Science in Electrical Engineering",
        credentialCategory: "Degree",
        educationalLevel: "Bachelor's Degree",
        recognizedBy: {
          "@type": "CollegeOrUniversity",
          name: "University of Waterloo",
          sameAs: "https://en.wikipedia.org/wiki/University_of_Waterloo",
        },
      },
    ],
    memberOf: {
      "@type": "Organization",
      name: "Professional Engineers Ontario",
      url: "https://www.peo.on.ca",
    },
  };
}

export function buildWebsiteSchema(input: {
  description: string;
}): WithContext<WebSite> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    "@id": toAbsoluteUrl(WEBSITE_ID),
    url: SITE_ROOT,
    name: "Alex Leung",
    description: input.description,
    about: {
      "@id": toAbsoluteUrl(PERSON_ID),
    },
    publisher: {
      "@id": toAbsoluteUrl(PERSON_ID),
    },
    hasPart: [
      {
        "@type": "WebPage",
        "@id": toCanonical("/about"),
      },
      {
        "@type": "CollectionPage",
        "@id": toCanonical("/blog"),
      },
      {
        "@type": "ContactPage",
        "@id": toCanonical("/contact"),
      },
      {
        "@type": "CollectionPage",
        "@id": toCanonical("/experimental"),
      },
      {
        "@type": "WebPage",
        "@id": toCanonical("/now"),
      },
    ],
    inLanguage: "en-CA",
  };
}

export function buildSiteNavigationSchema(): WithContext<SiteNavigationElement> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": SITE_NAVIGATION_ELEMENT_TYPE,
    "@id": toAbsoluteUrl(SITE_NAVIGATION_ID),
    name: "Main navigation",
    url: SITE_ROOT,
    isPartOf: {
      "@type": WEBSITE_TYPE,
      "@id": toAbsoluteUrl(WEBSITE_ID),
    },
    hasPart: NAV_LINKS.map((item) => ({
      "@type": SITE_NAVIGATION_ELEMENT_TYPE,
      "@id": toAbsoluteUrl(`/#site-navigation-${item.id}`),
      name: item.label,
      url: toCanonical(item.canonicalPath),
    })),
    inLanguage: "en-CA",
  };
}
