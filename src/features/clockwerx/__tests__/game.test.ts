import { tickWithAudio } from "../audio";
import { campaign } from "../campaign";
import { noInput, retry, tick, type Input } from "../engine";
import { hitsSpike } from "../geometry";
import { readLibrary } from "../library";
import { signalSchool } from "../practice";
import {
  canSkip,
  cleared,
  finish,
  newProgress,
  restoreCode,
  saveCode,
  skip,
} from "../progress";
import {
  createWorld,
  QUARTER,
  TICKS_PER_SECOND,
  visible,
  type Difficulty,
  type World,
} from "../world";

function cuesForTick(w: World, input = noInput) {
  const cues: string[] = [];
  tickWithAudio(w, input, { playCue: (cue) => cues.push(cue) });
  return cues;
}

function room() {
  const level = {
    ...campaign[0],
    actors: [[3, 2, 0, 24, 1, -1, 1, 0, 0, 15]],
    cells: campaign[0].cells.map(() => ({ flags: 1, mask: 15, path: "" })),
    spikes: [],
  };
  return createWorld(level, 1);
}
function quarter(input: Partial<Input>) {
  const w = room();
  w.status = "playing";
  for (let i = 0; i < 32; i++) tick(w, { ...noInput, ...input });
  return w;
}

test("Movement uses the Windows time allowances on each difficulty", () => {
  const settings: Difficulty[] = [0, 1, 2, 3];
  expect(
    settings.map((d) => createWorld(campaign[0], d).time / TICKS_PER_SECOND)
  ).toEqual([Infinity, 200, 160, 120]);
});
test("a retracting peg cannot be grabbed and carries its rider under at full depth", () => {
  const w = room(),
    peg = w.pegs[w.hands[0].peg];
  peg.lift = 1;
  w.lowered[0] = true;
  w.status = "playing";
  for (let i = 0; i < 31; i++) tick(w, noInput);
  expect(visible(w, peg)).toBe(false);
  expect(w.status).toBe("playing");
  tick(w, noInput);
  expect(w.status).toBe("lost");
});
test("swing and flip grab the same peg with opposite rotations", () => {
  const start = room().hands[0].peg;
  expect(quarter({ swing: true }).hands[0]).toMatchObject({
    peg: start + 1,
    phase: 2 * QUARTER,
    direction: -1,
  });
  expect(quarter({ flip: true }).hands[0]).toMatchObject({
    peg: start + 1,
    phase: 2 * QUARTER,
    direction: 1,
  });
  expect(quarter({ bounce: true }).lastGrabTick).toBe(-1);
  expect(quarter({ bounce: true }).hands[0]).toMatchObject({
    peg: start,
    phase: 0,
    direction: -1,
  });
  expect(quarter({ swing: true, bounce: true }).hands[0]).toEqual(
    quarter({ flip: true }).hands[0]
  );
});
test("preview and pause freeze the clock, reverse acts immediately", () => {
  const w = room();
  const time = w.time;
  tick(w, noInput);
  expect(w.time).toBe(time);
  expect(w.tick).toBe(0);
  expect(w.previewTicks).toBe(1);
  expect(w.hands[0].phase).not.toBe(3 * QUARTER);
  w.status = "playing";
  tick(w, { ...noInput, reverse: true });
  expect(w.hands[0].direction).toBe(-1);
  expect(w.tick).toBe(1);
  w.status = "paused";
  tick(w, noInput);
  expect(w.tick).toBe(1);
});
test.each([
  [67, 280],
  [96, 148],
  [98, 116],
])(
  "studying level %i for %i ticks cannot advance its hazards",
  (number, delay) => {
    const w = createWorld(campaign[number - 1], 1);
    const before = createWorld(w.level, 1);
    for (let i = 0; i < delay; i++) tick(w, noInput);
    expect(w.hands.slice(1)).toEqual(before.hands.slice(1));
    expect(w.pegs).toEqual(before.pegs);
    expect(w.switches).toEqual(before.switches);
    expect(w.bullets).toEqual([]);
    w.status = "playing";
    tick(w, { ...noInput, flip: true });
    expect(w.status).toBe("playing");
  }
);
test("a spike between angular samples hits the hand in either direction", () => {
  const arm = (angle: number) => ({
    a: { x: 0, y: 0 },
    b: { x: Math.cos(angle), y: Math.sin(angle) },
  });
  const from = arm(-Math.PI / 64),
    to = arm(Math.PI / 64);
  const hit = { x: 1.08, y: 0 },
    clear = { x: 1.09, y: 0 };
  expect(hitsSpike(hit, from, from)).toBe(false);
  expect(hitsSpike(hit, to, to)).toBe(false);
  expect(hitsSpike(hit, from, to)).toBe(true);
  expect(hitsSpike(hit, to, from)).toBe(true);
  expect(hitsSpike(clear, from, to)).toBe(false);
});
test("Passage keeps moving dots when their ring behavior is masked on Child", () => {
  const child = createWorld(campaign[85], 0),
    easy = createWorld(campaign[85], 1);
  const moving = child.pegs.filter((p) => p.path);
  expect(moving).toHaveLength(6);
  for (const p of moving) {
    expect(p.flags & 8).toBe(0);
    expect(easy.pegs[p.id].flags & 8).toBe(8);
  }
  child.status = "playing";
  tick(child, noInput);
  expect(moving.some((p) => p.x !== p.origin.x || p.y !== p.origin.y)).toBe(
    true
  );
});
test("a checkpoint restores the time and pose after a death", () => {
  const w = room(),
    target = w.hands[0].peg + 1;
  w.stations.push([3, 3, 16, -1, 0, 15]);
  w.status = "playing";
  for (let i = 0; i < 32; i++) tick(w, { ...noInput, flip: true });
  expect(w.checkpoint?.peg).toBe(target);
  const time = w.time;
  w.time = 1;
  tick(w, noInput);
  expect(w.status).toBe("lost");
  const again = retry(w);
  expect(again.hands[0]).toMatchObject({
    peg: target,
    phase: 2 * QUARTER,
    direction: -1,
  });
  expect(again.time).toBe(time);
  expect(again.status).toBe("ready");
});
test("retries restore the station score, pickups and door without accumulating later changes", () => {
  const w = room(),
    peg = w.pegs[w.hands[0].peg + 1];
  w.stations.push([peg.y, peg.x, 16, -1, 0, 15]);
  peg.flags |= 2;
  w.barriers.push({
    a: { x: 9, y: 1 },
    b: { x: 9, y: 2 },
    group: 0,
    open: 1,
    target: 1,
    destroyed: false,
  });
  w.status = "playing";
  for (let i = 0; i < 32; i++) tick(w, { ...noInput, flip: true });
  let attempt = w;
  for (let i = 0; i < 2; i++) {
    attempt.score += 2000;
    attempt.bonuses++;
    attempt.pegs[peg.id].collected = false;
    attempt.barriers[0].target = 0;
    attempt = retry(attempt);
    expect(attempt.score).toBe(1000);
    expect(attempt.bonuses).toBe(1);
    expect(attempt.pegs[peg.id].collected).toBe(true);
    expect(attempt.barriers[0].target).toBe(1);
  }
});
test("audio follows successful board actions and plays a result only once", () => {
  const w = room();
  const input = { ...noInput, swing: true };
  const start = { ...w.hands[0] };
  const target = w.pegs[start.peg + 1];
  const grab = () => {
    Object.assign(w.hands[0], start);
    for (let i = 0; i < 31; i++) expect(cuesForTick(w, input)).toEqual([]);
    return cuesForTick(w, input);
  };
  expect(grab()).toEqual([]);
  w.status = "playing";
  target.flags |= 2;
  expect(grab()).toEqual(["bonus"]);
  expect(grab()).toEqual(["swing"]);
  w.stations.push([target.y, target.x, 16, -1, 0, 15]);
  expect(grab()).toEqual(["checkpoint"]);
  expect(grab()).toEqual(["swing"]);
  target.flags |= 4;
  expect(grab()).toEqual(["arrival"]);
  expect(cuesForTick(w, input)).toEqual([]);
  const again = retry(w);
  again.status = "playing";
  again.time = 1;
  expect(cuesForTick(again, input)).toEqual(["miss"]);
  expect(cuesForTick(again, input)).toEqual([]);
});
test.each([
  { x: 8, status: "playing", cues: ["blast"] },
  { x: 1, status: "lost", cues: ["miss", "blast"] },
])(
  "a fuse detonates once and leaves the player $status",
  ({ x, status, cues }) => {
    const w = room();
    w.status = "playing";
    w.fuses.push(
      { x, y: 4, kind: 5, burn: 0, spent: false },
      { x, y: 3, kind: 2, burn: -1, spent: false }
    );
    const wall = {
      a: { x: x - 0.5, y: 3 },
      b: { x: x - 0.5, y: 4 },
      group: -1,
      open: 0,
      target: 0,
      destroyed: false,
    };
    w.barriers.push(wall);
    for (let i = 0; i < 23; i++) expect(cuesForTick(w)).toEqual([]);
    expect(wall.destroyed).toBe(false);
    expect(cuesForTick(w)).toEqual(cues);
    expect(wall.destroyed).toBe(true);
    expect(w.status).toBe(status);
    expect(cuesForTick(w)).toEqual([]);
  }
);
test("a grab reports each pickup and checkpoint activation once", () => {
  const w = room();
  const start = { ...w.hands[0] };
  const target = w.pegs[start.peg + 1];
  target.flags |= 2;
  w.stations.push([target.y, target.x, 16, -1, 0, 15]);
  w.glasses.push({ x: target.x, y: target.y, active: true });
  w.status = "playing";
  const grab = () => {
    Object.assign(w.hands[0], start);
    for (let i = 0; i < 32; i++) tick(w, { ...noInput, flip: true });
  };
  grab();
  const glass = w.glasses[w.glasses.length - 1];
  expect(glass.collectedAt).toBeGreaterThan(0);
  const glassTick = glass.collectedAt;
  expect(target.collectedAt).toBe(32);
  expect(target.activatedAt).toBe(32);
  expect(w.lastGrabTick).toBe(32);
  grab();
  expect(w.lastGrabTick).toBe(64);
  expect(target.collectedAt).toBe(32);
  expect(target.activatedAt).toBe(32);
  expect(glass.collectedAt).toBe(glassTick);
  const fresh = retry(w);
  expect(fresh.checkpoint?.peg).toBe(target.id);
  expect(fresh.pegs[target.id].activatedAt).toBeUndefined();
  expect(fresh.lastGrabTick).toBe(-1);
});

test("a goal only completes once and a held switch triggers once per pass", () => {
  const w = room(),
    start = w.pegs[w.hands[0].peg];
  w.switches.push({ ...start, group: 0, kind: "door", pressed: false });
  w.barriers.push({
    a: { x: 9, y: 0 },
    b: { x: 9, y: 1 },
    group: 0,
    target: 0,
    open: 0,
    destroyed: false,
  });
  w.pegs[start.id + 1].flags = 5;
  w.status = "playing";
  const input = { ...noInput, swing: true };
  expect(cuesForTick(w, input)).toEqual(["switch"]);
  expect(cuesForTick(w, input)).toEqual([]);
  for (let i = 2; i < 32; i++) tick(w, input);
  expect(w.barriers[0].target).toBe(1);
  expect(w.status).toBe("won");
  const score = w.score;
  tick(w, noInput);
  expect(w.score).toBe(score);
});
test("progress survives a code round trip with tutorials, skipped levels and completion", () => {
  const fresh = newProgress(3);
  expect(restoreCode(saveCode(fresh))).toEqual(fresh);
  const movement = finish(fresh);
  expect(movement).toEqual({ ...fresh, current: 1 });
  expect(cleared(movement, 1)).toBe(false);
  let p = finish(movement);
  p = { ...p, current: 11 };
  p = skip(skip(skip(p)));
  expect(canSkip(p)).toBe(false);
  expect(cleared(p, 1)).toBe(true);
  expect(cleared(p, 11)).toBe(false);
  const code = saveCode(p);
  expect(restoreCode(code.toLowerCase())).toEqual(p);
  expect(
    restoreCode(code.slice(0, -1) + (code.endsWith("0") ? "1" : "0"))
  ).toBeNull();
  expect(restoreCode(code + "0")).toBeNull();
  p = finish({ ...p, current: 11 });
  expect(canSkip({ ...p, current: p.frontier })).toBe(true);
  const completed = finish({ ...p, current: 100, frontier: 100 });
  expect(restoreCode(saveCode(completed))).toEqual(completed);
});
test("Signal School requires four actual moves before its destination opens", () => {
  const difficulties: Difficulty[] = [0, 1, 2, 3];
  for (const difficulty of difficulties) {
    const w = createWorld(signalSchool, difficulty);
    const start = w.hands[0].peg;
    const hold = (input: Partial<Input>, until: () => boolean) => {
      for (let i = 0; i < 240 && !until(); i++)
        tick(w, { ...noInput, ...input });
      expect(until()).toBe(true);
    };
    w.status = "playing";
    tick(w, { ...noInput, reverse: true });
    hold({ flip: true }, () => w.hands[0].peg !== start);
    expect(w.practiceStep).toBe(0);
    tick(w, { ...noInput, swing: true });
    expect(w.practiceStep).toBe(0);
    hold({ swing: true }, () => w.practiceStep === 1);
    hold({ flip: true }, () => w.practiceStep === 2);
    const pivot = w.hands[0].peg;
    hold({ bounce: true }, () => w.practiceStep === 3);
    expect(w.hands[0].peg).toBe(pivot);
    expect(w.pegs.some((p) => p.flags & 4)).toBe(false);
    tick(w, { ...noInput, reverse: true });
    expect(w.practiceStep).toBe(4);
    const goal = w.pegs.find((p) => p.flags & 4);
    expect(goal?.id).not.toBe(pivot);
    hold({ flip: true }, () => w.status === "won");
    expect(w.hands[0].peg).toBe(goal?.id);
    expect(w.time).toBe(Infinity);
    expect(retry(w).practiceStep).toBe(0);
  }
});
test("invalid imports fail before decoding resources", () => {
  expect(() => readLibrary(new Uint8Array(47772))).toThrow("Windows CD");
});
