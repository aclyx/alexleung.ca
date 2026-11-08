---
title: "Solving AC Load Flow with Newton–Raphson in the Browser"
date: "2026-11-07"
excerpt: "AC load flow, or power flow, finds a network’s bus voltages, phase angles, and line flows. A browser tool solves it with Newton–Raphson on networks of up to 118 buses and shows how reactive power changes bus voltages."
coverImage: "/assets/blog/ac-load-flow-newton-raphson/cover.webp"
coverAlt: "The Load Flow Analysis tool showing a three-bus single-line diagram with power-flow arrows between the slack, generator, and load buses"
tags:
  - "Power Systems"
draft: false
---

Load flow, also called power flow, answers a steady-state question about an AC network: given what each generator is set to produce and what each load draws, what are the voltage magnitude and phase angle at every bus, and how much power moves through each line? A bus is a node where lines, generators, and loads connect. [Load Flow Analysis](/experimental/load-flow/) is a browser tool I built that puts a network, its inputs, the solver, and the results on one page. I could change an input and read the new voltages and flows without moving between a model and a separate output view, and that made load flow easier to reason about than equations alone.

## The power flow equations

Line impedances form an admittance matrix $Y$, and bus currents follow from bus voltages through $I = YV$. If the inputs were currents, one linear solve would finish the job.

The inputs are powers. Complex power at bus $i$ is voltage times conjugate current, so the unknown voltages multiply each other:

$$
\begin{aligned}
S_i = P_i + jQ_i &= V_i I_i^* \\
&= V_i \sum_j Y_{ij}^* V_j^*
\end{aligned}
$$

Separating the real and reactive parts, with $Y_{ij} = G_{ij} + jB_{ij}$ and $\theta_{ij} = \theta_i - \theta_j$, gives two real equations for every bus:

$$
\begin{aligned}
P_i &= \sum_j |V_i||V_j| \big( G_{ij}\cos\theta_{ij} \\
&\qquad\qquad + B_{ij}\sin\theta_{ij} \big) \\
Q_i &= \sum_j |V_i||V_j| \big( G_{ij}\sin\theta_{ij} \\
&\qquad\qquad - B_{ij}\cos\theta_{ij} \big)
\end{aligned}
$$

These are sums of products of unknown magnitudes with sines and cosines of unknown angles. That makes them nonlinear, so they are usually solved by iteration.

## PQ, PV, and slack buses

Each bus has four quantities, $|V|$, $\theta$, $P$, and $Q$, and two equations. Two of the quantities have to be given, and which two depends on the equipment at the bus:

- **PQ (load) bus:** $P$ and $Q$ are given, because a load is described by what it draws. The solve finds $|V|$ and $\theta$.
- **PV (generator) bus:** $P$ and $|V|$ are given, because a generator is set to a real power output and a voltage setpoint. The solve finds $\theta$, and $Q$ is whatever it takes to hold that voltage.
- **Slack bus:** $|V|$ and $\theta$ are given. $P$ and $Q$ come out of the solution.

The slack bus is there for two reasons. The equations contain only angle differences, so one bus has to define zero. And real power cannot be specified everywhere, because line losses are unknown until the voltages are known, so one source has to make up the difference.

The solve uses only the equations whose left side is known: $P$ at every PV and PQ bus, and $Q$ at every PQ bus. That leaves one unknown angle for every bus except the slack and one unknown magnitude for every PQ bus. Line flows follow directly from the voltages at each end once the solve is done.

## Solving the equations with Newton–Raphson

Newton–Raphson is the usual way to solve these equations, an approach [Tinney and Hart](https://doi.org/10.1109/TPAS.1967.291823) showed to be efficient in 1967. It replaces them with a linear approximation at the current guess, solves that, and repeats. The gap between the specified power at a bus and the power the equations give at the current guess is the mismatch:

$$
\begin{aligned}
\Delta P_i &= P_i^{\text{spec}} - P_i(\theta, |V|) \\
\Delta Q_i &= Q_i^{\text{spec}} - Q_i(\theta, |V|)
\end{aligned}
$$

The Jacobian $J$ holds the partial derivatives of the calculated power with respect to the unknowns, evaluated at the current guess:

$$
J = \begin{bmatrix} \partial P/\partial\theta & \partial P/\partial|V| \\ \partial Q/\partial\theta & \partial Q/\partial|V| \end{bmatrix}
$$

Each iteration solves this linear system, adds the result to the guess, and recalculates the mismatch and Jacobian at the new point:

$$
J \begin{bmatrix} \Delta\theta \\ \Delta|V| \end{bmatrix}
=
\begin{bmatrix} \Delta P \\ \Delta Q \end{bmatrix}
$$

Close to a solution, each step squares the mismatch, up to a constant factor, which is the quadratic convergence Newton’s method is known for.

The tool works in per unit, where 1 pu of voltage is nominal and 1 pu of power is 100 MVA in its reference cases. It begins from a flat start, with every unknown magnitude at 1 pu and every unknown angle at zero, and stops when the largest mismatch falls to $10^{-6}$ pu.

## Client-side state and data flow

The `LoadFlowWorkspace` component keeps the network in a single editor state. Choosing one of the seven reference cases or an empty network replaces that state, and edits update it. Five of the cases are standard benchmark networks of 9 to 118 buses, adapted from MATPOWER.

![Data flow through the tool. Reference cases and user edits feed the editor state. toLoadFlowCase reduces it to the electrical model as a JSON string called modelKey, and the load slider scales that into the model. The solver validates the model and runs Newton–Raphson on the main thread. A converged check then passes results to the single-line diagram, summary strip, and tables. A dashed path carries bus positions and selection from the editor state straight to the single-line diagram, with no solve.](/assets/blog/ac-load-flow-newton-raphson/solver-architecture.webp)

`toLoadFlowCase` copies the electrical model out of that state for the solver, without bus positions or the selection. The model is memoized on the JSON string of that copy, `modelKey`, and on the load slider’s value. The slider scales every load’s $P$ and $Q$ together and leaves generator $P$ setpoints fixed, so the slack bus supplies all of the added real power and the added losses. A Case JSON view shows the scaled model that the solver receives.

## The solver runs during render

The tool solves as the inputs change, without a Run button or a worker. `runLoadFlow` is called inside a `useMemo`, so a new model reruns it during render, on the main thread.

![Sequence diagram with four participants: the user, the workspace, the solver, and the single-line diagram. Moving the load slider makes the workspace scale loads and call the solver, which validates the case, builds Y, and takes a flat start. It then iterates up to 30 times, calculating P and Q, stopping if the mismatch is at most 10 to the minus 6 pu, solving the Jacobian, and updating angles and voltages, before computing line flows. The workspace passes converged voltages and flows to the diagram. Dragging a bus sends a new position to the workspace, where modelKey is unchanged, so the last result is reused and the diagram only reroutes its lines.](/assets/blog/ac-load-flow-newton-raphson/load-slider-sequence.webp)

A slider step on the 118-bus case takes about 50 ms in Chromium on an Apple M4 when the solve converges, and about 140 ms when it fails, because a failed solve runs all 30 iterations. Dragging a bus takes the second path in the figure: its new position changes the editor state but not `modelKey`, so nothing is solved again.

## Reading the single-line diagram

A single-line diagram draws each balanced three-phase circuit as one line. In the tool, each bus is a card showing its type, voltage magnitude, and angle relative to the slack bus. Its color marks fixed voltage bands that are visual guides rather than equipment limits. Real power is drawn in solid blue and reactive power in dashed purple, together or one at a time. Stroke width and the speed of the animated dashes grow with the power. The animation shows only direction and size, because a steady-state solution does not change over time, and it can be paused.

Each line is drawn as two halves with separate arrows, because the power at its two ends can differ. The tool reports power as positive into the line at each end, following [MATPOWER’s branch convention](https://matpower.org/docs/ref/matpower7.1/lib/idx_brch.html), and the sum of the two is what the line absorbs. In the IEEE 9-bus case below, the arrows on the Bus 2–Bus 8 branch meet in the middle, with reactive power entering from both ends. On the Bus 5–Bus 6 line, they point apart: the line delivers reactive power to both buses while real power crosses it in one direction.

![The tool’s IEEE 9-bus diagram in its reactive-power view, with bus cards showing voltages and angles, purple arrows meeting in the middle of the Bus 2–Bus 8 branch, and arrows pointing apart on the Bus 5–Bus 6 line](/assets/blog/ac-load-flow-newton-raphson/ieee-9-bus-reactive.webp)

Hovering, focusing, or tapping an element shows its numbers, and collapsed tables list every bus and branch. Buses can be dragged, and an Arrange buses button returns them to an automatic layout. The diagram, including its dragging and automatic layout, was [the harder part of building the tool for me](/blog/small-interactive-tools-with-a-coding-agent/).

## Reactive power and voltage

The equations tie each bus’s reactive power to the voltages around it, so they do not show which voltages move when one load’s reactive power changes, or how far the change reaches. Editing loads in the tool answers both for a given network, and on three of its networks the answers follow two patterns.

The first is that each MVAr delivered to a load costs more voltage than each MW, because transmission lines have more reactance than resistance. The drop across a line with resistance $R$ and reactance $X$, delivering $P$ and $Q$ to a bus at voltage $V$, is roughly:

$$
\Delta V \approx \frac{RP + XQ}{V}
$$

On the default three-bus network, each line’s reactance is three times its resistance. Its load bus draws 90 MW and 30 MVAr and sits at 0.966 pu. Removing the 30 MVAr raises it to 0.999 pu, while removing 30 MW instead raises it only to 0.980 pu. A load with no local source of reactive power has to draw it across that reactance, and its voltage pays for it.

That makes the remedy local. A load’s $Q$ can be negative, which makes it supply reactive power, as a capacitive load does. Setting the load bus’s Load Q to −30 MVAr raises it to 1.029 pu, above the generator bus’s 1.025 pu setpoint, and reactive power on both of its lines now flows away from it.

The second pattern is that how far a change reaches depends on what holds voltage nearby. A generator bus keeps its voltage at its setpoint by adjusting its reactive output, so it absorbs a nearby change instead of passing it on. In the IEEE 118-bus case, the lowest load-bus voltage is 0.946 pu, at Bus 53, which is one branch from a generator and two from four more. Lowering its Load Q by 30 MVAr, from 11 to −19, raises it to 0.973 pu. The generators at Buses 54, 49, and 56 cut their reactive output by 30 MVAr between them, and the rise fades within three branches: buses farther away change by less than $10^{-6}$ pu.

In the IEEE 57-bus case, the lowest voltage is 0.936 pu, at Bus 31, nine branches from the nearest generator. A third of that injection, 10 MVAr, raises Bus 31 to 1.032 pu and lifts 12 other buses by more than 0.01 pu, as far as six branches away, and the drop in reactive output is spread across six generators. Per MVAr, Bus 31 rises about ten times as much as Bus 53. It is low for the same reason it responds so strongly: no generator nearby holds its voltage.

## Limits and future work

The questions in the previous section are about differences: which voltages moved, and by how much. The tool shows only the current solution, so answering them means reading the voltages, making the edit, and comparing. Making the edit is indirect too. The diagram is only for selecting buses and lines and moving buses. The network’s parameters are edited in a form below it, one bus or line at a time, and that form starts collapsed, as does a separate panel for adding and connecting buses. The form also has no field for shunt capacitors, though the solver models the ones in the IEEE cases, so in the edits above a negative Load Q stands in for one. Editing on the diagram, with each bus shaded by how far its voltage moved from a saved solution, would let the diagram answer those questions directly.

The second pattern relies on generators holding their voltage, and the solver lets them do that with any amount of reactive power. The case data gives each generator reactive limits, which the solver does not enforce. The generators that absorbed the edits above stayed within their limits, but under heavy load the tool can show healthy voltages that depend on generators exceeding theirs. In the IEEE 14-bus case at 150% load, it reports “Converged” with every bus at 1.00 pu or above, while all four PV generators are past their limits: the one at Bus 2 supplies 101 MVAr against a limit of 50. Holding those four at their limits and solving again, with the slack bus still unlimited, drops Bus 14 to 0.903 pu. “Converged” here means only that the power balance holds at every bus, not that generators stay within their limits or lines within their thermal ratings.

Scale is the last limit. Each bus connects to only a few others, so most of the Jacobian is zero: the 118-bus case’s 181 × 181 matrix averages about six nonzero entries per row. The solver still stores it as a dense matrix and solves it by Gaussian elimination, at a cost that grows with the cube of the number of unknowns. At 181 unknowns, that cost fits within the slider-step times above, but a network with 100 times as many unknowns would need a matrix of about 330 million entries and about a million times the work per iteration. Tinney and Walker’s [optimally ordered factorization](https://doi.org/10.1109/PROC.1967.6011), published the same year as Tinney and Hart’s paper, stores and eliminates only the nonzero entries, in an order that creates few new ones. The tool’s cases are small next to the utility models I had seen in PSS/E, and I did not try anything that large in the browser.
