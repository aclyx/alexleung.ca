I’m spending far more tokens on coding agents than I used to, and I’m fine with that. I’m using the sessions to encode my preferences and taste so Codex can get the next task right.

I call this “farming the session.” I ask Codex to reflect on what went wrong and save the fixes in `AGENTS.md` or the relevant skill.

If I reject a paragraph as repetitive, banning its opening phrase misses the point. The problem might be that it repeats a claim without adding evidence or explaining a consequence. That distinction belongs in the instruction, so the next agent can recognize the same problem in different wording.

I also have automated jobs review sessions for workflow improvements. Across sessions, a preference can show up through several different corrections. A useful proposal should point back to those corrections so I can check that it captures my judgment.

A request for a terse status update should not become a rule to shorten every explanation. Blog-specific guidance belongs in the writing skill. If a correction contradicts an existing instruction, that instruction needs revising so future agents aren’t left with both versions.

A successful retry in the same conversation still has my corrections in context. An [eval](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) can compare old and revised instructions over several fresh runs on new tasks. The question is whether Codex applies my preference without needing it restated in the prompt. For writing, that means checking whether it cuts filler while keeping the reasoning the task needs.

I’d like to one-shot every task I give an agent. Until then, I’ll keep iterating on these sessions and farming them.
