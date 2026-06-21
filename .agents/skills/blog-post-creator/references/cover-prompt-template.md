# Cover Prompt Template

Use this template to generate or defer a blog cover image. By default, find a reference image of Alex in Photos, inspect it, and use it with imagegen for facial likeness. Return prompts only when imagegen, Photos access, or a usable reference photo is unavailable or intentionally deferred.

## Prompt Requirements

- Match scene to the blog thesis and emotional tone.
- Default to Ghibli-style visual direction unless asked otherwise.
- Use a Photos-sourced Alex reference image for facial likeness and identity consistency when Alex is depicted.
- Treat Photos references as likeness references only unless the user asks for a direct edit or transformation.
- Avoid reproducing accidental logos, visible text, or brand marks from reference photos unless the user explicitly approves them as part of the intended likeness or scene.
- Keep composition readable as a thumbnail and as a wide blog cover.
- Keep visuals grounded, specific, and content-revealing rather than purely atmospheric or decorative.
- Avoid text overlays, unrelated logos, and busy backgrounds.

## Reference and Placement Workflow

1. Open Photos and find a clear Alex reference photo, preferably from the Alex person album, Favorites, or a recent site-relevant image.
2. Export the chosen reference into a temporary workspace location and inspect it before generation.
3. Use imagegen with the selected prompt. Label the exported photo as a likeness reference, not the edit target, unless the user asked for a direct transformation.
4. Save the selected generated cover under `public/assets/blog/<slug>/cover.webp` when possible.
5. Add `coverImage` and `coverAlt` to the post frontmatter, then run the repo image-variant workflow for added or changed source images.

Use the same judgment for optional body images: add them only when they clarify the argument, make an example inspectable, or add concrete visual context that the prose has earned.

## Primary Prompt Template

```text
Create a cinematic blog cover illustration in Studio Ghibli-inspired style.
Subject: Alex Leung (use the provided reference image for facial likeness and identity consistency).
Scene: <describe one concrete scene that represents the post thesis>.
Mood: <grounded, reflective, optimistic, focused, etc.>.
Composition: medium shot, clear subject silhouette, strong foreground/background separation, clean negative space.
Lighting and color: warm natural light, soft painterly shading, rich but restrained palette.
Environment details: <2-4 specific details tied to the post topic>.
Render intent: polished editorial illustration suitable for a technical blog cover.
Do not add any text, watermark, unrelated logo, or extra faces.
Do not reproduce readable text or accidental brand marks from the reference photo unless the user explicitly approves a specific logo as part of the intended likeness or scene.
Aspect ratio: 16:9.
```

## Backup Prompt Template

Use this when the model rejects explicit "Studio Ghibli" wording.

```text
Create a cinematic hand-painted anime-style editorial illustration with soft brush textures, warm natural lighting, expressive environments, and whimsical-yet-grounded storytelling tone.
Subject: Alex Leung (use the provided reference image for facial likeness and identity consistency).
Scene: <describe one concrete scene that represents the post thesis>.
Mood: <grounded, reflective, optimistic, focused, etc.>.
Composition: medium shot, clear subject silhouette, strong foreground/background separation, clean negative space.
Environment details: <2-4 specific details tied to the post topic>.
Do not add any text, watermark, unrelated logo, or extra faces.
Do not reproduce readable text or accidental brand marks from the reference photo unless the user explicitly approves a specific logo as part of the intended likeness or scene.
Aspect ratio: 16:9.
```

## Return Format

Return prompts in this format:

```text
Cover Prompt (Primary):
<prompt text>

Cover Prompt (Backup):
<prompt text>
```
