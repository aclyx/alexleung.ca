# Blog Image Workflow

Choose a scene, object, or mechanism that reveals the post's subject at thumbnail size. Default to Ghibli-style illustration unless the user chooses another direction. Alex need not appear in every image.

## Subject and reference

- **Image without Alex:** generate directly from the post's subject. Do not open Photos or require a portrait reference.
- **Image depicting Alex:** when generated blog imagery is authorized, find a clear likeness reference in Photos, preferably the Alex person album, Favorites, or existing site-relevant photos. Avoid other people's faces unless needed for the post and clearly allowed. Export to a temporary location and inspect it before use.
- Treat the reference as a likeness source unless the user asks for a direct edit. Avoid copying accidental text or logos. If a required likeness reference is unavailable, explain that limitation and provide the prompt; use a different subject only when consistent with the request.

## Prompt

Adapt this prompt to the chosen subject. Omit likeness instructions when nobody in the image needs a reference.

```text
Create a Studio Ghibli-inspired editorial illustration for a blog post.
Subject: <object, scene, mechanism, or Alex Leung; if Alex is depicted, use the supplied likeness reference>.
Scene: <one concrete scene grounded in the post>.
Composition: readable at thumbnail size and as a wide cover, with the subject clearly visible.
Environment: <details that explain the scene rather than decorative filler>.
Lighting and color: <appropriate to the subject and the site's restrained palette>.
No text overlays, watermarks, or unrelated logos. Do not copy incidental text, branding, or other faces from a reference photo.
Aspect ratio: 16:9 for a cover; choose a suitable ratio for an explanatory body image.
```

If generation is unavailable or intentionally deferred, return the usable prompt. A descriptive alternative to the style name is “hand-painted anime illustration with soft brush textures, expressive environments, and natural lighting”; supply it only if needed.

## Placement

Convert the selected output to metadata-stripped WebP under `public/assets/blog/<slug>/`, using `cover.webp` for the cover. Add `coverImage` and `coverAlt`, or a standard Markdown image reference for a body image. Name Alex in alt text when he is depicted. Follow [AGENTS.md](../../../../AGENTS.md#adding-images-agent-guidance) for genuine WebP checks and responsive variants. Inline images should clarify the argument, example, or scene rather than fill space.
