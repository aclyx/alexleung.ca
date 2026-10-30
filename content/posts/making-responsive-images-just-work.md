---
title: "One Manifest for Responsive Images"
date: "2026-03-04"
updated: "2026-10-24"
excerpt: "This site generates responsive image variants and their lookup metadata together, so components and Markdown do not have to reconstruct filenames."
coverImage: "/assets/blog/making-responsive-images-just-work/cover.webp"
coverAlt: "Illustration of Alex measuring framed landscape images labeled sm, md, and lg"
tags:
  - "Next.js"
  - "Architecture"
  - "Developer Workflow"
---

I wanted images on this site to load faster by generating smaller versions and using `srcSet` and `sizes` to let the browser choose a suitable file. The scripts and components repeated assumptions about variant names and paths, so renaming a generated image meant updating every place that constructed its path.

I moved those assumptions into the generator and had it write a manifest alongside the images. This site exports static files for GitHub Pages, so the variants exist before deployment. During rendering, components and the Markdown pipeline look up those files in `src/generated/imageVariantManifest.json`.

## Generate files and metadata together

For a blog cover, I add a WebP source under `public/assets/`, reference it in the post’s `coverImage` frontmatter, and run `yarn image:variants`. The same command discovers local images referenced in Markdown. `yarn build` runs it before the static export, so adding a post does not require a separate list of images to process.

The generator defines profiles for different uses: three card widths, two hero widths, and two inline-content widths. It uses those definitions both to generate the files with `cwebp` and to populate the manifest. Each source path maps to the available variants, with dimensions read from the files themselves. For example, the hero entry for this post’s cover is:

```json
"hero": {
  "path": "/assets/blog/making-responsive-images-just-work/cover-hero.webp",
  "width": 1280,
  "height": 854
}
```

The manifest also records that the hero profile contains `hero-sm` and `hero`. A caller can request that profile using the original source path; it does not need to know the filename suffixes or repeat the widths. Changing the generator’s profile changes the metadata used to construct `srcSet` as well.

## Resolve by use, keep layout with the page

Cover helpers select the largest available variant in the requested profile for `src` and build a width-based `srcSet` from the available entries. `ResponsiveImage` passes those values to a native `img`. For inline images, the Markdown conversion applies the same lookup before producing HTML, adding dimensions and lazy loading along with the responsive sources. The post itself keeps an ordinary Markdown image reference.

The manifest describes the files, while `sizes` remains with the rendering code that knows the layout. A thumbnail and a full-width cover can use the same source without claiming the same display width. This keeps layout decisions out of the generator while removing filename conventions from its consumers.

There is still a distinction between a broken manifest and a missing variant. The loader rejects missing or empty `cover.card`, `cover.hero`, and `inlineContent` profile definitions. An individual blog image can fall back to its source when no matching variant is available; fewer than two available variants means no `srcSet`. Those fallbacks keep a missing resize from becoming a broken image, but they can leave the original, larger file in use, and the page looks the same either way.
