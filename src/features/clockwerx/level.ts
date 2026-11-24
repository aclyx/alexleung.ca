export const COLS = 11;
export const ROWS = 8;

type Cell = { flags: number; mask: number; path: string };
export type Level = {
  number: number;
  name: string;
  seconds: number;
  cells: Cell[];
  warps: number[][];
  spikes: number[][];
  walls: number[][];
  doors: number[][];
  switches: number[][];
  oil: number[][];
  fuses: number[][];
  glasses: number[][];
  stations: number[][];
  notes: { x: number; y: number; size: number; text: string }[];
  paths: string[];
  actors: number[][];
  rails: number[][];
  lifts: number[][];
  guns: number[][];
  triggers: number[][];
};
