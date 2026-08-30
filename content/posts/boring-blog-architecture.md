---
title: "Static Markdown Inside This Next.js Site"
date: "2026-01-31"
updated: "2026-08-02"
excerpt: "How repo-backed Markdown becomes static HTML without a CMS, database, or runtime admin surface."
coverImage: "/assets/blog/boring-blog-architecture/cover.webp"
coverAlt: "Illustration of Alex wearing headphones while working at a laptop under a desk lamp"
tags:
  - "Next.js"
  - "Architecture"
---

I added the blog directly to the site's existing Next.js application so technical notes could live beside the rest of the site without another system to maintain. Posts are Markdown files, each route builds to static HTML, and publishing does not depend on a CMS or runtime admin surface.

## Markdown in, static HTML out

Three constraints shaped the implementation:

1.  **Repo-backed Markdown**: posts should live beside the rest of the site.
2.  **Static output**: each post should build into HTML during deploy.
3.  **No admin runtime**: publishing should not require a CMS, database, or editor surface.

## File-backed routes at build time

I created a simple utility, `blogApi.ts`, that reads directly from the file system and uses `gray-matter` to parse frontmatter. A separate `markdownToHtml.ts` pipeline converts post bodies with `remark` and `rehype`, including `rehype-pretty-code`.

Next.js makes it straightforward to turn a folder of markdown files into routes. I used `generateStaticParams` to tell Next.js which paths to build at compile time:

```typescript
export async function generateStaticParams() {
  const posts = getAllPosts(["slug"]);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

This ensures that `alexleung.ca/blog/boring-blog-architecture/` is just a static HTML file at deploy time, not a dynamic request.

## Small details keep publishing simple

The details that mattered were small, but they made the blog easier to live with:

- **Typography**: I used `@tailwindcss/typography` but customized it to remove the default backticks from inline code for a cleaner look.
- **Metadata**: Each post automatically generates its own SEO tags and JSON-LD structured data.
- **Syntax Highlighting**: I chose `rehype-pretty-code` (powered by Shiki). It uses the same TextMate grammars as VS Code, so the highlighting is close to what I am used to in the editor. It also generates inline styles, so there is no separate CSS import to manage.
- **Sitemap**: A force-static Next.js metadata route uses the same post loader at build time, so `sitemap.xml` includes each post and its publication or update date.

The result is simple on purpose. I can write in Markdown, keep everything in the repo, and ship a blog with a rendering path that is easy to understand.
