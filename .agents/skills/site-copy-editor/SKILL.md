---
name: site-copy-editor
description: Create or revise non-blog copy for alexleung.ca, including page prose, headings, navigation, calls to action, metadata, manifests, RSS/feed descriptions, llms.txt, tag descriptions, and structured data. Use when asked to write, edit, polish, simplify, or align site copy outside content/posts/*.md, including one-line label or metadata edits. Use blog-post-creator for blog posts and site-taste-audit for critique-led visual or tone audits.
---

# Site Copy Editor

Create or revise non-blog site copy while preserving Alex's facts, structure, and established voice. Treat visible pages and machine-facing descriptions as one editorial system.

## Voice Standard

- Read and apply the canonical [writing voice](../../../docs/writing-voice.md), including its house style, before editing.
- Default visible prose to first person when Alex is the speaker. Use third person only when the surface convention requires it, such as metadata, structured data, alt text, or captions.
- In alt text and caption-style metadata, name Alex when an image depicts him rather than substituting `a person`.

## Surfaces

These read as one system; check the mirrored ones when any of them changes:

- Page prose and labels: route files under `src/app/`, `src/components/Hero.tsx`, `src/constants/now.tsx`, and `src/constants/navigation.ts`.
- Metadata: page `title` and `description` in route files, site-wide defaults in `src/app/layout.tsx`, `public/manifest.json`, and `public/llms.txt`.
- Feed and structured data: `src/lib/feed.ts` and `src/lib/seo/jsonld.ts`.
- Tag descriptions: `TAG_DESCRIPTIONS` in `src/app/blog/tags/[tag]/page.tsx`.
- Blog titles and excerpts belong to blog-post-creator, but read them alongside the surfaces above.

## Workflow

1. Establish the surface and facts.
   - Identify every affected visible and machine-facing location before editing.
   - Inspect adjacent copy so the revision fits the page rather than reading as an isolated sentence.
   - Preserve supplied facts, chronology, scope, and uncertainty. Do not invent experience, outcomes, ownership, or duration, and do not add usage phrases such as `over time` or `in practice` unless the user established that scope.
   - Separate factual content from promotional framing already present in a draft. Do not preserve qualitative titles or claims merely because the source copy asserts them.
   - When a brief instruction such as `do it` follows a discussion with several plausible options, state the chosen interpretation before editing labels or short copy.

2. Draft or revise from substance.
   - Prefer revising existing copy over replacing it wholesale unless the current structure causes clarity or tone problems.
   - Name the actual subject, mechanism, constraint, decision, or result when it is known.
   - Use direct labels and ordinary nouns and verbs. Keep claims proportional to the evidence.
   - Use credentials, project history, and domain experience as factual context when relevant, not as a pitch.
   - Preserve warmth and curiosity through relevant human context, not slogans, flourishes, or generic friendliness.

3. Fit the surface.
   - Keep navigation and calls to action brief and literal; use the canonical voice for editorial headings.
   - Use site-representative language rather than recruiter-optimized phrasing in top-level labels such as the homepage headline, page titles, section names, and metadata.
   - Keep page prose cohesive, first-person when Alex is speaking, and specific enough to establish context.
   - Keep metadata and structured summaries durable, representative of the whole site, and readable rather than keyword-stacked. Avoid quickly stale current-state details unless the surface is intentionally time-stamped, such as the body of the Now page. Leave SEO phrases to supporting copy and descriptions rather than forcing them into headings, and do not add `meta keywords` without a concrete downstream use.
   - Describe what a tag or series covers, not which posts it currently contains, so the description survives the next post.
   - Keep technical copy precise enough to reveal behavior and trade-offs without assuming unnecessary jargon.
   - Do not add emphasis styling such as bold inline links unless the page already uses that pattern or the user asked for it.

4. Run a coherence and deviation pass.
   - Read the affected copy together, including mirrored descriptions.
   - Compare the result with `docs/writing-voice.md`; remove surface-specific drift such as keyword stacking, corporate or resume framing, and generic smoothing.
   - Remove unsupported certainty and unnecessary hedging. Retain clear, bounded judgment.
   - Do not repeat one positioning sentence or topic list across the hero, metadata, manifest, feed, `llms.txt`, and JSON-LD. Keep them directionally consistent in wording suited to each surface.

5. Verify the result.
   - Re-read the full affected page or generated surface, not only the changed lines.
   - Check that factual claims still match their source and that personal and technical material remain proportionate.
   - If copy changes layout or wraps differently at breakpoints, inspect the rendered result at mobile and desktop widths.
   - Follow the repository verification requirements in `AGENTS.md` for file changes.

## Final Checks

- The copy matches `docs/writing-voice.md` across every affected surface.
- Clarity and substance carry the authority; the prose does not describe its own importance.
- The surface sounds like the same person as the rest of the site without becoming duplicated copy.
- Near-synonym pairs and clauses that do not add distinct meaning are collapsed.
- Self-descriptive titles and qualitative claims are grounded in supplied facts or removed.
- No facts, implications, or experiential claims were added beyond the available evidence.
