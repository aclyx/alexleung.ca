---
title: "One Manifest for Responsive Images"
date: "2026-03-04"
updated: "2026-08-29"
excerpt: "I replaced scattered responsive-image conventions in a Next.js static site with one generated manifest for variants, dimensions, and lookup during static rendering."
coverImage: "/assets/blog/making-responsive-images-just-work/cover.webp"
coverAlt: "Illustration of Alex measuring framed landscape images labeled sm, md, and lg"
tags:
  - "Next.js"
  - "Architecture"
  - "Developer Workflow"
---

The responsive-image cleanup started as a performance task: downscale assets, add `srcSet`/`sizes`, and improve LCP. The bigger problem turned out to be maintainability.

Image behavior was spread across scripts and components with repeated conventions:

- variant naming assumptions,
- duplicated variant-path assumptions,
- multiple script aliases and legacy paths.

That made drift easy. A renamed variant or new profile could leave an old path assumption behind. I replaced that with a simpler pattern: generate one manifest at build time (`src/generated/imageVariantManifest.json`) and use shared helpers to resolve variants before rendering.

## One manifest instead of scattered assumptions

`yarn image:variants` is now the canonical workflow. Lookup helpers read the generated metadata and pass resolved image paths and `srcSet` values into the shared `ResponsiveImage` component used for cover images and the homepage portrait. Inline Markdown images use the same manifest through the HTML conversion pipeline.

I also wanted to avoid manually creating every profile-specific variant when I added an image. For blog covers and inline Markdown images, the authoring path is now to add the source image, reference it in frontmatter or markdown, and run `yarn image:variants`.

## Stricter failure modes

The manifest loader now rejects missing or empty required profile definitions (`cover.card`, `cover.hero`, `inlineContent`). Individual cover and inline variants can still fall back to the source image, so the hard failure protects the manifest schema rather than every cover or inline asset.
