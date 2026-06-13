---
title: "Relearning Through Small Interactive Tools"
date: "2026-04-10"
excerpt: "Using a coding agent to build small browser tools turned out to be a good way to revisit concepts I had not touched in a while."
coverImage: "/assets/blog/small-interactive-tools-with-a-coding-agent/cover.png"
tags:
  - "AI"
  - "Learning"
  - "Reflection"
series: "AI Tools and Workflows"
seriesOrder: 4
---

I started building a small set of frontend-only interactive tools mostly out of curiosity. I wanted to see how coding agents would handle more involved static web applications without server-side components.

So far, that set includes a [load flow tool](/experimental/load-flow/), an [event loop visualizer](/experimental/event-loop/), a [learning dynamics lab](/experimental/learning-dynamics/), and a [Mandelbrot explorer](/experimental/mandelbrot/).

These were useful test cases because they are small enough to live entirely on the client side in a Next.js app, but they still involve interaction, visualization, timing, feedback, state, and sometimes numerical precision. The logic needs to live in the client. They also became a useful way to revisit concepts I had not touched closely in a while.

## Load flow in the browser

Earlier in my career, I was more drawn to electrical power engineering than to software. I was especially fascinated by power system analysis tools like PSS/E. The core problem itself was interesting: solve for voltages, phase angles, and power flows in a nonlinear system. Real models could also get very large, up to millions of nodes, so I carried the impression that the solvers themselves were heavy, specialized systems.

That was part of what made building [Load Flow](/experimental/load-flow/) interesting. I liked the idea of implementing standard IEEE reference cases directly in the browser and seeing how far I could get in a browser-based version rather than a dedicated desktop application. Instead of treating load flow as something that only lived inside heavyweight desktop tooling, I could look at the network, change inputs, run the solver, and inspect the outputs in one place.

It turns out the IEEE reference cases are relatively small compared to real models I have seen in the past with PSS/E, so they converge pretty quickly. It is still unclear how a bigger model would do in the browser.

Another gap that remains is the single-line diagram visualization. It did not turn out as well as I had hoped. The drag-and-drop behavior, auto-layout, and line-overlap handling all had issues. I suspect those are problems I could improve with more detailed prompting and more time and effort, but they were a useful reminder that getting the solver working is not the same thing as making the interface feel good to use.

## Mandelbrot and precision

The [Mandelbrot Explorer](/experimental/mandelbrot/) came from a different source of curiosity. I originally explored this in a master's degree course, ECE 8893 at Georgia Tech. In that version, we used CUDA with one thread per pixel and GNU multiple precision arithmetic to draw the Mandelbrot set. What still feels satisfying about it is that each time I zoom in, I see something completely new and different, with patterns that feel similar but still distinct. The visible edges of the set are where most of the interesting complexity emerges, so that is a good place to try zooming in.

What I wanted to see on the web was whether I could still handle those same two constraints in a simpler browser implementation: the sheer number of per-pixel computations and the need for multi-precision math. The browser version gets part of the way there by keeping the viewport coordinates in arbitrary-precision decimals, rendering asynchronously, and leaning on lower resolutions to keep interaction usable. That was enough to make deep zooming possible in the browser, even if it is slower than the earlier CUDA-based version.

The current implementation still has a practical precision ceiling: if I zoom too far in, the browser can freeze. I do not remember running into issues at deeper zoom levels in my earlier C++ version using the GNU Multiple Precision Arithmetic Library.

## Relearning through small models

These tools also turned out to be a good way to refresh concepts I am actively revisiting. The [Learning Dynamics Lab](/experimental/learning-dynamics/) is useful for that because it makes optimizer behavior visible instead of leaving it at the level of equations or static notes. The [Event Loop Visualizer](/experimental/event-loop/) fits the same pattern. Queuing `Promise.then(...)` beside `setTimeout(..., 0)` and stepping the runtime forward makes the ordering much easier to see: the microtask queue drains before the next task starts.

That is also where the coding agent has been most useful. It is good at helping me get started, scaffolding the UI, and accelerating implementation. It can also explain concepts reasonably well. But a tool still teaches me something different. A chatbot is turn-based and less effective for sustained exploration. A tool gives me something inspectable. If the behavior looks wrong, I can inspect the code directly instead of stopping at the explanation.

For now, the pattern that has felt most useful to me is simpler: use the agent to help build a small tool, then learn by pushing on the model directly.
