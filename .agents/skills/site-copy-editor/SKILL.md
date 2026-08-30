---
name: site-copy-editor
description: Create or revise non-blog copy for alexleung.ca, including page prose, headings, navigation, calls to action, metadata, manifests, RSS/feed descriptions, llms.txt, and structured data. Use when asked to write, edit, polish, simplify, or align site copy outside content/posts/*.md. Use blog-post-creator for blog posts and site-taste-audit for critique-led visual or tone audits.
---

# Site Copy Editor

Create or revise non-blog site copy while preserving Alex's facts, structure, and established voice. Treat visible pages and machine-facing descriptions as one editorial system.

## Voice Standard

- Use a calm, direct, technically grounded, and understated voice.
- Build quiet confidence through accurate facts, concrete mechanisms, trade-offs, and observed results rather than self-description or positioning.
- Keep rigorous writing warm, curious, approachable, and human without adding decorative personality.
- Do not confuse understatement with vagueness or humility with hesitation. Make supported claims plainly.
- Default visible prose to first person when Alex is the speaker. Use third person only when the surface convention requires it, such as metadata, structured data, alt text, or captions.
- Apply the root `AGENTS.md` copy guardrails as the canonical standard.

## Workflow

1. Establish the surface and facts.
   - Identify every affected visible and machine-facing location before editing.
   - Inspect adjacent copy so the revision fits the page rather than reading as an isolated sentence.
   - Preserve supplied facts, chronology, scope, and uncertainty. Do not invent experience, outcomes, ownership, or duration.
   - Separate factual content from promotional framing already present in a draft. Do not preserve qualitative titles or claims merely because the source copy asserts them.

2. Draft or revise from substance.
   - Prefer revising existing copy over replacing it wholesale.
   - Name the actual subject, mechanism, constraint, decision, or result when it is known.
   - Use direct labels and ordinary nouns and verbs. Keep claims proportional to the evidence.
   - Preserve warmth and curiosity through relevant human context, not slogans, flourishes, or generic friendliness.

3. Fit the surface.
   - Keep navigation, headings, and calls to action brief and literal.
   - Keep page prose cohesive, first-person when Alex is speaking, and specific enough to establish context.
   - Keep metadata and structured summaries durable, representative of the whole site, and readable rather than keyword-stacked.
   - Keep technical copy precise enough to reveal behavior and trade-offs without assuming unnecessary jargon.

4. Run a coherence and deviation pass.
   - Read the affected copy together, including mirrored descriptions.
   - Remove drift toward hype, self-promotion, corporate or resume language, sterile formality, abstract framing, decorative cleverness, or generic smoothing.
   - Remove unsupported certainty and unnecessary hedging. Retain clear, bounded judgment.
   - Keep surfaces directionally consistent without copying the same sentence everywhere.

5. Verify the result.
   - Re-read the full affected page or generated surface, not only the changed lines.
   - Check that factual claims still match their source and that personal and technical material remain proportionate.
   - If copy changes layout or wraps differently at breakpoints, inspect the rendered result at mobile and desktop widths.
   - Follow the repository verification requirements in `AGENTS.md` for file changes.

## Final Checks

- The copy feels calm, direct, technically grounded, understated, and quietly confident.
- Clarity and substance carry the authority; the prose does not describe its own importance.
- Professional rigor coexists with warmth, curiosity, and a human perspective where relevant.
- The surface sounds like the same person as the rest of the site without becoming duplicated copy.
- Self-descriptive titles and qualitative claims are grounded in supplied facts or removed.
- No facts, implications, or experiential claims were added beyond the available evidence.
