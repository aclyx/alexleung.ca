import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import browserResults from "../../../../docs/last-local-playthrough/results.json";
import { campaign } from "../campaign";
import { noInput, tick } from "../engine";
import type { Level } from "../level";
import { readLibrary } from "../library";
import { signalSchool } from "../practice";
import {
  createWorld,
  difficulties,
  isDifficulty,
  QUARTER,
  stepSpeed,
  visible,
  type Difficulty,
} from "../world";

for (const name of ["LEVELS.CLL", "LEVELS.CL_"]) {
  const library = path.join(process.cwd(), ".cache", "clockwerx", name);
  const checkOriginal = existsSync(library) ? test : test.skip;
  checkOriginal(`every bundled board matches the original ${name}`, () => {
    expect(campaign).toEqual(readLibrary(readFileSync(library)));
  });
}
test("the Windows campaign creates and advances every level on each difficulty", () => {
  const levels = campaign;
  expect(levels).toHaveLength(100);
  const difficulties: Difficulty[] = [0, 1, 2, 3];
  for (const level of levels)
    for (const difficulty of difficulties) {
      const world = createWorld(level, difficulty);
      expect(world.pegs).toHaveLength(88);
      expect(world.hands[0].kind).toBe(0);
      expect(
        world.pegs.some((p) => visible(world, p) && Boolean(p.flags & 4))
      ).toBe(true);
      world.status = "playing";
      for (let i = 0; i < 96; i++) tick(world, noInput);
      expect(world.tick).toBeGreaterThan(0);
      expect(world.hands.every((h) => Number.isFinite(h.phase))).toBe(true);
    }
});
function replay(
  level: Level,
  difficulty: Difficulty,
  inputs: string,
  previewTicks = 0
) {
  const world = createWorld(level, difficulty);
  for (let i = 0; i < previewTicks; i++) tick(world, noInput);
  world.status = "playing";
  for (const token of inputs.split(" ")) {
    const match = /^(R[FSB]?|[FSB]|-)(?::([1-9]\d*))?$/.exec(token);
    if (!match) throw new Error("Invalid replay input " + token);
    const [, action, duration] = match;
    const count = duration ? Number(duration) : QUARTER / stepSpeed[difficulty];
    for (let i = 0; i < count && world.status === "playing"; i++)
      tick(world, {
        swing: action.includes("S"),
        flip: action.includes("F"),
        bounce: action.includes("B"),
        reverse: i === 0 && action.includes("R"),
      });
  }
  return world;
}

const levels = [signalSchool, ...campaign];
test("recorded browser clears cover every board and difficulty", () => {
  expect(browserResults.map((r) => [r.level, r.name])).toEqual(
    levels.map((l) => [l.number, l.name])
  );
  for (const row of browserResults)
    expect(Object.keys(row.checks)).toEqual(difficulties);
});
test.each(
  browserResults.flatMap((row) =>
    Object.entries(row.checks).map(([setting, record]) => ({
      number: row.level,
      name: row.name,
      setting,
      record,
    }))
  )
)(
  "recorded browser clear on $setting, level $number · $name",
  ({ number, setting, record }) => {
    const d = difficulties.indexOf(setting);
    if (!isDifficulty(d)) throw new Error("Invalid replay difficulty");
    const world = replay(levels[number], d, record.inputs, record.previewTicks);
    expect(world.status).toBe("won");
    expect(world.tick).toBe(record.playTicks);
    if (number) expect(world.score).toBe(record.score);
  }
);
