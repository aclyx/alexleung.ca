---
title: "The Review Bottleneck in AI-Assisted Coding"
date: "2026-02-03"
updated: "2026-10-24"
excerpt: "Agents can implement tasks in parallel; reviewing plans, checking edge cases, and coordinating the work still fall to me."
coverImage: "/assets/blog/from-coder-to-orchestrator/cover.webp"
coverAlt: "Illustration of Alex reviewing code, test results, and a written plan at his desk"
tags:
  - "AI"
  - "Developer Workflow"
series: "AI Tools and Workflows"
seriesOrder: 1
---

In early 2024, I used AI mostly for snippets, error explanations, and small refactors. By 2026, I was handing agents larger tasks and spending more of my attention on constraints, review, and the edge cases they missed. Implementation could run in parallel, but the plans and finished changes still came back to me.

## Reviewing the plan before the code

With Cline, I kept to straightforward work such as boilerplate, test scaffolding, and repetitive refactors. Larger tasks took too much prompt back-and-forth, and code that looked reasonable could still be wrong in ways that were hard to spot. In 2025, I switched to Claude Code and began asking for a plan before implementation.

Reviewing the plan gave me an earlier chance to challenge the scope. Plans were often overbuilt for the problem; questioning the approach before implementation meant I could address that without first reviewing the code it produced. But the agent would still report “done” before handling edge cases. Agreeing on a plan settled what to attempt, while reviewing the result was how I checked whether it had actually been done.

## Repository context and checkpoints

Many mistakes came from missing repository context, so I keep architecture preferences, testing requirements, and coding conventions in the repository guidance. Those instructions carry decisions that apply across tasks. The task brief can then concentrate on the particular change, including its constraints and non-goals, instead of making the agent infer both the local conventions and the request at once.

I often separate planning from implementation and turn the brief into checkpoints, running build, lint, and tests at each one. That gives me intermediate results to inspect.

This works best when the repository records the context behind its decisions. Agents still struggle with undocumented history, and frequent tool calls and retries add to the cost of a session. But that cost is worth it, as delegating implementation lets me spend more time on decision-making, analysis, and bringing my own taste to the work.
