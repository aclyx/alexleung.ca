---
title: "Load Flow and Mandelbrot in the Browser"
date: "2026-04-10"
updated: "2026-10-29"
excerpt: "A browser-based load-flow solver and Mandelbrot explorer let me revisit power-system analysis, numerical precision, and the limits of small client-side tools."
coverImage: "/assets/blog/small-interactive-tools-with-a-coding-agent/cover.webp"
coverAlt: "Illustration of Alex using load-flow and Mandelbrot tools across three screens"
tags:
  - "AI"
  - "Learning"
  - "Reflection"
---

I felt like doing something nostalgic, so I revisited two old interests by building a [load-flow solver](/experimental/load-flow/) and a [Mandelbrot explorer](/experimental/mandelbrot/). Both ran entirely in the browser, but they put different pressure on it. Load Flow solved nonlinear equations over a small electrical network. The Mandelbrot explorer performed many per-pixel calculations while keeping viewport coordinates at higher precision than ordinary JavaScript numbers allow. A coding agent helped me get started and scaffold both interfaces; I used the running tools to check the models and find their limits.

## Load flow in the browser

Earlier in my career, I was more drawn to electrical power engineering than to software. I was especially fascinated by power-system analysis tools like PSS/E. The core problem was interesting: solve for voltages, phase angles, and power flows in a nonlinear system. The real utility models I had seen were much larger than the IEEE reference cases I used, so I carried the impression that the solvers themselves were heavy, specialized systems.

The browser tool used a Newton–Raphson solver on reference networks ranging from 9 to 118 buses. I put the network, editable inputs, solver, and results in one place. I could change a bus input, run the calculation, and inspect the resulting voltages and branch flows without moving between a model and a separate output view. That made load flow easier to reason about than equations alone.

The reference cases converged quickly, but they were small next to the utility models I had seen in PSS/E, and I did not try anything that large in the browser.

The harder part for me was the single-line diagram. Its drag-and-drop behavior, automatic layout, and handling of overlapping lines all had problems. Those issues kept the interface from feeling finished even when a calculation converged.

## Mandelbrot and precision

The Mandelbrot explorer came from a master’s degree course, ECE 8893 at Georgia Tech. In the course version, we used CUDA with one thread per pixel and the GNU Multiple Precision Arithmetic Library (GMP) to draw the set. I still like zooming into its edges, where each level reveals patterns that are related but not identical.

The first browser version, which this post describes, had to handle the same two constraints with a simpler implementation: many per-pixel computations and viewport coordinates that need more precision as the view gets narrower. It kept those coordinates in arbitrary-precision decimals, rendered asynchronously, and used lower resolutions to keep interaction usable. That was enough for deep zooming in the browser, although it was slower than the CUDA version.

To keep the workload bounded, I limited resolution at deep zooms and capped the iteration setting at 4,000. I do not remember running into the same limits in my C++ version with GMP.
