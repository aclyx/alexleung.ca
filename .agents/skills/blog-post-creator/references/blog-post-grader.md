# Blog Post Grader

Use this rubric to grade alexleung.ca blog drafts before publishing. It operationalizes the canonical [writing voice](../../../../docs/writing-voice.md); the goal is fit with Alex's voice, not generic polish.

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
- Preserves the supplied mechanism, intended scope, and explicit future aspiration. Concrete examples demonstrate the broader idea without replacing it.
- Preserves the takeaway semantically without restating it after every section or across every editorial surface.

### 2. Concrete Grounding: 15 points

- Opens from a concrete behavior, object, constraint, or observed change when the post is reflective.
- Orients the reader in the first sentence by naming the subject, workflow, object, or setting before moving into comparison, measurement, or interpretation.
- Uses specific examples, facts, mechanisms, or comparisons instead of abstract framing.
- Distinguishes logistical specificity from lived material. Place names, times, distances, and route sequence establish orientation but do not by themselves count as a lived observation.
- Pays off salient setups such as new gear, excess supplies, or difficult travel with a user-supplied result, evaluation, trade-off, consequence, or preference when the post depends on them.
- Lets concrete details stand when they already carry the point; any following interpretation adds a distinct consequence, decision, or changed understanding.
- Research-backed claims are dated when needed and linked to credible sources.

### 3. Alex Voice Fit: 20 points

- Uses first person when grounding Alex's own experience or judgment and stays measured and direct elsewhere.
- Feels technically grounded and clearly experienced through clarity, evidence, mechanisms, and trade-offs rather than self-description.
- Makes supported claims with quiet confidence instead of drifting into promotion, vagueness, or unnecessary hedging.
- Balances rigor with warmth, curiosity, approachability, and a human perspective rather than becoming sterile.
- Avoids hype, influencer packaging, recruiter language, slogans, and broad future-of-work claims.
- Avoids polished thesis scaffolding, rhetorical contrast templates, decorative metaphors, and phrasing that sounds like it is performing sophistication.
- Avoids draft-wide density of balanced contrasts, tidy inventories, generic evaluations, and recap sentences that makes the voice feel generated.

### 4. Structure and Flow: 15 points

- Each section advances one clear claim.
- The form fits the genre instead of defaulting to an orientation, 2-4 headings, and a closing moral.
- Paragraph cadence is varied and mostly multi-sentence.
- Transitions make the argument feel continuous rather than assembled from notes.
- The ending fits the genre: it may return to an argument's tension, stop on a personal or travel scene, or leave a case study with a concrete limit or next experiment. It does not append a generic moral.

### 5. Truthfulness and Scope Control: 15 points

- Preserves user-provided facts exactly.
- Matches the source-fact ledger in actor, value, scope, precision, and causal, temporal, or comparative relationships.
- Does not invent anecdotes, metrics, usage duration, ownership, or confidence.
- Marks uncertainty honestly instead of converting it into a polished conclusion.
- Keeps future aspirations clearly bounded as goals rather than presenting them as current capabilities or guarantees.
- Does not add links to later-dated posts without intentionally updating chronology metadata.

### 6. Blog Surface Fit: 10 points

- Title, excerpt, tags, headings, cover alt text, and metadata feel like the same editorial system.
- Title and excerpt name the concrete subject before its abstract category or lesson.
- Title is concise, spoken, and subject- or mechanism-specific, not a category label, clickbait frame, or clever essay title.
- Headings are plain and literal unless the post has already earned a more essayistic frame.
- Tags are precise and non-overlapping.

### 7. Visual and Asset Fit: 10 points

- Cover or inline imagery reveals the actual subject, object, state, or thesis.
- Generated images are grounded and content-revealing, not decorative filler.
- Images with Alex refer to Alex by name in alt/caption-style metadata.
- Inline images are only present when they clarify the argument or make a model/example inspectable.
- Every served raster blog source and generated variant uses a `.webp` extension and contains genuine RIFF/WEBP bytes. Playwright PNG baselines are test artifacts and are outside this check.

## Blocking Issues

Mark a grading result as blocked even if the numeric score is high when any of these are present:

- Any fact delta against the supplied ledger: an invented or unsupported personal detail, a changed actor, value, scope, or qualifier, or an added causal, temporal, or comparative relationship.
- A personal or travel draft missing either a supported condition, scene, or observation or a supported reaction, evaluation, consequence, trade-off, or preference, unless the user explicitly requested a bare trip log or caption-led photo essay.
- A misleading factual claim, stale current-state claim, or unsupported statistic.
- Tone that reads as hype, self-promotion, influencer packaging, corporate or resume language, sterile formality, or unsupported vagueness.
- A dominant pattern of balanced contrasts, polished lists, generic interpretations after concrete details, or recap sentences that makes the draft read as templated.
- A structure that closely repeats recent posts despite a different genre or subject, especially the same context block, heading count, and closing moral.
- A reflective opening that summarizes meaning before showing the concrete experience.
- A reflective opening that begins with a comparison, metric, or time jump before naming the actual subject or context for the reader.
- A draft that replaces the user's stated main takeaway with a nearby generic takeaway, such as "know when to stop", "treat it as an operating signal", or "tokens per decision".
- A draft that narrows a stated general philosophy to one concrete example, or omits an explicit future aspiration that materially defines the user's intended story.
- For AI-agent/token-use posts, missing the harness or feedback-loop mechanism when the user explicitly identified it as the point.
- Titles or headings that rely on clever frames, point/lever metaphors, or transformation slogans after the user asked for a plainer style.
- Missing required frontmatter or broken asset references.
- A served raster blog source or generated variant is not genuine WebP, including a PNG or JPEG renamed with a `.webp` extension.
- A new post marked `draft: false` before the current prose passes this full grader, unless the user explicitly waived the editorial gate.

## Fresh-Context Grading Prompt

Run the grader in a fresh subagent context. Pass only the target post, this rubric, a verbatim source-fact ledger that preserves actors, values, scope, precision, and stated relationships, any explicit user-selected bare-log or caption-led-photo-essay mode or editorial-gate waiver, and 3-5 other recent published posts for corpus comparison. Do not pass the author's rationale, known weak spots, previous score, or planned fixes. The comparison posts are evidence for repeated patterns, not style templates.

Use this prompt shape:

```text
Use the attached blog-post grading rubric to grade the draft at <post path>. Work independently from the authoring agent. Return:

1. Score out of 100.
2. Blocking issues, if any.
3. Main-takeaway fidelity: pass/fail, naming the stated takeaway if one was supplied and quoting where the draft lands it.
4. Opening orientation: pass/fail, with the first sentence quoted or referenced.
5. Surface style: pass/fail for a subject-first title and excerpt plus appropriate headings.
6. Category scores with one-sentence rationale each.
7. The top 3 revision priorities, ordered by expected score impact.
8. Any sentence or section that feels off-tone for Alex's blog voice.
9. Pattern density: pass/fail for balanced contrasts, lists, generic interpretations after details, and recaps, citing representative clusters rather than enforcing a word quota.
10. Corpus distinctiveness: pass/fail against the supplied recent posts, naming any repeated opening, section, transition, or ending template.
11. Experiential sufficiency: pass/fail for a personal or travel post; not applicable otherwise. For a personal or travel post, quote both the supported condition, scene, or observation and the supported reaction, evaluation, consequence, trade-off, or preference that make the piece more than an itinerary; logistics alone do not satisfy this check.
12. Fact delta: pass/fail. Identify any claim that does not map to the source-fact ledger with its actor, value, scope, precision, and causal, temporal, or comparative relationships intact.

Do not rewrite the post. Keep the report concise and evidence-backed with file/line references where possible.
```

## Authoring Loop

1. Build a verbatim source-fact ledger that preserves actors, values, scope, precision, and only the causal, temporal, or comparative relationships the user stated. Record the main takeaway as part of it when one was supplied.
2. For personal and travel posts, confirm that the source material contains both required kinds of lived material. Ask one bundled follow-up if either is missing, unless the user requested a bare trip log or caption-led photo essay.
3. Draft or revise the post locally while keeping a new post at `draft: true`.
4. Run a fact-delta check against the ledger, then confirm that the title, excerpt, and first sentence name the concrete subject before comparison or interpretation.
5. Check the full draft for clusters of balanced contrasts, tidy lists, generic interpretations after concrete details, and recap sentences. Judge density and function, not keyword counts.
6. Supply the ledger and 3-5 other recent published posts to a fresh-context grading subagent using the prompt above.
7. If the score is below 90, any applicable pass/fail check fails, or any blocking issue remains, revise from the highest-impact findings first.
8. Re-run the grader in a fresh context after meaningful revisions.
9. Continue until the score is 90+ with no blocking issues and all applicable pass/fail checks succeed.
10. Set `draft: false` only after the current prose passes and the user asks to publish or preview normally, unless the user explicitly waived the editorial gate.
11. If two grading passes stall below 90 on the same core issue, stop local patching, name the repeated pattern, and ask the user for missing facts or a direction choice instead of smoothing the prose into generic polish.
12. If user feedback exposes a recurring failure and the user asks to improve the harness, update the skill or rubric so future grading catches that failure mode.
