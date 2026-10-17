# PID controller simulator

The standalone tool at `/experimental/pid-controller/` recomputes a deterministic
20-second response when the gains or plant change. It adds no runtime dependencies.
These are educational models, not tuning recommendations for real equipment.

## Plants

The controller and plant are separate. Presets define the equation, initial
conditions, target, units, actuator limits, and four tested controller tunings:
Steady offset, Smooth, Overshoot, and Oscillation.

| Plant              | Equation                          | Assumptions                                                                           |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------------- |
| Heated plate       | `dy/dt = (20 - y + u/10)/2`       | 20 J/K heat capacity, 10 W/K heat loss, 20°C ambient, ±800 W heating/cooling; 20→60°C |
| Spring–mass–damper | `d²y/dt² = u - 0.6*v - y`         | 1 kg mass, 0.6 N·s/m damping, 1 N/m spring, ±10 N force; 0→1 m                        |
| Draining tank      | `dy/dt = u - 0.4*sqrt(max(y, 0))` | 1 m² area, square-root outflow, 0–1 m³/s pump; 0→1 m                                  |

Custom plants accept first- or second-order differential equations. Variables
are output `y`, controller input `u`, time `t` in seconds, and velocity `v=dy/dt`
for second-order plants. Initial conditions, target, input limits, and units are
editable. Applying a plant preserves gains and clears the snapshot. Behavioral
controller presets are hidden for custom equations because their labels would
not describe arbitrary dynamics reliably.

`expression.ts` parses a restricted arithmetic grammar, never JavaScript.
It supports +, −, \*, /, ^, parentheses, pi, e, sin, cos, abs, sqrt, exp, log,
and two-argument min/max. Multiplication must be explicit. Limits: 300 characters,
128 tokens, 24 nested parser frames. Object access, assignment, branching,
arbitrary functions, and implicit equations are unsupported. First-order
equations cannot refer to velocity.

## Solver and controller

- Fixed 0.01 s controller period; RK4 advances the plant with input held constant.
- Parallel controller: `u = Kp*error + integral - Kd*d_filtered(y)/dt`.
- Derivative filter: 0.1 s, backward Euler; derivative on measurement avoids kick.
- Actuator bounds may be asymmetric. Conditional integration rejects increments
  that deepen saturation, but allows unwinding. The requested input is clamped.
- Gains may be negative; numeric inputs accept −1000 to 1000. Sliders provide
  convenient preset-specific ranges.
- Settings must be finite, with initial states, target, and limits within ±10000.
  Nonfinite states or magnitudes above 1e6 abort with a visible error.
- Noise and transport delay are not included. This fixed-step solver is not
  suitable for every stiff or very fast system; it is not a general ODE solver.

## Metrics and snapshots

Rise time is the first 10%–90% crossing interval in the requested step direction.
Overshoot is the excess beyond the target divided by the absolute step size.
Settling is the first step after the last excursion outside the 2% band, provided
at least one full second remains. These three metrics do not apply to a zero step.
Final error is target minus output at 20 s, not necessarily steady-state error.

The chart draws every fifth sample; metrics use all 2,001 samples. Axis bounds
include negative values, target, current curve, and snapshot. Snapshots keep
their gains and response in component state; plant changes and Reset gains
clear them. Nothing is persisted or shared.

## Measurement

The existing `experiment_interaction` event uses `experiment=pid-controller`.
Actions include `adjust_kp`, `adjust_ki`, `adjust_kd`, `plant_plate`,
`plant_spring`, `plant_tank`, `apply_custom_plant`, `preset_steady_offset`,
`preset_smooth`, `preset_overshoot`, `preset_oscillation`, `take_snapshot`,
and `reset_gains`. Each action is emitted at most once per component mount,
only after intentional interaction. No equation text or user-entered values
are sent. Use unique users interacting with gains, plants, or snapshots rather
than raw event counts. Analytics requires the site's build-time enable flag.

## Verification

Unit tests cover grammar restrictions, analytical first- and second-order
solutions, time-dependent equations, preset behavior, limits, numerical failures,
zero/downward steps, deterministic output, UI state, and bounded analytics.
Browser tests cover keyboard controls, snapshots, plant selection, custom
equations and errors, discovery, canonical metadata, and 360/768/1280px layouts.
Visual baselines cover desktop/mobile default, snapshot, and equation editing.
