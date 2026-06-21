---
title: "Static Markdown Inside This Next.js Site"
date: "2026-01-31"
updated: "2026-06-15"
excerpt: "How I added a repo-backed Markdown blog to my static Next.js portfolio without adding a CMS or runtime admin surface."
coverImage: "/assets/blog/boring-blog-architecture/cover.webp"
coverAlt: "Illustration of Alex wearing headphones while working at a laptop under a desk lamp"
tags:
  - "Next.js"
  - "Architecture"
---

I recently added a blog to this site. Rather than reaching for a CMS, I decided to build it directly into the existing Next.js application using standard tools.

## Static Markdown, No CMS

I wanted a place to share technical notes without adding another system to maintain. The constraints were concrete:

1.  **Repo-backed Markdown**: posts should live beside the rest of the site.
2.  **Static output**: each post should build into HTML during deploy.
3.  **No admin runtime**: publishing should not require a CMS, database, or editor surface.

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

This ensures that `alexleung.ca/blog/boring-blog-architecture/` is just a static HTML file at deploy time, not a dynamic request.

## The details that made it usable

The details that mattered were small, but they made the blog easier to live with:

- **Typography**: I used `@tailwindcss/typography` but customized it to remove the default backticks from inline code for a cleaner look.
- **Metadata**: Each post automatically generates its own SEO tags and JSON-LD structured data.
- **Syntax Highlighting**: I chose `rehype-pretty-code` (powered by Shiki). It uses the same TextMate grammars as VS Code, so the highlighting is close to what I am used to in the editor. It also generates inline styles, so there is no separate CSS import to manage.
- **Sitemap**: A dynamic script crawls my posts directory to keep `sitemap.xml` up to date automatically.

The result is simple on purpose. I can write in Markdown, keep everything in the repo, and ship a blog with a rendering path that is easy to understand.
