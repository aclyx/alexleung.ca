---
title: "The 'Boring' Architecture Behind This Blog"
date: "2026-01-31"
updated: "2026-02-14"
excerpt: "How I added a fully static, markdown-based blog to my Next.js portfolio."
coverImage: "/assets/blog/boring-blog-architecture/cover.webp"
coverAlt: "Illustration of Alex wearing headphones while working at a laptop under a desk lamp"
tags:
  - "Next.js"
  - "Architecture"
---

I recently added a blog to this site. Rather than reaching for a CMS, I decided to build it directly into the existing Next.js application using standard tools.

## Requirements

I wanted a place to share technical thoughts without adding another system to maintain. The requirements were simple:

1.  **Write in Markdown**: I want to write posts in VS Code.
2.  **Zero Runtime Cost**: The blog should be statically generated.
3.  **Fast**: It should feel instant.

## Markdown files and static routes

I created a simple utility, `blogApi.ts`, that reads directly from the file system. It uses `gray-matter` to parse frontmatter and a `remark`/`rehype` pipeline, including `rehype-pretty-code`, to process the content.

Next.js makes it straightforward to turn a folder of markdown files into routes. I used `generateStaticParams` to tell Next.js which paths to build at compile time:

```typescript
export async function generateStaticParams() {
  const posts = getAllPosts(["slug"]);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

This ensures that `alexleung.ca/blog/boring-blog-architecture` is just a static HTML file at deploy time, not a dynamic request.

## The details that made it usable

I also spent time on a few details that made the whole thing feel finished:

- **Typography**: I used `@tailwindcss/typography` but customized it to remove the default backticks from inline code for a cleaner look.
- **Metadata**: Each post automatically generates its own SEO tags and JSON-LD structured data.
- **Syntax Highlighting**: I chose `rehype-pretty-code` (powered by Shiki). It uses the same TextMate grammars as VS Code, so the highlighting is close to what I am used to in the editor. Because it generates inline styles, there's no brittle CSS to import from `node_modules`.
- **Sitemap**: A dynamic script crawls my posts directory to keep `sitemap.xml` up to date automatically.

The result is simple on purpose. I can write in Markdown, keep everything in the repo, and ship a blog with a rendering path that is easy to understand.
