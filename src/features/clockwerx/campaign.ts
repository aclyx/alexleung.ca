import records from "./campaign.json";
import type { Level } from "./level";

type BoardRecord = Omit<Level, "cells"> & {
  flags: number[][];
  masks: number[][];
  pegPaths: Record<string, string | undefined>;
};

function buildLevel({ flags, masks, pegPaths, ...level }: BoardRecord): Level {
  return {
    ...level,
    cells: flags.flatMap((row, y) =>
      row.map((value, x) => ({
        flags: value,
        mask: masks[y][x],
        path: pegPaths[y * row.length + x] ?? "",
      }))
    ),
  };
}
export const campaign: Level[] = records.map(buildLevel);
