# Blog Image Workflow

Choose an image for what the post needs to show, following the [image rules](../../../../docs/design-system.md#images) in the design system. Pick the medium before writing any prompt:

- **Photograph:** for trips, places, objects, and personal notes, prefer a photo from the post itself when it shows the subject clearly.
- **Screenshot or diagram:** for software, tools, and mechanisms, show the actual interface, output, or structure.
- **Generated illustration:** for subjects with nothing to photograph or capture. Choose a style that suits the subject, and look at the neighboring posts' covers so the archive does not repeat one look or one depiction of Alex.
- **No cover:** acceptable when none of these would show something useful.

## Generated illustrations

Alex need not appear. When he does not, generate directly from the post's subject; do not open Photos or require a portrait reference.

When an image depicts Alex and generated blog imagery is authorized, find a clear likeness reference in Photos, preferably the Alex person album, Favorites, or existing site-relevant photos. Avoid other people's faces unless needed for the post and clearly allowed. Export to a temporary location and inspect it before use. Treat the reference as a likeness source unless the user asks for a direct edit, and avoid copying accidental text or logos. If a required likeness reference is unavailable, explain that limitation and provide the prompt; use a different subject only when consistent with the request.

Adapt this prompt to the chosen subject. Omit likeness instructions when nobody in the image needs a reference.

```text
Create an editorial illustration for a blog post.
Style: <a style suited to the subject, distinct from the neighboring posts' covers>.
Subject: <object, scene, mechanism, or Alex Leung; if Alex is depicted, use the supplied likeness reference>.
Scene: <one concrete scene grounded in the post>.
Composition: readable at thumbnail size and as a wide cover, with the subject clearly visible and away from the left and right edges.
Environment: <details that explain the scene rather than decorative filler>.
Lighting and color: <appropriate to the subject and the site's restrained palette>.
No text overlays, watermarks, or unrelated logos. Do not copy incidental text, branding, or other faces from a reference photo.
Aspect ratio: 16:9 and at least 1600 pixels wide for a cover; choose a suitable ratio for an explanatory body image.
```

If generation is unavailable or intentionally deferred, return the usable prompt.

## Placement

Convert the selected image to metadata-stripped WebP under `public/assets/blog/<slug>/`, using `cover.webp` for the cover. Add `coverImage` and `coverAlt`, or a standard Markdown image reference for a body image. Name Alex in alt text when he is depicted. Follow [AGENTS.md](../../../../AGENTS.md#adding-images-agent-guidance) for genuine WebP checks and responsive variants. Inline images should clarify the argument, example, or scene rather than fill space.
