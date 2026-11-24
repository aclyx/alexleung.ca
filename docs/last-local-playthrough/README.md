# Last Local playthrough

On November 23, 2026, four fresh Chromium campaigns advanced from Signal School through Break In. Every campaign reached 100% using the next-level button after each clear. Each save still showed 100% after reloading the game.

| Difficulty | Campaign clears | Signal School | Input in the fresh campaign |
| ---------- | --------------: | ------------- | --------------------------- |
| Child      |         100/100 | Cleared       | Phone touch controls        |
| Easy       |         100/100 | Cleared       | Desktop keyboard            |
| Medium     |         100/100 | Cleared       | Desktop keyboard            |
| Hard       |         100/100 | Cleared       | Phone touch controls        |

The runs used the production build and Playwright. The harness advanced the browser animation clock to deliver inputs on repeatable simulation ticks. Every campaign win required a completion screen, the expected score, and a saved clear. The fresh campaigns used no skips or imported progress. Separate runs also cleared every board on Child and Hard with keyboard controls and on Medium with touch. Phone coverage used mobile Chromium emulation. Desktop and mobile WebKit also passed the game’s smoke tests.

## Fixes verified by the playthrough

- **Spike clearance.** Before the patch, the opening swing on Break In passed on Easy and killed the player on Child and Medium. The engine now checks the area the hand sweeps through on its way to a peg. A stationary spike has a contact radius of four original pixels on a 48-pixel peg grid, calibrated against the Windows artwork. This is a visual estimate of the collision boundary. The three settings pass the opening, and all four have complete winning replays.
- **Moving pegs.** The Windows level loader reads the peg’s movement flag separately from its difficulty-limited properties. When the difficulty bit is clear, its moving path survives while properties such as the disappearing ring are cleared. This behavior is visible in the US executable’s code segment 4 at offsets 0x4BC2–0x4C5B. Passage now has six moving pegs on Child and clears using their original paths.
- **Starting safely.** Before the first input, the player’s hand rotates and the destination gives its opening pulse. The game clock, enemies, gun triggers, and projectiles begin on input. On Chatter, Box, and Slaughter, the first Flip survived after waiting 280, 148, and 116 preview ticks respectively. The same cases passed using keyboard and touch.
- **Checkpoint retries.** On Diagonals, the checkpoint showed 4:04 and 3,000 points. After an enemy-hand collision, Try again restored both values. The station also restores collected bonuses, doors, lifts, fuses, and hazard positions. Repeated retries restore independent copies of the same snapshot. The original manual specifies restoring the station and remaining time. Restoring the full board and score is the rule used by Last Local. [Windows manual](https://oldgamesdownload.com/manual/clockwerx-windows-manual-english/)
- **Door hint.** The three center doors in More Doors start open. Its hint now explains that each switch toggles its matching door. The hint was visible at desktop and phone widths, and the board cleared on all four settings.

The earlier audit had 387 verified campaign wins, eight unreachable combinations, and five unresolved combinations. All thirteen now have winning browser replays. The bundled board records, including difficulty masks, were checked against the original installed and compressed Windows libraries.

## Replay the checks

From the repository root with its dependencies installed, run the following command.

```sh
yarn test:last-local
```

The same checks run in the regular campaign test suite. The [recorded inputs](./results.json) store the preview delay, actions, active finishing tick, and final score for each board and difficulty. Signal School displays lesson progress in place of a score.

Each input token lasts a quarter-turn unless it has a duration in 60 Hz ticks. `F` holds Flip, `S` holds Swing, `B` holds Bounce, and `-` releases the controls. An initial `R` taps Reverse on the first tick. For example, `RF:8` reverses once and holds Flip for eight ticks.
