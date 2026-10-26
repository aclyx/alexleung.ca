---
title: "Farming Expensive Agent Sessions"
date: "2026-06-14"
updated: "2026-10-24"
excerpt: "I’m using expensive agent sessions to refine the instructions that tell Codex how I want the work done."
coverImage: "/assets/blog/farming-expensive-coding-agent-sessions/cover.webp"
coverAlt: "Illustration of Alex in a straw hat holding a basket of vegetables in a sunlit field"
tags:
  - "AI"
  - "Developer Workflow"
  - "Reflection"
series: "AI Tools and Workflows"
seriesOrder: 4
draft: false
---

I’m spending far more tokens on coding agents than I used to, and I’m fine with that. I’m using the sessions to encode my preferences and taste so Codex can get the next task right. I call this “farming the session”: asking Codex to reflect on what went wrong and save the fixes in `AGENTS.md` or the relevant skill.

I want the review to recover the preference behind each correction. “Too wordy” might mean repeated points should go while detailed reasoning stays. If that becomes “write shorter answers,” Codex can obey the new rule and still miss what I wanted. Reading the feedback alongside the original request and draft gives it the context to propose a more precise instruction.

I also have automated jobs review sessions for workflow improvements, so the process doesn’t depend entirely on remembering to ask during each conversation. Looking across sessions can reveal the same preference in several corrections, which can then be consolidated into the existing guidance. Blog-specific feedback belongs in the writing skill, and a correction to an existing rule should revise it rather than sit beside it. A proposed change should point to the feedback behind it, so I can check that the new instruction reflects my taste.

Once the guidance is saved, the next test is whether Codex can use it without the original conversation. A successful retry in the same session still has my corrections in context; an [eval](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) can compare old and revised instructions over several fresh runs on new tasks. I’d like to one-shot every task I give an agent. Until then, I’ll keep iterating on these sessions and farming them.
