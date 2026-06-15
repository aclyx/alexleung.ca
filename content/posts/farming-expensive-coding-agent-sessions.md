---
title: "Farming Expensive Coding Agent Sessions"
date: "2026-06-14"
excerpt: "My coding-agent sessions are more expensive now. The useful spend is the part that turns mistakes into better tests, graders, prompts, and checks."
coverImage: "/assets/blog/farming-expensive-coding-agent-sessions/cover.webp"
coverAlt: "Illustration of Alex at a desk watching token-like lights flow from a laptop toward data-centre buildings"
tags:
  - "AI"
  - "Developer Workflow"
  - "Reflection"
series: "AI Tools and Workflows"
seriesOrder: 5
draft: false
---

My AI coding workflow is much more token-heavy than it was a year ago. The output side is easy to feel: I ship more code and move projects faster, and by that yardstick I feel something like 10x faster. The uncomfortable comparison is that my token usage has probably grown by far more than 10x. The part I have not settled is whether the value I get from the extra intelligence is proportional to the tokens I now spend.

The accounting that makes sense to me is not a clean ratio. A costly session is easier to justify when it leaves behind something reusable: a better test, a sharper grader, a clearer prompt, or a note in the harness that makes the next run less likely to miss the same thing.

For me, "farming" is just keeping the useful correction from the expensive session: the thing that should make the next run cheaper, clearer, or more reliable.

## What tokens actually measure

A token is not a thought or a unit of quality. It is text chopped into model-readable pieces. [OpenAI's help docs](https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-do-i-count-them) split usage into input, output, cached, and reasoning tokens, which already hints at the problem: in an agentic workflow, the meter includes the prompt, conversation history, repo context, tool output, retries, and internal reasoning, not just the final code.

The meter is still useful because it is what the system can bill and allocate. But it is a poor proxy for value. A longer run can be worthwhile if it catches a bad direction before I commit to it. A shorter run can still cost time if I accept the answer too quickly and have to unwind it later.

That is why I do not want to judge an expensive session only by its final patch. If the run exposes a weak check or an ambiguous instruction, that can be part of the value too.

## Why sessions got larger

In June 2026, the pricing pages themselves reinforce this. [OpenAI](https://openai.com/api/pricing/) and [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) both describe current model usage in millions of tokens, with output priced higher than input and cached context priced lower than fresh context. The natural unit is no longer a single prompt. It is a large bundle of context, tool output, revisions, and generated text.

My sessions now look more like that bundle than a single prompt. I do not treat tokens like a scarce request quota anymore; I ask agents to inspect more files, draft plans, run checks, compare alternatives, and keep going after the first answer.

The trade-off is that the same habit can be both useful and wasteful. Extra context can mean the agent keeps reading after the useful context is already in view, or keeps polishing after the answer is clear. It can also be the thing I am paying for: enough context to compare paths, run the checks, and make a decision with less manual backtracking.

The useful version is not just a longer transcript. It is a session that surfaces a failure mode I can do something with: a missing test, a vague instruction, a grader that should have caught the issue, or a check that needs to become part of the workflow.

## Speed is easier to feel than durable value

This is where I trust my experience and still want to be careful with it. My own output is much higher than it was a year ago, and the difference is not subtle. I can move from idea to working implementation faster, at least when I measure the work by code output and project speed.

But speed is not the same as value. [METR's May 2026 survey](https://metr.org/blog/2026-05-11-ai-usage-survey/) makes that distinction explicit: technical workers self-reported a median 1.4-2x increase in value from AI tools, while their reported speed increase was 3x. METR also warns that surveys can overstate productivity effects; its earlier randomized trial found experienced open-source developers slower with AI tools in that setting, and its [February 2026 update](https://metr.org/blog/2026-02-24-uplift-update/) says newer tools likely changed the picture. The exact number is less important to me than the distinction: speed is easier to notice than durable value.

That matches the shape of the problem. Once the tool changes how I approach the work, the counterfactual gets blurry. The value is not just "this task took one hour instead of five." It can also be a clearer plan, a faster implementation pass, or more attention left for review. Those gains are real to me, but they do not map cleanly to a token multiplier.

The more durable value is what survives the transcript. When a mistake turns into a test, a prompt constraint, or a better grader, the expensive session has changed the next session too.

## Costs beyond my time

The cost I feel most directly is my own time: waiting for an agent to finish, reading the output, and deciding whether to trust it. The infrastructure cost is easier to ignore because it is not visible in the editor, but it still belongs in the background of the calculation. Behind each response are GPUs, data centres, electricity, and cooling. In 2025, the [IEA projected](https://www.iea.org/news/ai-is-set-to-drive-surging-electricity-demand-from-data-centres-while-offering-the-potential-to-transform-how-the-energy-sector-works) that global data-centre electricity demand would more than double by 2030 to around 945 TWh, with AI as the largest driver.

The IEA projection does not price one agent run. It is too broad for that, and I do not want to pretend it gives me a per-prompt answer. It only keeps cheap tokens from feeling free.

So I bring the accounting back to the session itself. Did the agent remove real uncertainty? Did it produce a result I would actually ship? Did it help me catch a mistake and feed that correction back into the harness? Those questions are narrower, but they are the ones I can act on.

## What I keep from a run

Harness engineering is how I try to ratchet the usefulness up. When I notice the agent making a mistake, I can turn that correction into the system around the next run: a grader, a test, a prompt constraint, a skill note, or a clearer check. The next run still spends tokens, but the spend is less likely to rediscover the same miss.

This post went through a small version of that loop. Earlier drafts kept turning the point into a generic lesson about noticing when a session was busy. That was not the correction I wanted. What I kept from it was a harness change: the blog grader now checks whether a draft preserves the stated takeaway, and the voice notes block AI-tool posts from smoothing harness work into broad productivity language.

That is different from asking for another pass because activity feels productive. More files, more alternatives, and more checks can change the outcome. They can also leave me with more output to review and no better harness.

For me, true marginal value per token comes from that loop. The extra spend should either make the current artifact better, or make the harness more likely to get the next run right when I notice the same kind of mistake.

I still would not go back to the way I worked a year ago. The question is no longer just whether I am spending too many tokens. It is whether the spend is teaching the system around the agent to get the next run right faster.
