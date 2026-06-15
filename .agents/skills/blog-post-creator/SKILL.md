---
name: blog-post-creator
description: Create or revise markdown blog posts for alexleung.ca in Alex Leung's established style, including frontmatter, Photos-sourced Alex reference images, generated blog imagery, and independent grader iteration. Use when asked to draft a post, revise existing blog prose, expand notes into publish-ready prose, rewrite content to match house voice, grade or improve content/posts/*.md, generate or place cover/body images, or use imagegen for blog visuals. Do not use for generic copy editing outside the blog.
---

# Blog Post Creator

Use this skill to produce publish-ready markdown posts that match `content/posts/` and the site's understated, concrete voice.

Load references only when needed:

- [voice-and-structure](references/voice-and-structure.md): detailed voice, cadence, and post-shape guidance.
- [post-template](references/post-template.md): frontmatter and file skeleton.
- [cover-prompt-template](references/cover-prompt-template.md): primary and backup cover prompt format.
- [blog-post-grader](references/blog-post-grader.md): scoring rubric and fresh-context subagent prompt for publish-readiness checks.

## Core Voice

- Write in first person when the post draws on Alex's own experience, judgment, or learning.
- Keep tone warm, direct, and measured; avoid hype, slogans, and recruiter-style positioning.
- Show experience through concrete observations, trade-offs, mechanisms, and limits.
- Prefer literal phrasing over abstract framing when the concrete system, UI behavior, or comparison can be named.
- Apply the root `AGENTS.md` taste profile for any title, intro, excerpt, index copy, or cover prompt: concrete, understated, utility-minded, plain-spoken, and specific.
- For personal reflections, lead with the lived detail before the interpretation. Do not manufacture thesis energy with polished setup phrases.
- Let significance emerge from facts and consequences instead of declaring that something "matters" or is "important".

## Hard Constraints

1. Preserve user-provided facts exactly; do not invent anecdotes, metrics, timeline claims, ownership, or hands-on practice.
2. Keep claims tightly bounded to what the user actually said.
3. Avoid repeated one-sentence paragraphs as the dominant cadence.
4. Prefer concise titles and specific excerpts over authority-oriented positioning.
5. For blog titles, prefer a crisp active claim, a concrete object/use case, or a named-tool contrast over generic `Why...` or `Using...` packaging.
6. Use section headings that name the idea of the section, not generic scaffolds like `What`, `How`, `Why`, `The Goal`, or `The Implementation`.
7. Avoid one-off metaphors in blog index headings or section intros unless the surrounding page already supports that metaphor; plain labels usually fit this site better.
8. Do not turn learning notes, project writeups, or personal reflections into portfolio pitches.
9. Avoid intro scaffolding that announces a thesis before showing the experience: rhetorical contrast, abstract significance framing, or decorative labels for mood/place/context.
10. If the user corrects tone more than once, stop incremental patching. Reread the full piece, identify the repeated failure pattern, and revise the affected section from concrete facts outward.
11. Preserve the user-stated main takeaway as the spine of the title, excerpt, section path, and ending. Do not replace it with an adjacent generic lesson.
12. For AI-workflow reflections, keep harness mechanisms explicit when they are the point: tests, graders, prompts, skill notes, checks, feedback loops, and marginal value per token.
13. For new-post drafts, include cover prompts by default unless the user asks for post-only output.

## Workflow

1. Capture facts and intent.
   - Identify topic, thesis, audience, and depth target: learning note, technical explainer, reflection, or compact reflective piece.
   - Record the user's stated main takeaway verbatim, especially if they name a mechanism or correction loop.
   - Lock facts around actors, versions, decisions, ownership, and scope boundaries.
   - Mark assumptions instead of filling gaps with invented detail.

2. Choose the shape.
   - Open with context and a clear point of view in the first paragraph.
   - Make the first sentence orient a cold reader by naming the subject, workflow, object, or setting before using a comparison, metric, or time jump.
   - Make the title, excerpt, headings, and ending point at the recorded takeaway, not merely a nearby theme.
   - Use 2-4 `##` sections when structure helps; short reflective pieces may omit headings.
   - Make each section advance one concrete claim with supporting detail.
   - End with synthesis, a changed understanding, or a specific forward point.

3. Draft or revise in house voice.
   - Prefer cohesive multi-sentence paragraphs.
   - Replace broad framing with the exact constraint, mechanism, symptom, or comparison.
   - For personal updates, keep the opening close to the actual scene, action, object, constraint, or observation before adding a conclusion.
   - Use plain, literal titles and headings when the user pushes back on style. Avoid clever frames, point/lever metaphors, and transformation-style titles unless the user asks for them.
   - Use lists only when they improve scanning.
   - Keep technical trade-offs and limitations explicit.

4. Apply repo format.
   - Use [post-template](references/post-template.md) for new files under `content/posts/`.
   - Keep filenames slug-safe: lowercase words joined by hyphens.
   - Use 2-4 tags and prefer existing site tag language when possible.
   - Include `updated` only when materially revising an existing post.

5. Generate and place blog images when appropriate.
   - Use [cover-prompt-template](references/cover-prompt-template.md).
   - Default visual direction to Ghibli-style unless the user asks for another style.
   - For covers or body images that depict Alex, use Photos to find a clear reference photo of Alex by default when the user has authorized generated blog imagery. Prefer the Alex person album, Favorites, or existing site-relevant photos; avoid photos with other people's faces unless the post needs them and the user has clearly allowed that.
   - Export the reference photo to a temporary workspace location, inspect it, and use imagegen for the final blog asset. Treat the photo as a likeness reference only unless the user asks for a direct edit or transformation.
   - Save final generated assets under `public/assets/blog/<slug>/`, prefer WebP source assets, add `coverImage`/`coverAlt` or markdown image references, and run the image variant workflow when adding or changing image sources.
   - Feel free to generate inline/body images when they make the post more concrete or inspectable. Do not add decorative images just to fill space.
   - Keep the scene readable at thumbnail size and avoid text overlays.

6. Grade and iterate.
   - Use [blog-post-grader](references/blog-post-grader.md) for new posts and meaningful revisions unless the user explicitly asks for a rough draft only.
   - Run the grader in a fresh-context subagent. Pass the post artifact, the grader rubric, and essential user-provided facts, including the exact main takeaway if the user supplied one; do not pass author rationale, known weak spots, previous scores, or intended fixes.
   - Revise from the highest-impact findings first, then re-run a fresh-context grading pass.
   - Continue until the score is 90+ with no blocking issues. If two passes stall below 90 on the same issue, stop smoothing locally and ask the user for missing facts or direction.
   - When the user asks to improve the harness after feedback, update the relevant skill, voice, or grader guidance so the failure is caught before the next draft.

## Output Modes

- **Draft + generated imagery**: default for new-post creation when imagegen and a usable Alex reference photo are available.
- **Draft + cover prompt**: fallback when imagegen, Photos access, or a usable reference photo is unavailable.
- **Full draft**: complete markdown with frontmatter and final prose.
- **Revision pass**: edited markdown that preserves the user's facts.
- **Outline-first**: frontmatter plus sectioned outline before drafting, when requested.
- **Graded revision**: draft or revise, then iterate against the independent grader until the post scores 90+ without blockers.

## Final Checks

- Argument is cohesive from opening to close.
- Paragraph cadence is varied and mostly multi-sentence.
- Titles, excerpts, headings, and intro copy are specific and modest.
- No inferred facts, inflated claims, or unsupported practice claims were introduced.
- No slogan-like phrasing, draft scaffolding, or repeated synonym pairs remain.
- Personal-reflection openings begin with specific lived details, not abstract contrast or significance framing.
- The first sentence gives enough context to understand the subject before any comparison, metric, or time jump.
- Title, excerpt, headings, and ending preserve the user's stated main takeaway instead of substituting a smoother adjacent lesson.
- If the post is about AI-agent work, the harness or feedback-loop mechanism remains concrete where relevant.
- Cover or body images are saved in the repo and referenced by frontmatter/markdown, or prompt output includes both `Cover Prompt (Primary)` and `Cover Prompt (Backup)` when generation is unavailable or intentionally deferred.
- Fresh-context grader score is 90+ with no blocking issues, unless the user explicitly asked to stop earlier.
