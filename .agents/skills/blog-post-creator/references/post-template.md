# Markdown Post Template

Use this template for new files under `content/posts/<slug>.md`.

```markdown
---
title: "Post Title"
date: "YYYY-MM-DD"
excerpt: "A specific introduction to the subject or question."
coverImage: "/assets/blog/<slug>/cover.webp"
coverAlt: "Describe the visible subject; name Alex if depicted."
tags:
  - "Tag One"
draft: true
---

<Post body>
```

Use [voice-and-structure](voice-and-structure.md) for prose choices; this template governs file format and metadata.

## Frontmatter Notes

- Use slug-safe filenames: lowercase words joined by hyphens.
- `updated` is not shown on the post page. It feeds the sitemap, RSS feed, and search metadata (`dateModified`, Open Graph `modifiedTime`). Set or change it only for a revision a returning reader would notice: a corrected fact, a changed title or conclusion, or an added or removed section. Wording, tone, and formatting passes keep the existing date. Do not add a link or prose reference to a later-dated post without an intentional `updated` date on the older entry.
- Keep `excerpt` specific and subject-first. Do not foreground an AI tool, employer, or production method unless it is central to the post.
- Use only distinct, useful tags; one precise topical tag is enough. Prefer existing site vocabulary (for example, `Deep Learning` for neural-network textbook notes).
- When a post joins a tag that has its own page, check that the tag's entry in `TAG_DESCRIPTIONS` (`src/app/blog/tags/[tag]/page.tsx`) still describes the topic. Descriptions should say what a topic covers, not list its current posts.
- Keep `coverImage` path aligned to slug directory naming.
- Keep a new post at `draft: true` until its current prose passes the editorial gate in the main skill.
