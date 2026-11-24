# Last Local

Last Local opens at `/experimental/last-local/`. The game fits the complete signal desk and operator inside the browser window. Both earlier URLs, `/experimental/kickturn/` and `/experimental/clockwerx/`, share the same game, progress and appearance preferences. The static export includes the 100-board single-player campaign from the 1995 US Windows release of ClockWerx. A new player begins at Easy difficulty in Signal School, an untimed Level 0 for practicing Swing, Flip, Bounce, and Reverse. Grabbing the diamond finishes training and opens the way to Movement, level 1. The level menu also lets you skip or replay training. Campaign completion counts the original 100 boards. Curves, level 11, is available from the start.

Hold X or period to swing, Shift to flip, or Z or slash to bounce. Space reverses immediately. P pauses or resumes. Touch controls use the same four actions and support holding more than one button. While you study the board, your hand turns so you can choose your opening angle. The first action starts the clock, moving pegs, and hazards.

## Customizing the game

- [Campaign data](../src/features/clockwerx/campaign.json) contains the original level order, names, clocks, peg flags, difficulty masks, movement scripts, object tables and tutorial annotations. The peg grids have eight rows of eleven columns. Row zero is at the top.
- [World state](../src/features/clockwerx/world.ts) constructs a board at one difficulty. [Simulation](../src/features/clockwerx/engine.ts) advances it by a fixed tick. Both run without a browser, React or a canvas.
- [Board rendering](../src/features/clockwerx/renderer.ts) draws the world in peg coordinates. Change the palette or drawing routines here. The default Last Local skin places a transparent game canvas inside the painted glass of a railway signal desk. Its [landscape](../public/assets/kickturn/last-local.webp) and [portrait](../public/assets/kickturn/last-local-portrait.webp) compositions each have their own glass and key positions in the game styles. A lamp on each key lights while its input is held. The route strip beside the title shows the percentage of boards cleared on the selected difficulty. Every twenty clears lights another station lamp. Brass and Blueprint are available under Appearance.
- [Playfield](../src/app/experimental/last-local/Playfield.tsx) maps input, scales the canvas and displays the timer and score. [Game styles](../src/app/experimental/last-local/game.module.css) control the frame, HUD, phone controls and menu. A skin can override the CSS variables under its `data-game-skin` attribute.

## Progress

The game saves completed boards, selection, outstanding skips and best level scores in browser storage. Each difficulty has its own progress. Completing a skipped board returns its skip allowance. Under **Menu → Transfer progress**, a short code carries the difficulty, selected level, tutorial completions, campaign frontier and outstanding skips to another browser. Per-level score records stay on the device. During an attempt, a way station saves the time, score, pickups, and board state at arrival. Retrying restores that snapshot and places the hand at the station’s designated angle.

## Verifying fidelity

[Campaign tests](../src/features/clockwerx/__tests__/campaign.test.ts) replay [winning browser inputs](./last-local-playthrough/results.json) for Signal School and all 100 boards on every difficulty. Each replay checks the finishing tick and each campaign replay checks the score. The [playthrough report](./last-local-playthrough/README.md) describes keyboard, touch, and save verification.

The suite also compares every exported level field with the [binary reader](../src/features/clockwerx/library.ts) when the original installed library (`LEVELS.CLL`) or compressed installer library (`LEVELS.CL_`) is present under `.cache/clockwerx/`. Both originals were checked against the bundled campaign, including the 77 tutorial annotations. Normal builds and play use the checked-in JSON.

The Windows executable supplies the level time allowances and the six relative rotation rates for hands and moving hazards. For example, Movement starts at 3:20 on Easy, 2:40 on Medium and 2:00 on Hard. Child has an unlimited clock. Contact distances, absolute rotation speed, sliding, oil and wallbuster timing, and completion bonuses still need side-by-side measurement. The [Windows manual](https://oldgamesdownload.com/manual/clockwerx-windows-manual-english/) describes the controls, hazards and progression rules.
