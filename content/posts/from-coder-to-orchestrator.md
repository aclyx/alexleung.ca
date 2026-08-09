---
title: "Planning and Verification in AI-Assisted Coding"
date: "2026-02-03"
updated: "2026-08-02"
excerpt: "How my AI-assisted coding workflow shifted from quick snippets to clearer briefs, review checkpoints, and build/lint/test verification."
coverImage: "/assets/blog/from-coder-to-orchestrator/cover.webp"
coverAlt: "Illustration of Alex reviewing code, test results, and a written plan at his desk"
tags:
  - "AI"
  - "Developer Workflow"
series: "AI Tools and Workflows"
seriesOrder: 1
---

My current AI-assisted coding workflow starts with a short brief, separates planning from implementation, and verifies each checkpoint with build, lint, and tests. More of the leverage now comes from defining the task and checking the result than from asking for code quickly.

That is a change from early 2024, when I used AI mostly for autocomplete-level work: snippets, error explanations, and small refactors. By 2026, I still write code when needed, but I spend more of my attention on constraints, review, and the edge cases the tools miss.

![Timeline diagram comparing software development workflow in 2024 versus 2026](/assets/blog/from-coder-to-orchestrator/swe-workflow-evolution.webp)

## Quick implementation stopped scaling

I started experimenting with **Cline** for straightforward tasks such as boilerplate, test scaffolding, and repetitive refactors. I avoided giving it larger tasks for two reasons. First, it was easy to get code that looked fine but was wrong in non-obvious ways. Second, anything non-trivial took too much prompt back-and-forth.

In 2025, I switched to **Claude Code** and stopped asking for immediate implementation. Instead, I asked for a plan first and reviewed it.

That improved outcomes, but two problems stayed persistent. Plans were often overbuilt for the actual problem, and the agent would report "done" before handling edge cases. The bottleneck moved from writing code to verification.

## Context and a repeatable loop

Three changes made the workflow dependable enough for daily use. For my use cases, newer models have become noticeably better at keeping constraints in context across longer tasks. A lot of bad output also came from missing repo context rather than missing capability, so I now keep project expectations in `CLAUDE.md`. Every new session starts with the same baseline: architecture preferences, testing requirements, and coding conventions.

The biggest improvement was replacing one-pass execution with a repeatable loop:

1. Plan
2. Implement
3. Verify with build/lint/tests
4. Reflect and continue if needed

I often split the work into planning and implementation passes. In practice, that means I write a short feature brief with constraints and non-goals, turn that into checkpoints, let the implementation run through the loop per checkpoint, and then review design and risk rather than just syntax.

Example brief:

> Add Google OAuth using existing `AuthService`. Store tokens in Redis, not SQL.

## The work moved to judgment

A larger share of the work now sits in requirements, constraints, and review discipline. Implementation still matters, but I spend more attention on deciding what to build, writing clearer constraints, and checking whether the result is right.

The workflow also has clear costs:

- **Cost:** Frequent tool calls and retries add up quickly.
- **Legacy code friction:** Agents struggle when systems rely on undocumented history.
- **Personal skill drift:** I type less code directly than I used to.
- **Attention overhead:** Running multiple agents sounds parallel, but review and coordination still funnel through one person. Human attention is limited, and I still don't have a great system for managing that bottleneck consistently.

The diagram below is illustrative; the areas are not measured proportions.

![Illustrative comparison showing more emphasis on architectural intent and less on manual implementation from 2024 to 2026](/assets/blog/from-coder-to-orchestrator/swe-effort-evolution.webp)

One question I keep coming back to is how newer engineers build review judgment if they spend less time in low-level debugging. For my own work, the durable improvement has come from planning the task clearly and verifying what the agent produces at every checkpoint.
