import { PatchAudio } from "./audio";
import type { Board } from "./campaign";
import { BoardDisplay, startBoard, type Engine } from "./engine";

// MS uses twenty game ticks per 1.1 seconds of wall time.
const tickMs = 55;

type Mode = "ready" | "playing" | "paused" | "won" | "lost";
interface Readout {
  mode: Mode;
  chips: number;
  remaining: number;
  equipment: number[];
  hint: string;
  cause: number;
}
export const emptyReadout: Readout = {
  mode: "ready",
  chips: 0,
  remaining: 0,
  equipment: Array(8).fill(0),
  hint: "",
  cause: 0,
};

export class Console {
  mode: Mode = "ready";
  private held = new Map<
    string,
    { command: number; repeatAt: number; speed: number; credit: number }
  >();
  private presses: number[] = [];
  private lastFrame: number | null = null;
  private elapsed = 0;
  private animation = 0;
  private previous = "";
  private board?: Board;
  readonly audio = new PatchAudio();
  constructor(
    private engine: Engine,
    private display: BoardDisplay,
    private update: (s: Readout) => void,
    private finish: (ticks: number) => void
  ) {}

  load(board: Board) {
    this.stopClock();
    this.audio.pause();
    this.board = board;
    startBoard(this.engine, board);
    this.mode = "ready";
    this.display.draw(this.engine, performance.now(), true, true);
    this.show();
    this.animation = requestAnimationFrame(this.frame);
  }
  private show() {
    if (!this.board) return;
    const status: Readout = {
      mode: this.mode,
      chips: this.engine.chips(),
      remaining: Math.max(
        0,
        this.board.seconds - Math.floor(Math.max(0, this.engine.ticks()) / 20)
      ),
      equipment: Array.from({ length: 8 }, (_, i) => this.engine.equipment(i)),
      hint: this.engine.hint() ? this.board.hint : "",
      cause: this.engine.cause(),
    };
    const key = JSON.stringify(status);
    if (key !== this.previous) {
      this.previous = key;
      this.update(status);
    }
  }
  private stopClock() {
    cancelAnimationFrame(this.animation);
    this.lastFrame = null;
    this.elapsed = 0;
    this.held.clear();
    this.presses.length = 0;
  }
  play() {
    if (this.mode !== "ready" && this.mode !== "paused") return;
    cancelAnimationFrame(this.animation);
    this.mode = "playing";
    this.audio.start();
    this.lastFrame = performance.now();
    this.show();
    this.animation = requestAnimationFrame(this.frame);
  }
  pause() {
    if (this.mode !== "playing") return;
    this.stopClock();
    this.mode = "paused";
    this.audio.pause();
    this.display.draw(this.engine, performance.now(), true, true, false);
    this.show();
  }
  press(source: string, command: number, speed = 1) {
    if (this.mode === "ready") this.play();
    if (this.mode !== "playing") return;
    const held = this.held.get(source);
    if (held?.command === command) {
      held.speed = speed;
      return;
    }
    this.held.delete(source);
    this.held.set(source, {
      command,
      repeatAt: performance.now() + 4 * tickMs,
      speed,
      credit: 0,
    });
    this.presses.push(command);
  }
  release(source: string) {
    this.held.delete(source);
  }
  tap(command: number) {
    if (this.mode === "ready") this.play();
    if (this.mode === "playing") this.presses.push(command);
  }
  private frame = (now: number) => {
    if (this.mode === "ready") {
      this.display.draw(this.engine, now, false);
      this.animation = requestAnimationFrame(this.frame);
      return;
    }
    this.elapsed += Math.min(250, Math.max(0, now - (this.lastFrame ?? now)));
    this.lastFrame = now;
    let changed = false;
    let teleported = false;
    let pressHandled = false;
    let earlyTicks = 0;
    while (this.mode === "playing") {
      if (this.elapsed >= tickMs) this.elapsed -= tickMs;
      else {
        // A tap can use the next MS movement slot on this frame. Run the
        // intervening world ticks too, including collisions and forced moves.
        if (pressHandled || !this.presses.length || earlyTicks === 4) break;
        // Borrow the next scheduled tick. Further ticks are deliberate fast
        // play and must not leave the clock frozen after the burst ends.
        this.elapsed =
          earlyTicks === 0 ? Math.max(-tickMs, this.elapsed - tickMs) : 0;
        earlyTicks++;
      }
      let command = this.presses[0] ?? 0;
      // Discrete presses take priority over repeats, including after release.
      if (!command && (this.engine.ticks() + 1) % 4 === 0) {
        const held = Array.from(this.held.values()).at(-1);
        if (held && now - this.elapsed >= held.repeatAt) {
          // Fractional speed spends the same fraction of the original MS move slots.
          held.credit += held.speed;
          if (held.credit >= 1) {
            command = held.command;
            held.credit--;
          }
        }
      }
      const before = this.engine.position();
      const outcome = this.engine.step(command);
      // MS can defer a press until its next movement slot. A blocked move also
      // consumes one press, so a change in position cannot acknowledge input.
      if (this.presses.length && !this.engine.inputPending()) {
        this.presses.shift();
        pressHandled = true;
      }
      changed = true;
      const mask = this.engine.sounds();
      teleported ||= Boolean(mask & (1 << 9));
      this.audio.tick(mask, before !== this.engine.position(), outcome);
      if (outcome) {
        this.stopClock();
        this.mode = outcome > 0 ? "won" : "lost";
        if (outcome > 0) this.finish(Math.max(0, this.engine.ticks()));
      }
    }
    if (changed || this.display.moving)
      this.display.draw(
        this.engine,
        now,
        changed,
        teleported || this.mode !== "playing",
        this.mode === "playing"
      );
    if (changed) this.show();
    if (this.mode === "playing" || this.display.moving)
      this.animation = requestAnimationFrame(this.frame);
  };
  dispose() {
    this.stopClock();
    this.audio.dispose();
  }
}
