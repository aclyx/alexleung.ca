---
title: "Load Flow and Mandelbrot in the Browser"
date: "2026-04-10"
updated: "2026-08-29"
excerpt: "A browser-based load-flow solver and Mandelbrot explorer let me revisit power-system analysis, numerical precision, and the limits of small client-side tools."
coverImage: "/assets/blog/small-interactive-tools-with-a-coding-agent/cover.webp"
coverAlt: "Illustration of Alex using load-flow and Mandelbrot tools across three screens"
tags:
  - "AI"
  - "Learning"
  - "Reflection"
---

I built two frontend-only tools to revisit technical problems I had studied before: a load-flow solver and a Mandelbrot explorer. Both ran entirely in the browser, but they put different pressure on it. Load Flow solved nonlinear equations over a small electrical network. The Mandelbrot explorer performed many per-pixel calculations while keeping viewport coordinates at higher precision than ordinary JavaScript numbers allow. A coding agent helped me get started and scaffold both interfaces; I used the running tools to check the models and find the limits described below.

I have since retired the interactive versions as part of simplifying this site. I am keeping this post as a record of what I learned from building them.

## Load flow in the browser

Earlier in my career, I was more drawn to electrical power engineering than to software. I was especially fascinated by power-system analysis tools like PSS/E. The core problem was interesting: solve for voltages, phase angles, and power flows in a nonlinear system. The real utility models I had seen were much larger than the IEEE reference cases I used, so I carried the impression that the solvers themselves were heavy, specialized systems.

For the browser tool, I implemented standard IEEE reference cases and put the network, editable inputs, solver, and results in one place. I could change a bus input, run the calculation, and inspect the resulting voltages and branch flows without moving between a model and a separate output view.

The reference cases are relatively small compared with the real models I had seen in PSS/E, so they converged quickly. I did not establish how a larger model would perform in the browser.

The harder part was the single-line diagram. Its drag-and-drop behavior, automatic layout, and handling of overlapping lines all had problems. The solver worked, but those issues kept the interface from feeling finished.

## Mandelbrot and precision

The Mandelbrot explorer came from a master's degree course, ECE 8893 at Georgia Tech. In that version, we used CUDA with one thread per pixel and the GNU Multiple Precision Arithmetic Library to draw the set. I still like zooming into its edges, where each level reveals patterns that are related but not identical.

The browser version had to handle the same two constraints with a simpler implementation: many per-pixel computations and viewport coordinates that need more precision as the view gets narrower. It kept those coordinates in arbitrary-precision decimals, rendered asynchronously, and used lower resolutions to keep interaction usable. That was enough for deep zooming in the browser, although it was slower than the earlier CUDA version.

The implementation still had a practical ceiling. Zooming too far could freeze the browser. I do not remember running into issues at deeper zoom levels in my earlier C++ version using the GNU Multiple Precision Arithmetic Library.

## What the tools exposed

Changing a bus input and seeing the voltage and branch-flow results made load flow easier to reason about. Zooming into the Mandelbrot set exposed precision and rendering limits directly. In both cases, the tool gave me something concrete to vary and inspect instead of leaving the model at the level of equations or notes.
