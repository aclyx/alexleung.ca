---
title: "Static Markdown Inside This Next.js Site"
date: "2026-01-31"
updated: "2026-10-12"
excerpt: "How repo-backed Markdown becomes static HTML without a CMS, database, or runtime admin surface."
coverImage: "/assets/blog/boring-blog-architecture/cover.webp"
coverAlt: "Illustration of Alex wearing headphones while working at a laptop under a desk lamp"
tags:
  - "Next.js"
  - "Architecture"
---

I added the blog directly to the site’s existing Next.js application so technical notes could live beside the rest of the site without another system to maintain. Posts are Markdown files, each route builds to static HTML, and publishing does not depend on a CMS or runtime admin surface.

## File-backed routes at build time

`blogApi.ts` reads the post files and uses `gray-matter` to parse frontmatter. A separate `markdownToHtml.ts` pipeline converts post bodies with `remark` and `rehype`, including `rehype-pretty-code` for code blocks.

The route’s `generateStaticParams` function enumerates the post slugs, including unlisted posts whose URLs still need to work:

```typescript
export async function generateStaticParams() {
  const posts = getAllPosts(["slug"], { includeUnlisted: true });
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

Route enumeration is one part of the setup. `output: "export"` in `next.config.mjs` tells Next.js to write a [static export](https://nextjs.org/docs/app/guides/static-exports), and `trailingSlash: true` gives each post an `index.html` inside its route directory. The build writes this post to `out/blog/boring-blog-architecture/index.html`; GitHub Pages serves it without a Next.js server.

## Publishing from the same files

The post files also supply the surrounding page data:

- **Metadata**: Each post automatically generates its own SEO tags and JSON-LD structured data.
- **Sitemap**: A force-static Next.js metadata route uses the post loader to include listed posts and their publication or update dates in `sitemap.xml`.

Prose uses `@tailwindcss/typography`, with the default backticks removed from inline code. Code highlighting is rendered during the build. Content changes follow the same path as code changes: edit the repository, rebuild, and deploy the resulting files.
