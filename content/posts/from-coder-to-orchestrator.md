---
title: "Planning and Verification in AI-Assisted Coding"
date: "2026-02-03"
updated: "2026-08-29"
excerpt: "My AI-assisted coding workflow now uses short briefs, plan reviews, checkpoints, and build/lint/test verification."
coverImage: "/assets/blog/from-coder-to-orchestrator/cover.webp"
coverAlt: "Illustration of Alex reviewing code, test results, and a written plan at his desk"
tags:
  - "AI"
  - "Developer Workflow"
series: "AI Tools and Workflows"
seriesOrder: 1
---

For AI-assisted coding tasks, I now write a short brief, review a plan before implementation, and run build, lint, and tests at each checkpoint.

In early 2024, I used AI mostly for autocomplete-level work: snippets, error explanations, and small refactors. By 2026, I was using agents for larger tasks. I still write code when needed, but more of my attention now goes to constraints, review, and the edge cases the tools miss.

![Timeline diagram comparing software development workflow in 2024 versus 2026](/assets/blog/from-coder-to-orchestrator/swe-workflow-evolution.webp)

## Quick implementation stopped scaling

I started experimenting with **Cline** for straightforward tasks such as boilerplate, test scaffolding, and repetitive refactors. I avoided giving it larger tasks for two reasons. First, it was easy to get code that looked fine but was wrong in non-obvious ways. Second, anything non-trivial took too much prompt back-and-forth.

In 2025, I switched to **Claude Code** and stopped asking for immediate implementation. Instead, I asked for a plan first and reviewed it.

Plans were often overbuilt for the actual problem, and the agent would report "done" before handling edge cases. Reviewing the plan and running the checks became necessary parts of the task.

## Repository context and a repeatable loop

A lot of bad output came from missing repository context, so I keep project expectations in `CLAUDE.md`. Every session starts with the same baseline: architecture preferences, testing requirements, and coding conventions.

I also replaced one-pass execution with a repeatable loop:

1. Plan
2. Implement
3. Verify with build/lint/tests
4. Reflect and continue if needed

I often split the work into planning and implementation passes. In practice, that means I write a short feature brief with constraints and non-goals, turn that into checkpoints, let the implementation run through the loop per checkpoint, and then review design and risk rather than just syntax.

Example brief:

> Add Google OAuth using existing `AuthService`. Store tokens in Redis, not SQL.

## Costs and limits

The workflow has clear costs:

- **Cost:** Frequent tool calls and retries add up quickly.
- **Legacy code friction:** Agents struggle when systems rely on undocumented history.
- **Personal skill drift:** I type less code directly than I used to.

The diagram below is illustrative; the areas are not measured proportions.

![Illustrative comparison showing more emphasis on architectural intent and less on manual implementation from 2024 to 2026](/assets/blog/from-coder-to-orchestrator/swe-effort-evolution.webp)

The limit I have not solved is attention. Implementation can run in parallel, but review and coordination still funnel back through me.
