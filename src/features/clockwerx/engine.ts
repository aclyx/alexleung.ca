import {
  distance,
  distanceToSegment,
  hitsSpike,
  intersects,
  point,
  type Segment,
} from "./geometry";
import { COLS, ROWS } from "./level";
import { recordPracticeMove } from "./practice";
import {
  closedSegment,
  copyStationState,
  createWorld,
  handSegment,
  QUARTER,
  saveStation,
  sparkPosition,
  stepSpeed,
  TICKS_PER_SECOND,
  TURN,
  visible,
  wrap,
  type Hand,
  type World,
} from "./world";

export type Action = "swing" | "flip" | "bounce" | "reverse";
export type Input = {
  swing: boolean;
  flip: boolean;
  bounce: boolean;
  reverse: boolean;
};
export const noInput: Input = {
  swing: false,
  flip: false,
  bounce: false,
  reverse: false,
};
const directions = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

function lose(w: World, reason: string) {
  if (w.status === "playing") {
    w.status = "lost";
    w.reason = reason;
  }
}
function attach(w: World, h: Hand, to: number, flip: boolean) {
  const old = w.pegs[h.peg],
    next = w.pegs[to];
  const player = h.kind === 0;
  if (player && old.flags & 0x2000 && next.flags & 0x2000)
    lose(w, "Two death pegs in a row");
  if (old.flags & 8 && player) old.hiddenUntil = w.tick + 180;
  h.peg = to;
  h.phase = wrap(h.phase + TURN / 2);
  if (!flip) h.direction *= -1;
  h.sliding = 0;
  if (player) {
    w.lastGrabTick = w.tick;
    if (next.flags & 2 && !next.collected) {
      next.collected = true;
      next.collectedAt = w.tick;
      w.bonuses++;
      w.score += Math.min(w.bonuses, 5) * 1000;
    }
    if (next.flags & 4 && w.status === "playing") {
      w.status = "won";
      w.score +=
        (w.difficulty + 1) * 1000 +
        (Number.isFinite(w.time) ? Math.ceil(w.time / 60) * 10 : 0);
    }
    const station = w.stations.find((s) => s[0] * COLS + s[1] === to);
    if (station && w.checkpoint?.peg !== to) next.activatedAt = w.tick;
  }
  const exit = w.warps.get(to);
  if (exit !== undefined) {
    h.peg = exit;
    if (
      player &&
      w.barriers.some(
        (b) =>
          !b.destroyed &&
          b.open < 1 &&
          intersects(handSegment(w, h), closedSegment(b), 0.005)
      )
    )
      lose(w, "Warped into a wall");
  }
}
function reverseRotation(h: Hand) {
  if (h.sliding) {
    if (h.phase % QUARTER === 0) h.sliding = 0;
    else {
      const from = h.peg;
      h.peg = h.sliding - 1;
      h.sliding = from + 1;
    }
  }
  h.direction *= -1;
}
function advance(w: World, h: Hand, delta: number, action: Action | undefined) {
  if (!delta) return;
  const before = handSegment(w, h);
  const start = h.phase,
    dir = h.direction;
  const toContact =
    dir > 0 ? QUARTER - (start % QUARTER) : start % QUARTER || QUARTER;
  const first = Math.min(delta, toContact);
  h.phase = wrap(start + dir * first);
  const landing = first === toContact && h.sliding ? h.sliding - 1 : null;
  const after = handSegment(
    w,
    landing === null ? h : { ...h, peg: landing, sliding: 0 }
  );
  if (
    h.kind < 4 &&
    w.barriers.some(
      (b) =>
        !b.destroyed &&
        b.open < 1 &&
        intersects(after, closedSegment(b), 0.005) &&
        !intersects(before, closedSegment(b), 0.005)
    )
  ) {
    h.phase = start;
    reverseRotation(h);
    return;
  }
  if (
    !h.kind &&
    w.spikes.some((s) => s.active && hitsSpike(s, before, after))
  ) {
    lose(w, "Hit a spike");
    return;
  }
  if (first !== toContact) return;
  if (h.sliding) {
    h.peg = h.sliding - 1;
    h.sliding = 0;
  }
  if (h.kind && h.path) {
    const op = h.path[h.index++ % h.path.length];
    action =
      op === "s"
        ? "swing"
        : op === "f"
          ? "flip"
          : op === "b"
            ? "bounce"
            : undefined;
  }
  const tip = handSegment(w, h).b;
  const next = w.pegs.find(
    (p) => p.id !== h.peg && visible(w, p) && distance(p, tip) < 0.13
  );
  if (next && action) {
    if (action === "bounce") h.direction *= -1;
    else attach(w, h, next.id, action === "flip");
  } else if (!h.sliding) {
    // The hand rolls along a connected rail in its tangential direction.
    const [dx, dy] = directions[wrap(h.phase / QUARTER + h.direction, 4)];
    const from = w.pegs[h.peg];
    const rail = w.rails.find((r) => {
      const to = r.from === h.peg ? r.to : r.to === h.peg ? r.from : -1;
      const end = w.pegs[to];
      return (
        end && visible(w, end) && end.x === from.x + dx && end.y === from.y + dy
      );
    });
    if (rail) h.sliding = (rail.from === h.peg ? rail.to : rail.from) + 1;
  }
  if (delta > first) advance(w, h, delta - first, action);
}
function movePegs(w: World) {
  const quarterTicks = QUARTER / stepSpeed[w.difficulty];
  const elapsed = (w.tick % quarterTicks) / quarterTicks;
  const index = Math.floor(w.tick / quarterTicks);
  for (const p of w.pegs) {
    if (!p.path) continue;
    // Positions derive from the level clock so respawns and replays stay deterministic.
    const n = index % p.path.length;
    p.x = p.origin.x;
    p.y = p.origin.y;
    for (let i = 0; i <= n; i++) {
      const op = p.path[i],
        fraction = i === n ? elapsed : 1;
      if (op === "e" || op === "r") p.x += fraction;
      if (op === "w" || op === "l") p.x -= fraction;
      if (op === "s") p.y += fraction;
      if (op === "n") p.y -= fraction;
    }
  }
}
function fire(w: World, group: number) {
  for (const g of w.guns.filter((g) => g.group === group)) {
    directions.forEach(([dx, dy], i) => {
      if (g.barrels & (1 << i))
        w.bullets.push({ x: g.x, y: g.y, vx: dx * 0.075, vy: dy * 0.075 });
    });
  }
}
function updateSwitches(w: World, segments: Segment[]) {
  for (const s of w.switches) {
    const touching = segments.some((seg) => distanceToSegment(s, seg) < 0.1);
    if (touching && !s.pressed) {
      w.lastSwitchTick = w.tick;
      if (s.kind === "door")
        for (const b of w.barriers) {
          if (b.group === s.group) b.target = 1 - b.target;
        }
      if (s.kind === "lift") w.lowered[s.group] = !w.lowered[s.group];
      if (s.kind === "gun") fire(w, s.group);
    }
    s.pressed = touching;
  }
  for (let group = 0; group < w.liftDepth.length; group++) {
    const change = stepSpeed[w.difficulty] * (w.lowered[group] ? 1 : -1);
    w.liftDepth[group] = Math.min(
      QUARTER,
      Math.max(0, w.liftDepth[group] + change)
    );
  }
  for (const b of w.barriers) {
    if (b.open === b.target) continue;
    b.open +=
      Math.sign(b.target - b.open) *
      Math.min(Math.abs(b.target - b.open), 1 / 24);
    if (
      w.status === "playing" &&
      b.open < 1 &&
      intersects(handSegment(w, w.hands[0]), closedSegment(b))
    )
      lose(w, "Caught in the door");
  }
}
function updateOil(w: World, player: Segment) {
  for (const o of w.oil) {
    if (!o.active) continue;
    if (o.mode === "idle") {
      if (distanceToSegment(o, player) > 0.2) continue;
      o.mode = "chase";
    }
    if (o.target < 0) {
      const nearby = w.pegs
        .filter((p) => visible(w, p))
        .sort((a, b) => distance(a, o) - distance(b, o));
      if (!nearby.length) continue;
      o.from = point(o.x, o.y);
      o.target = nearby[0].id;
      o.wait = 40;
    }
    if (o.wait) {
      o.wait--;
      continue;
    }
    const p = w.pegs[o.target],
      d = distance(o, p);
    if (d > 0.025) {
      o.x += ((p.x - o.x) * 0.018) / d;
      o.y += ((p.y - o.y) * 0.018) / d;
      continue;
    }
    o.x = p.x;
    o.y = p.y;
    if (distance(o, player.a) < 0.15) lose(w, "Oil reached your peg");
    const options = w.pegs.filter(
      (next) => visible(w, next) && next.id !== p.id && distance(next, p) < 1.1
    );
    options.sort((a, b) => distance(a, player.a) - distance(b, player.a));
    if (options[0]) {
      o.target = options[0].id;
      o.wait = 45;
    }
    w.random = (Math.imul(w.random, 1664525) + 1013904223) >>> 0;
    if (options.length > 1 && w.oil.length < 20 && w.random % 7 === 0)
      w.oil.push({ ...o, target: options[1].id, wait: 90 });
  }
  if (
    w.oil.some(
      (o) => o.active && o.mode === "chase" && distance(o, player.a) < 0.12
    )
  )
    lose(w, "Oil reached your peg");
}
function updateFuses(w: World, player: Segment) {
  for (let i = 0; i < w.fuses.length; i++) {
    const f = w.fuses[i];
    if (f.spent) continue;
    if (f.kind >= 10 && f.burn < 0 && distanceToSegment(f, player) < 0.22)
      f.burn = w.tick;
    if (f.burn < 0 || w.tick < f.burn) continue;
    if (
      distanceToSegment(sparkPosition(w, i), player) < 0.12 &&
      (f.kind < 10 || w.tick > f.burn + 2)
    )
      lose(w, "Caught by the spark");
    if (w.tick - f.burn < 12) continue;
    f.spent = true;
    if (f.kind >= 4) {
      const next = w.fuses[i + 1];
      if (next && next.kind < 10) next.burn = w.tick;
    } else {
      w.lastBlastTick = w.tick;
      if (distanceToSegment(f, player) < 1.5) lose(w, "Caught in the blast");
      for (const o of [...w.oil, ...w.spikes])
        if (distance(o, f) < 1.5) o.active = false;
      for (const p of w.pegs) if (distance(p, f) < 1.5) p.collected = true;
      for (const b of w.barriers)
        if (b.group === -1 && distanceToSegment(f, b) < 1.5) b.destroyed = true;
      w.hands = w.hands.filter(
        (h) => !h.kind || distanceToSegment(f, handSegment(w, h)) >= 1.5
      );
    }
  }
}
function updateWallbuster(w: World, hand: Hand, player: Segment) {
  if (hand.respawn > w.tick) return;
  const shot = hand.flight;
  if (!shot) {
    const orbit = handSegment(w, hand);
    const center = point(
      (orbit.a.x + orbit.b.x) / 2,
      (orbit.a.y + orbit.b.y) / 2
    );
    if (distanceToSegment(center, player) > 0.14) return;
    const speed = w.hands[0].direction * 0.09;
    hand.flight = {
      ...center,
      vx: -(player.b.y - player.a.y) * speed,
      vy: (player.b.x - player.a.x) * speed,
    };
    return;
  }
  const next = point(shot.x + shot.vx, shot.y + shot.vy);
  const hit = w.barriers.find(
    (b) =>
      !b.destroyed &&
      b.open < 1 &&
      intersects({ a: shot, b: next }, closedSegment(b))
  );
  if (hit && hit.group >= 0) {
    if (hit.a.x === hit.b.x) shot.vx *= -1;
    else shot.vy *= -1;
    shot.x += shot.vx;
    shot.y += shot.vy;
    return;
  }
  if (hit || next.x < -1 || next.y < -1 || next.x > COLS || next.y > ROWS) {
    if (hit) hit.destroyed = true;
    hand.flight = null;
    hand.respawn = w.tick + 3 * TICKS_PER_SECOND;
    return;
  }
  Object.assign(shot, next);
}
function shaft({ a, b }: Segment): Segment {
  return {
    a: point(a.x + (b.x - a.x) * 0.08, a.y + (b.y - a.y) * 0.08),
    b: point(b.x + (a.x - b.x) * 0.06, b.y + (a.y - b.y) * 0.06),
  };
}
export function tick(w: World, input: Input) {
  const h = w.hands[0],
    speed = stepSpeed[w.difficulty];
  if (w.status === "ready") {
    w.previewTicks++;
    h.phase = wrap(h.phase + speed * h.direction);
    return;
  }
  if (w.status !== "playing") return;
  w.tick++;
  w.time--;
  if (w.time <= 0) {
    lose(w, "Time ran out");
    return;
  }
  const riding =
    w.pegs[h.peg].path || (h.sliding && w.pegs[h.sliding - 1].path);
  const beforeRide = riding ? handSegment(w, h) : null;
  movePegs(w);
  if (beforeRide) {
    const afterRide = handSegment(w, h);
    if (w.spikes.some((s) => s.active && hitsSpike(s, beforeRide, afterRide))) {
      lose(w, "Hit a spike");
      return;
    }
  }
  if (input.reverse) reverseRotation(h);
  const action =
    input.flip || (input.swing && input.bounce)
      ? "flip"
      : input.swing
        ? "swing"
        : input.bounce
          ? "bounce"
          : undefined;
  const before = h.direction;
  advance(w, h, speed, action);
  if (w.practiceStep !== null) {
    if (input.reverse) recordPracticeMove(w, "reverse");
    else if (
      action &&
      (w.lastGrabTick === w.tick ||
        (action === "bounce" && h.direction !== before))
    )
      recordPracticeMove(w, action);
  }
  if (w.status !== "playing") return;
  const slow = w.pegs[h.peg].flags & 32 ? 0.5 : 1;
  for (const enemy of w.hands.slice(1)) {
    if (!enemy.flight && enemy.respawn <= w.tick)
      advance(w, enemy, speed * enemy.speed * slow, undefined);
  }
  const player = handSegment(w, h);
  updateSwitches(
    w,
    w.hands.filter((hand) => hand.kind <= 3).map((hand) => handSegment(w, hand))
  );
  const submerged = (hand: Hand) =>
    w.liftDepth[w.pegs[hand.peg].lift - 1] === QUARTER;
  if (submerged(h)) lose(w, "The peg went under");
  if (
    w.pegs[h.peg].path &&
    w.barriers.some(
      (b) =>
        !b.destroyed &&
        b.open < 1 &&
        distanceToSegment(player.a, closedSegment(b)) < 0.05
    )
  )
    lose(w, "Pinned against a wall");
  if (w.liftDepth.includes(QUARTER))
    w.hands = w.hands.filter(
      (hand) => hand.kind === 0 || hand.kind > 3 || !submerged(hand)
    );
  // A warp or a blocked turn can place the hand without an angular sweep.
  if (w.spikes.some((s) => s.active && hitsSpike(s, player, player)))
    lose(w, "Hit a spike");
  for (const enemy of w.hands.slice(1)) {
    const segment = handSegment(w, enemy);
    if (enemy.kind === 4) {
      const mid = point(
        (segment.a.x + segment.b.x) / 2,
        (segment.a.y + segment.b.y) / 2
      );
      if (distanceToSegment(mid, player) < 0.13) lose(w, "Hit a moving spike");
    } else if (enemy.kind === 5) {
      updateWallbuster(w, enemy, player);
    } else if (
      !(w.pegs[h.peg].flags & 64) &&
      intersects(shaft(segment), shaft(player))
    )
      lose(w, "Crossed an enemy hand");
  }
  for (const g of w.glasses)
    if (g.active && distanceToSegment(g, player) < 0.15) {
      g.active = false;
      g.collectedAt = w.tick;
      w.time += 10 * TICKS_PER_SECOND;
      w.score += 1000;
    }
  w.bullets = w.bullets.filter((b) => {
    b.x += b.vx;
    b.y += b.vy;
    const onBoard =
      b.x >= -1 &&
      b.x <= COLS &&
      b.y >= -1 &&
      b.y <= ROWS &&
      !w.barriers.some(
        (wall) =>
          !wall.destroyed &&
          wall.open < 1 &&
          distanceToSegment(b, closedSegment(wall)) < 0.07
      );
    if (onBoard && distanceToSegment(b, player) < 0.1) lose(w, "Hit by a shot");
    return onBoard;
  });
  updateOil(w, player);
  updateFuses(w, player);
  if (w.status === "playing" && w.lastGrabTick === w.tick) {
    const station = w.stations.find(
      ([y, x]) => w.pegs[y * COLS + x].activatedAt === w.tick
    );
    if (station) saveStation(w, station);
  }
}
export function retry(w: World) {
  const cp = w.checkpoint;
  if (!cp) return createWorld(w.level, w.difficulty);
  const fresh: World = {
    ...createWorld(w.level, w.difficulty),
    ...copyStationState(cp.state),
    checkpoint: cp,
  };
  Object.assign(fresh.hands[0], {
    peg: cp.peg,
    phase: cp.phase,
    direction: cp.direction,
    sliding: 0,
  });
  fresh.pegs[cp.peg].activatedAt = undefined;
  return fresh;
}
