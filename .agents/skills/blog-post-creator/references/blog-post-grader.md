# Blog Post Grader

Use this rubric to grade alexleung.ca blog drafts before publishing. The goal is not generic polish; it is fit with Alex's stated taste: concrete, understated, useful, lightly warm, and specific.

## Scoring

Score out of 100. A publish-ready draft should score **90+** with no blocking issue. If a post scores below 90, identify the smallest revision set likely to raise it above 90.

- 90-100: Strong fit. Only minor edits remain.
- 80-89: Usable direction, but the post needs targeted revision before publishing.
- 70-79: Clear idea, but voice, structure, evidence, or scope is not yet reliable.
- Below 70: Rework from the user's facts and thesis before doing sentence-level edits.

## Rubric

### 1. Thesis and Value: 15 points

- Names a real tension, mechanism, or observation rather than a vague topic.
- Makes the reader's takeaway legible without turning the post into a pitch.
- Keeps the claim sized to the user's actual experience and evidence.
- If the user supplied a main takeaway, preserves that mechanism instead of substituting an adjacent generic lesson.

### 2. Concrete Grounding: 15 points

- Opens from a concrete behavior, object, constraint, or observed change when the post is reflective.
- Orients the reader in the first sentence by naming the subject, workflow, object, or setting before moving into comparison, measurement, or interpretation.
- Uses specific examples, facts, mechanisms, or comparisons instead of abstract framing.
- Research-backed claims are dated when needed and linked to credible sources.

### 3. Alex Voice Fit: 20 points

- Sounds first-person, measured, understated, and clearly experienced.
- Avoids hype, influencer packaging, recruiter language, slogans, and broad future-of-work claims.
- Avoids polished thesis scaffolding, rhetorical contrast templates, decorative metaphors, and phrasing that sounds like it is performing sophistication.
- Preserves warmth without overexplaining or self-congratulating.

### 4. Structure and Flow: 15 points

- Each section advances one clear claim.
- Paragraph cadence is varied and mostly multi-sentence.
- Transitions make the argument feel continuous rather than assembled from notes.
- Ending returns to the opening tension and the user-stated takeaway with a concrete forward point.

### 5. Truthfulness and Scope Control: 15 points

- Preserves user-provided facts exactly.
- Does not invent anecdotes, metrics, usage duration, ownership, or confidence.
- Marks uncertainty honestly instead of converting it into a polished conclusion.
- Does not add links to later-dated posts without intentionally updating chronology metadata.

### 6. Blog Surface Fit: 10 points

- Title, excerpt, tags, headings, cover alt text, and metadata feel like the same editorial system.
- Title is concise, spoken, and mechanism-specific, not a category label, clickbait frame, or clever essay title.
- Headings are plain and literal unless the post has already earned a more essayistic frame.
- Tags are precise and non-overlapping.

### 7. Visual and Asset Fit: 10 points

- Cover or inline imagery reveals the actual subject, object, state, or thesis.
- Generated images are grounded and content-revealing, not decorative filler.
- Images with Alex refer to Alex by name in alt/caption-style metadata.
- Inline images are only present when they clarify the argument or make a model/example inspectable.

## Blocking Issues

Mark a grading result as blocked even if the numeric score is high when any of these are present:

- Invented or unsupported personal facts.
- A misleading factual claim, stale current-state claim, or unsupported statistic.
- Tone that reads as hype, self-promotion, or influencer packaging.
- A reflective opening that summarizes meaning before showing the concrete experience.
- A reflective opening that begins with a comparison, metric, or time jump before naming the actual subject or context for the reader.
- A draft that replaces the user's stated main takeaway with a nearby generic takeaway, such as "know when to stop", "treat it as an operating signal", or "tokens per decision".
- For AI-agent/token-use posts, missing the harness or feedback-loop mechanism when the user explicitly identified it as the point.
- Titles or headings that rely on clever frames, point/lever metaphors, or transformation slogans after the user asked for a plainer style.
- Missing required frontmatter or broken asset references.
- A visible/public post still marked `draft: true` when the user asked to publish or preview it normally.

## Fresh-Context Grading Prompt

Run the grader in a fresh subagent context. Pass only the post artifact, this rubric, and any essential user-provided facts that the grader needs to verify scope. Do not pass the author's rationale, known weak spots, previous score, or planned fixes.

Use this prompt shape:

```text
Use the attached blog-post grading rubric to grade the draft at <post path>. Work independently from the authoring agent. Return:

1. Score out of 100.
2. Blocking issues, if any.
3. Main-takeaway fidelity: pass/fail, naming the stated takeaway if one was supplied and quoting where the draft lands it.
4. Opening orientation: pass/fail, with the first sentence quoted or referenced.
5. Surface style: pass/fail for title, excerpt, and headings.
6. Category scores with one-sentence rationale each.
7. The top 3 revision priorities, ordered by expected score impact.
8. Any sentence or section that feels off-tone for Alex's blog voice.

Do not rewrite the post. Keep the report concise and evidence-backed with file/line references where possible.
```

## Authoring Loop

1. Draft or revise the post locally.
2. Write down the user-stated main takeaway before grading. If the user named a mechanism, treat it as an essential fact for the grader.
3. Before grading, check that the first sentence gives enough context for a reader arriving cold. If it starts with a comparison such as "Compared with..." or a measurement frame, revise it to name the actual subject first.
4. Run a fresh-context grading subagent using the prompt above.
5. If the score is below 90 or any blocking issue remains, revise the post from the highest-impact findings first.
6. Re-run the grader in a fresh context after meaningful revisions.
7. Continue until the score is 90+ with no blocking issues.
8. If two grading passes stall below 90 on the same core issue, stop local patching, name the repeated pattern, and ask the user for missing facts or a direction choice instead of smoothing the prose into generic polish.
9. If user feedback exposes a recurring failure and the user asks to improve the harness, update the skill or rubric so future grading catches that failure mode.
