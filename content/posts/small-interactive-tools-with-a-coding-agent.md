---
title: "Coding Agents for Inspectable Browser Tools"
date: "2026-04-10"
updated: "2026-08-29"
excerpt: "Building frontend-only tools for load flow and Mandelbrot zooming gave me concrete ways to inspect older technical models."
coverImage: "/assets/blog/small-interactive-tools-with-a-coding-agent/cover.webp"
coverAlt: "Illustration of Alex using load-flow and Mandelbrot tools across three screens"
tags:
  - "AI"
  - "Developer Workflow"
  - "Reflection"
series: "AI Tools and Workflows"
seriesOrder: 4
---

I started building a small set of frontend-only interactive tools mostly out of curiosity. I wanted to see how coding agents would handle more involved static web applications without server-side components.

That set included a load flow tool and a Mandelbrot explorer. I have since retired the interactive versions as part of simplifying this site, but I am keeping this post as a record of what I learned from building them.

These were useful test cases because they are small enough to live entirely on the client side in a Next.js app, but they still involve interaction, visualization, timing, feedback, state, and sometimes numerical precision. The logic needs to live in the client. They also gave me a compact way to make older technical models inspectable again.

## Load flow in the browser

Earlier in my career, I was more drawn to electrical power engineering than to software. I was especially fascinated by power system analysis tools like PSS/E. The core problem itself was interesting: solve for voltages, phase angles, and power flows in a nonlinear system. Real utility models could be much larger than the IEEE reference cases I was using, so I carried the impression that the solvers themselves were heavy, specialized systems.

That was part of what made building Load Flow interesting. I liked the idea of implementing standard IEEE reference cases directly in the browser and seeing how far I could get in a browser-based version rather than a dedicated desktop application. Instead of treating load flow as something that only lived inside heavyweight desktop tooling, I could look at the network, change inputs, run the solver, and inspect the outputs in one place.

It turns out the IEEE reference cases are relatively small compared to real models I have seen in the past with PSS/E, so they converge pretty quickly. It is still unclear how a bigger model would do in the browser.

Another gap that remains is the single-line diagram visualization. It did not turn out as well as I had hoped. The drag-and-drop behavior, auto-layout, and line-overlap handling all had issues. I suspect those are problems I could improve with more detailed prompting and more time and effort, but they were a useful reminder that getting the solver working is not the same thing as making the interface feel good to use.

## Mandelbrot and precision

The Mandelbrot Explorer came from a different source of curiosity. I originally explored this in a master's degree course, ECE 8893 at Georgia Tech. In that version, we used CUDA with one thread per pixel and GNU multiple precision arithmetic to draw the Mandelbrot set. What still feels satisfying about it is that each time I zoom in, I see something completely new and different, with patterns that feel similar but still distinct. The visible edges of the set are where most of the interesting complexity emerges, so that is a good place to try zooming in.

What I wanted to see on the web was whether I could still handle those same two constraints in a simpler browser implementation: the sheer number of per-pixel computations and the need for multi-precision math. The browser version gets part of the way there by keeping the viewport coordinates in arbitrary-precision decimals, rendering asynchronously, and leaning on lower resolutions to keep interaction usable. That was enough to make deep zooming possible in the browser, even if it is slower than the earlier CUDA-based version.

The current implementation still has a practical precision ceiling: if I zoom too far in, the browser can freeze. I do not remember running into issues at deeper zoom levels in my earlier C++ version using the GNU Multiple Precision Arithmetic Library.

## Inspectable models

The tools work best when they make a model visible instead of leaving it at the level of equations or static notes. Load flow is easier to reason about when I can change a bus input and inspect the voltage and branch-flow results directly. Mandelbrot zooming has the same quality: the tool lets me push on precision, rendering time, and viewport state instead of stopping at a static explanation.

That is also where the coding agent has been most useful. It helped me get started, scaffold the UI, and move through implementation faster. But the useful artifact is the tool, not the transcript. The tool lets me inspect behavior directly. If the behavior looks wrong, I can change the input, rerun the model, or inspect the code instead of stopping at an explanation.

The pattern I want to keep is simple: use the agent to help build a small tool, then test my understanding by pushing on the model directly.
