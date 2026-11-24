import type { Action } from "@/features/clockwerx/engine";
import { COLS, ROWS, type Level } from "@/features/clockwerx/level";
import {
  createWorld,
  saveStation,
  type World,
} from "@/features/clockwerx/world";

import { controls } from "./Controls";

export type BoardExample = {
  pegs?: number[];
  objects?: Partial<Level>;
  pose?: (world: World) => void;
  center?: [number, number];
  span?: number;
};

type Entry = {
  term: string;
  meaning: string;
  example?: BoardExample;
  control?: Action;
};

const emptyLevel: Level = {
  number: 1,
  name: "",
  seconds: 120,
  cells: Array.from({ length: COLS * ROWS }, () => ({
    flags: 0,
    mask: 15,
    path: "",
  })),
  actors: [],
  walls: [],
  switches: [],
  lifts: [],
  doors: [],
  spikes: [],
  triggers: [],
  guns: [],
  rails: [],
  fuses: [],
  oil: [],
  stations: [],
  glasses: [],
  warps: [],
  paths: [],
  notes: [],
};

export function exampleWorld(example: BoardExample) {
  const cells = emptyLevel.cells.slice();
  example.pegs?.forEach((flags, i) => {
    cells[i] = { ...cells[i], flags };
  });
  const w = createWorld({ ...emptyLevel, ...example.objects, cells }, 1);
  example.pose?.(w);
  return w;
}

function hand(kind: number): BoardExample {
  return {
    objects: { actors: [[0, 0, kind, 0, 1, -1, 1, 0, 0, 15]] },
    center: [0.5, 0],
    span: kind < 4 ? 1.75 : 1.25,
  };
}

export const glossary: { section: string; entries: Entry[] }[] = [
  {
    section: "Signals and pickups",
    entries: [
      {
        term: "Way station (checkpoint)",
        meaning:
          "Grab the pale peg inside the teal ring. A retry returns you here with the time, score, and board you had when it lit up.",
        example: {
          pegs: [1, 1],
          objects: {
            stations: [
              [0, 0, 0, 1, 0, 15],
              [0, 1, 0, 1, 0, 15],
            ],
          },
          pose: (w) => {
            saveStation(w, w.stations[1]);
          },
          center: [0.5, 0],
          span: 1.9,
        },
      },
      {
        term: "Destination",
        meaning: "Grab the double diamond to finish the level.",
        example: { pegs: [5] },
      },
      {
        term: "Bonus peg",
        meaning:
          "Grab the gold ring for points. The ring disappears after you collect it.",
        example: { pegs: [3] },
      },
      {
        term: "Time bonus",
        meaning:
          "Sweep over the gold hourglass for 10 extra seconds and 1,000 points.",
        example: { objects: { glasses: [[0, 0, 15]] }, center: [0.5, 0.5] },
      },
      {
        term: "Player hand",
        meaning:
          "The gold hand turns around its peg. Line up its tip with the next peg to grab it.",
        example: hand(0),
      },
    ],
  },
  {
    section: "Pegs and rails",
    entries: [
      {
        term: "Anchor peg",
        meaning:
          "Grab this plain dot to make it your pivot, the point your hand turns around.",
        example: { pegs: [1] },
      },
      {
        term: "Moving peg",
        meaning:
          "Looks like an anchor peg in motion. It carries your pivot across the board while you hold on.",
        example: { pegs: [129] },
      },
      {
        term: "Ring peg",
        meaning:
          "This thin ring disappears when you leave the peg. Wait three seconds for it to return.",
        example: { pegs: [9] },
      },
      {
        term: "Safe peg",
        meaning:
          "The colored center and outer ring mark a safe peg. Enemy hands can cross yours while you hold it.",
        example: { pegs: [65] },
      },
      {
        term: "Slow peg",
        meaning:
          "Grab the triangle to slow the enemy hands to half speed. They speed up when you leave.",
        example: { pegs: [33] },
      },
      {
        term: "Death peg",
        meaning:
          "You can grab one square-marked peg safely. Grabbing two in a row ends the attempt.",
        example: { pegs: [8193] },
      },
      {
        term: "Warp",
        meaning:
          "Grab a lettered peg to jump to its partner with the same letter.",
        example: {
          pegs: [1, 1],
          objects: {
            warps: [
              [0, 0, 0, 0, 15],
              [0, 1, 0, 0, 15],
            ],
          },
          center: [0.5, 0],
          span: 1.9,
        },
      },
      {
        term: "Lift peg",
        meaning:
          "Dots below the peg mark its lift group. Leave before the matching switch lowers it all the way.",
        example: { pegs: [513] },
      },
      {
        term: "Rail",
        meaning:
          "A track joins two pegs. Your pivot can roll along it as the hand turns.",
        example: {
          pegs: [1, 1],
          objects: { rails: [[0, 0, 0]] },
          center: [0.5, 0],
          span: 1.75,
        },
      },
      {
        term: "Marked peg",
        meaning:
          "Some pegs have small colored dashes underneath. You can grab them as usual.",
        example: {
          pegs: [1],
          pose: (w) => {
            w.pegs[0].mask = 0x2222;
          },
        },
      },
    ],
  },
  {
    section: "Walls and switches",
    entries: [
      {
        term: "Wall",
        meaning: "Your hand turns back when it hits a solid wall.",
        example: {
          objects: { walls: [[0, 0, 0, 0, 1, 0]] },
          center: [0.5, 0.5],
          span: 1.8,
        },
      },
      {
        term: "Door",
        meaning:
          "A bar with marked ends opens or closes when a hand touches its matching switch.",
        example: {
          objects: { doors: [[0, 0, 0, 1]] },
          center: [0.5, 0.5],
          span: 1.75,
        },
      },
      {
        term: "Door switch",
        meaning:
          "Sweep the dotted square to open or close doors with the same markings.",
        example: { objects: { switches: [[0, 0, 0, 1]] } },
      },
      {
        term: "Lift switch",
        meaning:
          "Sweep the square with a stripe to lower or raise the matching lift pegs.",
        example: { objects: { lifts: [[0, 0, 0, 1, 15]] } },
      },
      {
        term: "Gun switch",
        meaning:
          "Sweep the square with a ring inside to fire its group of guns.",
        example: { objects: { triggers: [[0, 0, 0, 2, 15]] } },
      },
    ],
  },
  {
    section: "Enemies and hazards",
    entries: [
      {
        term: "Enemy hand",
        meaning:
          "These hands follow set routes. Crossing one ends the attempt unless you’re on a safe peg.",
        example: hand(1),
      },
      {
        term: "Spike",
        meaning:
          "Keep the whole hand clear of the pointed star. Moving spikes trace an orbit around a peg.",
        example: { objects: { spikes: [[0, 0, 0, 0, 15]] } },
      },
      {
        term: "Oil glob",
        meaning:
          "Sweep near the dark droplet and it wakes up. Leave your peg before the oil reaches it.",
        example: { objects: { oil: [[0, 0, 0, 15]] }, center: [0.72, 0.72] },
      },
      {
        term: "Wallbuster",
        meaning:
          "Strike the orbiting ball to launch it. It breaks a fixed wall and bounces off a door.",
        example: hand(5),
      },
      {
        term: "Gun",
        meaning:
          "The barrels point in the directions shots will travel when the gun switch is hit.",
        example: { objects: { guns: [[0, 0, 0, 0, 11, 15]] } },
      },
      {
        term: "Shot",
        meaning:
          "A small red dot fired from a gun. Keep your hand out of its path.",
        example: {
          pose: (w) => {
            w.bullets.push({ x: 0, y: 0, vx: 0.075, vy: 0 });
          },
        },
      },
      {
        term: "Fuse trigger",
        meaning:
          "Sweep the small gold diamond to light the fuse, then move clear.",
        example: { objects: { fuses: [[0, 0, 10]] }, center: [0.5, 0.5] },
      },
      {
        term: "Fuse and spark",
        meaning:
          "The bright spark follows the fuse to the bomb. Touching the spark ends the attempt.",
        example: {
          objects: {
            fuses: [
              [0, 0, 4],
              [0, 1, 4],
            ],
          },
          pose: (w) => {
            w.tick = 6;
            w.fuses[0].burn = 0;
          },
          center: [1, 0.5],
          span: 1.65,
        },
      },
      {
        term: "Bomb",
        meaning:
          "When the fuse burns down to this thick red ring, the blast destroys nearby walls. Give it room before it goes off.",
        example: { objects: { fuses: [[0, 0, 2]] }, center: [0.5, 0.5] },
      },
    ],
  },
  {
    section: "Controls",
    entries: controls.map((c) => ({
      term: c.label,
      meaning: c.description + " Use " + c.key + " on a keyboard.",
      control: c.action,
    })),
  },
  {
    section: "Difficulty and progress",
    entries: [
      {
        term: "Child",
        meaning:
          "Unlimited time. The hand turns at two-thirds of Easy speed, and some boards have fewer hazards. Each difficulty saves its own progress.",
      },
      {
        term: "Easy",
        meaning:
          "The default timed campaign. You have more time and a slower hand than on Medium.",
      },
      {
        term: "Medium",
        meaning:
          "The hand turns faster than on Easy, and the clock starts with less time. Some boards still have way stations.",
      },
      {
        term: "Hard",
        meaning:
          "The fastest hand and shortest time limits. Every retry starts at the beginning of the board.",
      },
      {
        term: "Signal School",
        meaning:
          "Level 0 is an untimed lesson in the four controls. You can replay it from the level menu.",
      },
      {
        term: "Progress code",
        meaning:
          "Open Transfer progress in the menu to take your difficulty, level, and campaign progress to another browser. Best scores stay on this device.",
      },
      {
        term: "Skip",
        meaning:
          "Move past a level with Skip level in the menu. You can have three skipped boards at once. Finish one to get that skip back.",
      },
    ],
  },
];
