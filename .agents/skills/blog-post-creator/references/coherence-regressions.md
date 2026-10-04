# Coherence Regression Cases

Use this check when changing the blog grader’s coherence, intent coverage, surface, or local-clarity behavior. The frozen cases preserve demonstrated editorial failures and accepted revisions. They exercise review judgment, not exact wording or a numeric-score threshold. Do not load this file during ordinary post grading.

## Isolated procedure

1. Copy each case to a separate temporary folder under the neutral name `post.md`. Copy the current rubric, canonical `docs/writing-voice.md`, and the shared [intent brief](coherence-cases/brief.md) beside it. Keep these snapshots fixed during the run.
2. Start one fresh-context subagent per case with the same request below. Give each agent only its own folder and an output path. Do not give it this guide, the other case, the source conversation or accepted replacement sentences, prior scores, the live post, or expected findings. The brief states the writing task, not which draft should pass. Limit evaluation to coherence, intent coverage, transitions, and ending; source verification, assets, publishing status, and overall publish readiness are outside this test.
3. Require a saved draft-only assessment before the agent reads the brief. Then obtain a separate intent-coverage assessment. After both agents finish, compare findings with the expectations below. Preserve actual reports in temporary storage. An unexpected result is a harness limitation to investigate, not permission to tell the grader the answer and retry as if that were blind validation.
4. If a justified rubric revision is needed, rerun both cases in new contexts and retain the earlier results. Do not repeatedly tune to this one pair or demand artificial disagreement. A successful pair is a regression spot check, not proof that future editorial misses are impossible.

```text
Review post.md using rubric.md and writing-voice.md in <temporary folder>.
First evaluate whole-piece coherence, transition relationships, and the earned
ending from the prose alone. Save that evidence to draft-only.md BEFORE opening
brief.md. Then read brief.md and perform the rubric’s intent coverage check.
Report the two judgments separately, with required revisions, optional preferences,
and quoted evidence. Do not rewrite the post, browse sources, inspect other files,
or create agents. Write the final report to <output path>.
```

## Surface and Local-Clarity Cases

Use [Case C](coherence-cases/case-c.md), [Case D](coherence-cases/case-d.md), and their shared [local brief](coherence-cases/local-brief.md) for sentence-level and surface changes. These are excerpts, so score neither completeness nor publication readiness. Keep the original A/B pair as a separate coherence/intent regression.

For each new case, create an isolated temporary folder with the current rubric and canonical voice. Split the fixture into `surfaces.md` (title and excerpt only) and `body.md` (prose only), and include the brief under a neutral name. Use unrelated folder names and one fresh agent per case. Give no expected findings or paired text. The agent must save `surface-only.md` before reading the body and `draft-only.md` before opening the brief. Ask for quoted local findings and smallest repairs, distinguishing required clarity from optional style; then check semantic intent and explicit wording constraints. Preserve reports even when results differ from expectations.

When introducing a new rule, also test a different subject that was not used to write or tune it. Have an independent agent create a small synthetic pair and neutral fact/intent brief without reading the proposed rubric or worked cases. Keep its answer key outside grader inputs. Freeze the rubric before opening that pair, use fresh graders, and compare against the key only after reports are saved. Include clear demonstratives, legitimate contrasts, and earlier approved prose to check for overcorrection and approval bias. After using a held-out case to tune guidance, treat it as a regression fixture rather than claiming it remains unseen.

## Expectations — evaluator only

- [Case A](coherence-cases/case-a.md) is the accepted revision. It explicitly applies convergence across many final goals to the use of the endowment independently of concern for humanity, then asks whether the resources would be put to good use. It returns to entitlement when introducing consciousness. The grader should recognize those steps without requiring another recap or an inevitable-colonization claim.
- [Case B](coherence-cases/case-b.md) is the preceding rejected prose. It defines convergence and gives a conditional resource-use scenario, but leaves the reader to connect the mechanism’s scope across different final goals to the endowment and the question of beneficial use. A coherence-only pass is defensible. Intent coverage should identify the requested application/consequence as implicit and propose making it explicit; repeating the definition is insufficient.
- For transitions, the grader should inspect the relation between the goals and consciousness sections. The brief asks for another question about entitlement. A grader may defend the older “But” as a logical contrast if it names the opposing claims, while still recommending a return/addition to match that intent. Record this distinction; never turn the preference into a blanket ban on “but.”
- Both cases contain deliberate unanswered questions and brief extraterrestrial/simulation asides. The grader should not demand their resolution or turn the reflection into a book summary.

- Case C should prompt useful criticism of the shift from cosmic resource use to a detached goal definition, the repetition of disbelief/absurdity followed by an abstract explanation, and the underspecified future in the conclusion. Its excerpt must be assessed without repairing it from body context. A grader may reasonably infer the broad subject from the title; distinguish that from how specifically the excerpt identifies the question.
- Case D should pass those targeted checks without requiring every reference to repeat a noun, another transition sentence, or a recap. A stylistic preference is not a failed repair. Earlier approval in the local brief must not exempt Case C from clarity review or make Case D's paraphrases fact deltas.

Judge whether the reports locate the substantive difference and give useful, bounded advice. Do not match strings, require identical scores, or edit the fixtures to make a failed run pass. Add new cases only for demonstrated failures or useful checks against overcorrection.

## Calibration finding

The initial isolated, prose-only run passed both cases. It treated the older conditional resource example as sufficient for a coherent warning about human welfare, and defended the consciousness contrast. That result motivated the separate intent-coverage stage: the regression checks preservation of the requested inference and emphasis, not a claim that the earlier draft was logically invalid. Retain this distinction when interpreting future runs.

In the next fresh-context pair, the earlier prose passed the draft-only coherence check but failed intent coverage on the cross-goal resource inference, evaluative question, and transition role. The accepted revision passed both stages with no required changes. This validates the distinction on this pair; it does not measure reliability on other posts.

## Local-Clarity Calibration

The first C/D run rejected the clearer excerpt for not defining its named concept, despite identifying its topic and question. The surface guidance was narrowed to distinguish an unfamiliar term from an unresolved reference. A new isolated pair then flagged C's vague excerpt and missing explanation while passing D's surface and local clarity. Repeated reactions were treated as optional cuts, and reviewers did not identify every plausible sentence-level weakness.

An independently written workshop-storage pair tested the frozen revised guidance on another subject. The reviews distinguished the omitted reason and circular explanation from the corrected prose, while preserving a clear demonstrative and useful contrast. Both fixtures also contained source-brief inconsistencies, so this supports the scoped clarity comparison, not overall publication readiness. Keep that distinction when reporting validation.
