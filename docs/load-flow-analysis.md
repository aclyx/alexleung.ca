# Load Flow Analysis

The active route is `/experimental/load-flow/`. The homepage and the Load Flow
and Mandelbrot blog post link to it; the route is in the sitemap and `llms.txt`.
Do not restore the retired public HTML bridge at the same path.

## Model and display conventions

- Balanced, steady-state AC Newton–Raphson solve, constant-P/Q loads, π-model
  branches, transformer tap ratios and phase shifts. The reference cases use
  a 100 MVA base. Reactive generator limits and thermal limits are not enforced.
- The default three-bus case provides a slack source, a PV generator and a PQ
  load. The load slider scales both P and Q without changing generator P.
- Terminal powers are positive **into** a branch at that terminal. Both ends
  can absorb Q or supply Q. Each half of the diagram therefore gets its own
  arrow and motion direction. This follows the
  [MATPOWER branch convention](https://matpower.org/docs/ref/matpower7.1/lib/idx_brch.html).
- Blue solid strokes encode P (MW); purple dashed strokes encode Q (MVAr).
  Width has a fixed, bounded square-root scale. Motion indicates direction,
  not frequency, particles, speed, or time-domain behavior. It starts off and
  is suppressed under reduced motion.
- Voltage colors use fixed guide bands below 0.95, within 0.95–1.05, and above
  1.05 pu; these are not per-bus operating limits. Numeric magnitudes and angles
  remain available. Phasors use true angles relative to slack, not an amplified
  or animated phase. Result tables retain the solver's absolute reference.
- Nonconverged solutions never produce flow or voltage overlays or tables.
- A crossing without a bus is not an electrical connection. Parallel circuits
  get separate curved paths. Buses can be dragged or moved with arrow keys;
  Enter/Space select. The Inspect selector is an alternative to canvas targets.

## Verification

Solver regressions cover an analytic lossless two-bus solution, charging that
supplies reactive power at both ends, per-bus real-power balance across all
reference cases, transformer effects, and island detection. This does not
constitute independent MATPOWER validation of every benchmark result.

UI tests cover sign/direction mapping, fixed voltage bands, parallel circuits,
load scaling, signed input, reset, and hiding invalid results. Browser coverage
checks direct-load hydration, homepage navigation, keyboard controls, reduced
motion and viewport fit. Visual baselines cover the default diagram, reactive
view and IEEE 14-bus view on mobile and desktop.
