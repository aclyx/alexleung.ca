# PID controller simulator

The standalone tool at `/experimental/pid-controller/` recomputes a deterministic
20-second response when the gains or plant change. It adds no runtime dependencies.
These are educational models, not tuning recommendations for real equipment.

## Plants

Three fixed presets define dynamics, initial conditions, targets, units and
actuator limits. The equation remains visible; there is no custom equation or
settings editor. Controller presets are Steady offset, Smooth, Overshoot, and
Oscillation, with tests for their behavior on each plant.

| Plant              | Equation                          | Assumptions                                                                           |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------------- |
| Heated plate       | `dy/dt = (20 - y + u/10)/2`       | 20 J/K heat capacity, 10 W/K heat loss, 20°C ambient, ±800 W heating/cooling; 20→60°C |
| Spring–mass–damper | `d²y/dt² = u - 0.6*v - y`         | 1 kg mass, 0.6 N·s/m damping, 1 N/m spring, ±10 N force; 0→1 m                        |
| Draining tank      | `dy/dt = u - 0.4*sqrt(max(y, 0))` | 1 m² area, square-root outflow, 0–1 m³/s pump, no overflow limit; 0→1 m               |

## Physical view and playback

The plate's thermometer and shading, mass position, and tank level use the same
sample as the response chart's dot. Numeric output and actuator input readouts
include units. Dashed markers indicate the target; color is not the only signal.
Drawings scale to the full current run, keeping the scale stable during playback.
The tank's displayed scale is not a physical capacity.

Play advances at real time through the precomputed samples and stops at 20 s.
Pause and the keyboard-accessible time slider allow inspection without motion.
There is no autoplay or loop, including with reduced-motion preferences.
Background-frame delays are capped so returning to the tab does not skip the run.
Changing the plant or gains stops playback and returns to zero; taking or clearing
a snapshot preserves playback position.

## Solver and controller

- Fixed 0.01 s controller period; RK4 advances the plant with input held constant.
- Tank height is bounded at zero when an integration step crosses empty.
- Parallel controller: `u = Kp*error + integral - Kd*d_filtered(y)/dt`.
- Derivative filter: 0.1 s, backward Euler; derivative on measurement avoids kick.
- Conditional integration rejects increments that deepen actuator saturation,
  but allows unwinding. Requested input is clamped to the preset's limits.
- Numeric gains accept finite values from −1000 to 1000; sliders provide
  convenient preset-specific ranges.
- Nonfinite states or magnitudes above 1e6 abort with a visible error.
- Noise and transport delay are not included. Extreme gains can exceed the
  useful accuracy of the fixed-step solver.

## Metrics and snapshots

Rise time is the first 10%–90% crossing interval in the requested step direction.
Overshoot is the excess beyond the target divided by the absolute step size.
Settling is the first step after the last excursion outside the 2% band, provided
at least one full second remains. These three metrics do not apply to a zero step.
Final error is target minus output at 20 s, not necessarily steady-state error.

The chart draws every fifth sample; metrics and playback use all 2,001 samples.
Chart bounds include the target, current curve and snapshot. Snapshots keep
their gains and response in component state; plant changes and Reset gains
clear them. Nothing is persisted or shared.

## Measurement

The existing `experiment_interaction` event uses `experiment=pid-controller`.
Actions are `adjust_kp`, `adjust_ki`, `adjust_kd`, `plant_plate`,
`plant_spring`, `plant_tank`, `preset_steady_offset`, `preset_smooth`,
`preset_overshoot`, `preset_oscillation`, `take_snapshot`, `reset_gains`,
`play_response`, and `scrub_response`. Each is emitted at most once per mount,
only on intentional interaction, never per animation frame. No entered values
are sent. Use unique interacting users, not raw event counts. Analytics requires
the site's build-time enable flag.

## Verification

Unit tests cover analytical thermal, damped-mass and nonlinear tank responses,
preset behavior, actuator limits, deterministic output, snapshots, synchronized
scrubbing, playback lifecycle and bounded analytics. Browser tests cover
keyboard controls, all plant views, playback, snapshots, discovery, canonical
metadata and 360/768/1280px layouts. Visual baselines cover desktop/mobile plate,
snapshot comparison, mass and tank views.
