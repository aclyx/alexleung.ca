# Markdown Post Template

Use this template for new files under `content/posts/<slug>.md`.

```markdown
---
title: "Post Title"
date: "YYYY-MM-DD"
excerpt: "Single-sentence concrete takeaway."
coverImage: "/assets/blog/<slug>/cover.webp"
coverAlt: "Describe the visible subject; name Alex if depicted."
tags:
  - "Tag One"
draft: true
---

Opening paragraph: name the concrete subject, object, action, or setting. Technical pieces may state their claim early; reflections should let interpretation follow lived detail.

Choose a shape that fits the material rather than filling a standard outline:

- Short reflection or diary: headings are optional; follow the scene, chronology, or a few selected observations.
- Photo essay or trip log: organize around places or images without adding a thesis to every section.
- Technical explainer: use sections for distinct mechanisms, decisions, or constraints.
- Postmortem or argument: establish the claim once, then use evidence and one concrete example instead of restating it.

Closing paragraph (optional): end on a specific observation, unresolved constraint, or next action. Do not add a synthesized lesson when the body has already made the point.
```

## Frontmatter Notes

- Use slug-safe filenames: lowercase words joined by hyphens.
- Include `updated` only when materially revising an existing post. Do not add a link or prose reference to a later-dated post without an intentional `updated` date on the older entry.
- Keep `excerpt` specific and subject-first. Do not foreground an AI tool, employer, or production method unless it is central to the post.
- Use only distinct, useful tags; one precise topical tag is enough. Prefer existing site vocabulary (for example, `Deep Learning` for neural-network textbook notes).
- Keep `coverImage` path aligned to slug directory naming.
- Keep a new post at `draft: true` until its current prose passes the editorial gate in the main skill.
