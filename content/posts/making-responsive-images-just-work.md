---
title: "Manifest-Driven Responsive Images in Next.js"
date: "2026-03-04"
excerpt: "I replaced scattered responsive-image conventions in a Next.js static site with a manifest-driven workflow that made authoring simpler and failures easier to see."
coverImage: "/assets/blog/making-responsive-images-just-work/cover.webp"
coverAlt: "Illustration of Alex measuring framed landscape images labeled sm, md, and lg"
tags:
  - "Next.js"
  - "Architecture"
  - "Developer Workflow"
---

I started this as a performance task: downscale assets, add `srcSet`/`sizes`, and improve LCP. The bigger problem turned out to be maintainability.

Image behavior was spread across scripts and components with repeated conventions:

- variant naming assumptions,
- hardcoded `srcSet` strings,
- multiple script aliases and legacy paths.

That made drift easy, and small changes in one place could quietly break expectations elsewhere. I replaced that with a simpler pattern: generate one manifest at build time (`src/generated/imageVariantManifest.json`) and resolve variants from it at runtime.

## One manifest instead of scattered assumptions

The main change was replacing repeated conventions with one manifest-driven path. There is now one canonical workflow: `yarn image:variants`. Rendering logic is less duplicated because a shared `ResponsiveImage` component replaced repeated `<picture>` patterns. Static assets also became data-driven, so background and portrait `srcSet` values now come from manifest-backed metadata rather than JSX literals.

## A simpler authoring path

This was an important constraint for me: I do not want to manually create `-sm`, `-md`, `-lg` files every time I add an image.

The workflow is now simple: add the source image, reference it in frontmatter or markdown, then run `yarn image:variants`. That keeps authoring lightweight while still making outputs consistent.

## Stricter failure modes

Once maintainability improved, performance work became easier to verify. I also removed silent fallback for required profiles (`cover.card`, `cover.hero`, `inlineContent`). If a required variant is missing, it now fails fast instead of shipping a hidden regression.

## What I actually fixed

I started by chasing LCP. The durable fix was maintainability: fewer scattered conventions, one source of truth, and clearer build/runtime boundaries. For this site, performance improvements became much easier once the image system became easier to reason about.
