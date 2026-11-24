import type { Action } from "./engine";
import { COLS, ROWS, type Level } from "./level";
import type { World } from "./world";

export const practiceMoves: readonly { action: Action; instruction: string }[] =
  [
    { action: "swing", instruction: "to grab the other peg and turn back." },
    {
      action: "flip",
      instruction: "to change pegs and keep turning the same way.",
    },
    {
      action: "bounce",
      instruction: "to turn back at the other peg without grabbing it.",
    },
    {
      action: "reverse",
      instruction: "to turn back immediately, even between pegs.",
    },
  ];

const left = 4 * COLS + 4;
const right = left + 1;
export const signalSchool: Level = {
  number: 0,
  name: "Signal School",
  seconds: Infinity,
  cells: Array.from({ length: COLS * ROWS }, (_, i) => ({
    flags: i === left || i === right ? 1 : 0,
    mask: 15,
    path: "",
  })),
  actors: [[4, 4, 0, 24, 1, -1, 1, 0, 0, 15]],
  warps: [],
  spikes: [],
  walls: [],
  doors: [],
  switches: [],
  oil: [],
  fuses: [],
  glasses: [],
  stations: [],
  notes: [],
  paths: [],
  rails: [],
  lifts: [],
  guns: [],
  triggers: [],
};

export function recordPracticeMove(w: World, move: Action) {
  if (w.practiceStep === null || practiceMoves[w.practiceStep]?.action !== move)
    return;
  w.practiceStep++;
  if (w.practiceStep === practiceMoves.length) {
    const destination = w.hands[0].peg === left ? right : left;
    w.pegs[destination].flags |= 4;
  }
}
