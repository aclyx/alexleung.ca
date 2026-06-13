# Cover Prompt Template

Use this template to generate a prompt for a blog cover image. Assume the user will provide a reference image of Alex to the image model.

## Prompt Requirements

- Match scene to the blog thesis and emotional tone.
- Default to Ghibli-style visual direction unless asked otherwise.
- Instruct the model to use Alex's reference image for facial likeness.
- Keep composition readable as a thumbnail and as a wide blog cover.
- Keep visuals grounded, specific, and content-revealing rather than purely atmospheric or decorative.
- Avoid text overlays, logos, and busy backgrounds.

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
Do not add any text, watermark, logo, or extra faces.
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
Do not add any text, watermark, logo, or extra faces.
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
