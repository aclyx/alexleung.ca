---
title: "Farming Agent Mistakes"
date: "2026-06-14"
updated: "2026-08-29"
excerpt: "When a coding agent makes a repeatable mistake, I try to keep the correction in the harness for the next run."
coverImage: "/assets/blog/farming-expensive-coding-agent-sessions/cover.webp"
coverAlt: "Illustration of Alex at a desk watching token-like lights flow from a laptop toward data-centre buildings"
tags:
  - "AI"
  - "Developer Workflow"
  - "Reflection"
series: "AI Tools and Workflows"
seriesOrder: 4
draft: false
---

My coding-agent sessions have become much more token-heavy over the last year. I now ask agents to inspect the repository, run checks, compare approaches, and revise the work instead of stopping at the first plausible answer. The part I most want to keep from that extra work is what happens after an agent makes a mistake.

When the miss is specific and likely to recur, I try to put the correction into the harness around the next run. I think of that as farming the mistake.

## Keeping the correction

A correction can become a clearer prompt, a test, a grader rule, a skill note, or a required check. Where it belongs depends on the failure. An ambiguous instruction should be clarified near the task. Incorrect behavior that passed should become a test. A polished answer that misses the requested point may need a grader.

This post produced that last kind of correction. An earlier draft turned the idea into generic advice about knowing when to stop a long session. The prose was clean, but it answered a neighboring question. I changed the blog workflow so a fresh grader receives the stated takeaway with the draft and checks whether the title, excerpt, body, and ending preserve it.

Not every miss deserves a new rule. Some are local judgment calls, and every harness change adds context and maintenance. I keep the corrections I can describe precisely and expect to need again. The transcript can then disappear without taking the useful part of the correction with it.

## Getting closer to one shot

I would love to reach a point where I can one-shot every task I give an agent. That is an aspiration, not a description of how the work goes today. Ambiguous and unfamiliar tasks still need judgment, and even familiar work can fail in a new way.

Farming mistakes is how I try to move toward that goal. When a useful correction becomes part of the harness, the next run starts with something the previous run taught me. Over time, I want the system to make fewer old mistakes so I can spend more attention on the new ones.
