---
name: blog-post-creator
description: Draft, revise, or grade alexleung.ca blog posts, including frontmatter and cover or body imagery. Use for content/posts/*.md and blog writing requests; use site-copy-editor for non-blog copy and site-taste-audit for visual critique.
---

# Blog Post Creator

Write from Alex's facts and intent using the canonical [writing voice](../../../docs/writing-voice.md). Preserve the existing prose where it works. Use [voice-and-structure](references/voice-and-structure.md) for blog surfaces and genre choices, not as a fixed outline.

## Capture the brief

Identify the subject, genre, audience, and requested depth. Record the main takeaway or question, its mechanism and scope, any future aspiration, and what remains unresolved. Do not turn a broader idea into only its most convenient example.

Keep the source-fact ledger in the three parts defined in the grader's [intent and facts check](references/blog-post-grader.md#intent-and-facts). Preserve actors, values, precision, ownership, uncertainty, and stated relationships. Paraphrase meaning faithfully; do not invent biography, practice, chronology, metrics, or confidence. Verify outside factual claims against appropriate sources before including them.

Personal and travel posts need both a supported observation, condition, or scene and a supported reaction, preference, consequence, or trade-off. Reading and an intellectual reaction can provide that grounding. If necessary material is missing, ask one bundled question while continuing work that does not depend on it. An explicitly requested bare trip log or caption-led photo essay does not need added reflection.

## Draft or revise

- Follow the subject's natural structure. Headings, lists, and a concluding paragraph are useful when they help the reader; none has a required count.
- Explain the concepts needed to follow the piece. Make their relevance to its question visible instead of merely listing the source's topics. Keep conditions and uncertainty intact.
- When feedback repeats, reread the whole piece and identify the missing question, reaction, or reasoning before adjusting phrasing. Preserve dry observations and unresolved questions.
- Use [post-template](references/post-template.md) for frontmatter, tags, dates, and file placement. Start a new post at `draft: true`; use the editorial gate below before changing that status.
- Before grading, apply the rubric's [review order and local clarity pass](references/blog-post-grader.md#review-order-and-local-clarity). Do not cut a necessary inference simply because it repeats a noun from a definition.

## Images

For new posts, include suitable generated imagery by default unless the user asks for post-only output or intentionally defers it. Use the [cover workflow](references/cover-prompt-template.md) to choose the subject before deciding whether a likeness reference is needed. If generation or a required reference is unavailable, provide a usable cover prompt and explain the specific limitation. Photos access is not a prerequisite for an image without Alex.

Inline images are optional and should clarify a scene, example, or mechanism. Follow the image storage and variant requirements in [AGENTS.md](../../../AGENTS.md#adding-images-agent-guidance).

## Editorial gate

Use the [blog-post-grader](references/blog-post-grader.md) for new posts and meaningful revisions unless the user asks for a rough draft only. Spelling, punctuation, and small wording edits that preserve meaning need a contextual reread, not the full editorial loop.

1. Prepare separate surface and body snapshots, the full target post and asset paths for the later format check, the current ledger, the rubric and canonical voice, and 3–5 other recent published posts. Include any explicit bare-log/photo-essay mode or editorial waiver.
2. Start a fresh-context grading subagent with only those inputs and an output location. Do not pass the author's rationale, known weak spots, previous scores, or planned fixes. The rubric specifies the reading order and report.
3. Address material findings, then grade meaningful revisions in a new context. If the same issue survives two passes, reconsider the structure and source material. Continue repairs supported by the brief; ask the user only when a missing fact or substantive direction choice blocks progress. Do not repeat cosmetic edits or solicit permission for ordinary editing.
4. Accept the current prose only when it scores 90+ with no blockers and all applicable checks pass. An earlier revision's score or image-only review does not satisfy this gate. Optional preferences do not require another iteration.
5. Set a new post to `draft: false` when the current prose passes and the user asks to publish or preview normally. Only an explicit editorial-gate waiver permits publishing before it passes.

Run the repository verification required by `AGENTS.md` for file changes. Report the result and material limitations without reproducing the grader's entire report.

When asked to improve the harness, amend the rule that owns the demonstrated failure instead of adding another checklist. Run the relevant [isolated regression cases](references/coherence-regressions.md) for changes to editorial behavior. A revised rubric or higher score alone is not behavioral validation.
