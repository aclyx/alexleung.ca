---
title: "The Review Bottleneck in AI-Assisted Coding"
date: "2026-02-03"
updated: "2026-10-12"
excerpt: "Agents can implement tasks in parallel; reviewing plans, checking edge cases, and coordinating the work still fall to me."
coverImage: "/assets/blog/from-coder-to-orchestrator/cover.webp"
coverAlt: "Illustration of Alex reviewing code, test results, and a written plan at his desk"
tags:
  - "AI"
  - "Developer Workflow"
series: "AI Tools and Workflows"
seriesOrder: 1
---

Implementation can run in parallel, but review and coordination still funnel back through me. That is the limit I have not solved in my AI-assisted coding workflow.

In early 2024, I used AI mostly for autocomplete-level work: snippets, error explanations, and small refactors. By 2026, I was using agents for larger tasks. I still write code when needed, but more of my attention now goes to constraints, review, and the edge cases the tools miss.

## Reviewing plans before implementation

I started experimenting with Cline for straightforward tasks such as boilerplate, test scaffolding, and repetitive refactors. I avoided giving it larger tasks because it was easy to get code that looked fine but was wrong in non-obvious ways, and anything non-trivial took too much prompt back-and-forth.

In 2025, I switched to Claude Code and stopped asking for immediate implementation. Instead, I asked for a plan first and reviewed it.

Plans were often overbuilt for the actual problem, and the agent would report "done" before handling edge cases. Plan review gave me a place to question the proposed scope before implementation; it did not remove the need to inspect the result.

## Making the work reviewable

A lot of bad output came from missing repository context, so I keep architecture preferences, testing requirements, and coding conventions in the repository guidance. That gives the agent a baseline to work from, while the task brief supplies the specific constraints and non-goals.

I often split planning and implementation into separate passes, turning the brief into checkpoints and running build, lint, and tests at each one.

## Costs and limits

Frequent tool calls and retries add up, and agents struggle when a system relies on undocumented history.

I can hand off more implementation, but I still have to decide whether the plans fit the problem and whether the resulting changes are ready.
