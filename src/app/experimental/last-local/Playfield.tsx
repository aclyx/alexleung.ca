"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiMenu, FiPause, FiPlay, FiRotateCcw } from "react-icons/fi";

import { tickWithAudio, type StationAudio } from "@/features/clockwerx/audio";
import {
  noInput,
  retry,
  type Action,
  type Input,
} from "@/features/clockwerx/engine";
import type { Level } from "@/features/clockwerx/level";
import { practiceMoves } from "@/features/clockwerx/practice";
import { drawBoard, type Skin } from "@/features/clockwerx/renderer";
import {
  createWorld,
  difficulties,
  TICKS_PER_SECOND,
  type Difficulty,
  type World,
} from "@/features/clockwerx/world";

import { ControlIcon, controls } from "./Controls";
import styles from "./game.module.css";

type Props = {
  level: Level;
  difficulty: Difficulty;
  total: number;
  completed: number;
  skin: Skin;
  audio: StationAudio;
  menu: boolean;
  hint?: string;
  onMenu: () => void;
  onWin: (score: number) => void;
  nextLabel: string;
  onNext: () => void;
};
function readHud(w: World) {
  return {
    status: w.status,
    score: w.score,
    seconds: Math.ceil(w.time / 60),
    reason: w.reason,
    practiceStep: w.practiceStep,
  };
}
function clock(n: number) {
  return Number.isFinite(n)
    ? Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0")
    : "∞";
}

export function Playfield({
  level,
  difficulty,
  total,
  completed,
  skin,
  audio,
  menu,
  hint,
  onMenu,
  onWin,
  nextLabel,
  onNext,
}: Props) {
  const [interactive, setInteractive] = useState(false);
  const [initial] = useState(() => createWorld(level, difficulty));
  const world = useRef(initial);
  const [hud, setHud] = useState(() => readHud(initial));
  const lastHud = useRef(hud);
  const canvas = useRef<HTMLCanvasElement>(null),
    field = useRef<HTMLDivElement>(null);
  const sources = useRef(new Map<string, Action>()),
    reverse = useRef(false);
  const [held, setHeld] = useState<ReadonlySet<Action>>(() => new Set());
  const win = useRef(onWin);
  useEffect(() => {
    win.current = onWin;
  }, [onWin]);
  const sync = useCallback(() => {
    const value = readHud(world.current),
      old = lastHud.current;
    if (
      old.status !== value.status ||
      old.score !== value.score ||
      old.seconds !== value.seconds ||
      old.reason !== value.reason ||
      old.practiceStep !== value.practiceStep
    ) {
      lastHud.current = value;
      setHud(value);
      if (value.status === "won" && old.status !== "won")
        win.current(value.score);
    }
  }, []);
  const clear = useCallback(() => {
    sources.current.clear();
    reverse.current = false;
    setHeld(new Set());
  }, []);
  const pause = useCallback(() => {
    audio.pause();
    if (world.current.status === "playing") world.current.status = "paused";
    clear();
    sync();
  }, [audio, clear, sync]);
  const press = useCallback(
    (id: string, action: Action) => {
      const w = world.current;
      if (
        menu ||
        (w.status !== "ready" && w.status !== "playing") ||
        sources.current.has(id)
      )
        return;
      if (
        action === "reverse" &&
        ![...sources.current.values()].includes(action)
      )
        reverse.current = true;
      sources.current.set(id, action);
      setHeld(new Set(sources.current.values()));
      w.status = "playing";
      audio.start();
      sync();
    },
    [audio, menu, sync]
  );
  const release = useCallback((id: string) => {
    if (sources.current.delete(id)) setHeld(new Set(sources.current.values()));
  }, []);
  const resume = useCallback(() => {
    world.current.status = "playing";
    audio.start();
    sync();
    field.current?.focus({ preventScroll: true });
  }, [audio, sync]);
  const restart = () => {
    audio.pause();
    world.current = retry(world.current);
    clear();
    sync();
    field.current?.focus({ preventScroll: true });
  };
  useEffect(() => () => audio.pause(), [audio]);
  useEffect(() => {
    if (!menu) field.current?.focus({ preventScroll: true });
  }, [menu]);
  useEffect(() => {
    if (menu) pause();
  }, [menu, pause]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [pause]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (menu || e.metaKey || e.ctrlKey || e.altKey) return;
      const focused = e.target instanceof HTMLElement ? e.target : null;
      if (
        focused?.closest("dialog,input,select,textarea") ||
        (focused?.closest("button,a") &&
          (e.code === "Space" || e.code === "Enter"))
      )
        return;
      if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        if (e.repeat) return;
        if (world.current.status === "paused") resume();
        else pause();
        return;
      }
      const control = controls.find((c) => c.codes.includes(e.code));
      if (!control) return;
      e.preventDefault();
      if (!e.repeat) press(e.code, control.action);
    };
    const up = (e: KeyboardEvent) => release(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [menu, pause, press, release, resume]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let frame = 0,
      last = 0,
      accumulator = 0,
      pixelRatio = 1;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paint = () =>
      drawBoard(ctx, world.current, skin, motion.matches, pixelRatio);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.max(1, Math.round(width * pixelRatio));
      el.height = Math.max(1, Math.round(height * pixelRatio));
      paint();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    motion.addEventListener("change", paint);
    resize();
    setInteractive(true);
    const loop = (now: number) => {
      const w = world.current;
      if (
        !menu &&
        !document.hidden &&
        (w.status === "ready" || w.status === "playing")
      ) {
        accumulator += last ? Math.min(now - last, 100) : 0;
        const input: Input = { ...noInput };
        for (const action of sources.current.values()) input[action] = true;
        while (
          accumulator >= 1000 / TICKS_PER_SECOND &&
          (w.status === "ready" || w.status === "playing")
        ) {
          input.reverse = reverse.current;
          reverse.current = false;
          tickWithAudio(w, input, audio);
          accumulator -= 1000 / TICKS_PER_SECOND;
        }
        if (w.status !== "playing" && w.status !== "ready") clear();
        sync();
      } else accumulator = 0;
      last = now;
      paint();
      if ((w.status === "ready" || w.status === "playing") && !menu)
        frame = requestAnimationFrame(loop);
    };
    if ((hud.status === "ready" || hud.status === "playing") && !menu)
      frame = requestAnimationFrame(loop);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", paint);
      cancelAnimationFrame(frame);
    };
  }, [audio, skin, menu, hud.status, clear, sync]);

  const percent = Math.round((100 * completed) / total);
  const { practiceStep } = hud;
  const practice = practiceStep !== null;
  const drill = practice ? practiceMoves[practiceStep] : undefined;
  const guidedControl =
    drill && controls.find((c) => c.action === drill.action);
  const progressLabel = `${completed} of ${total} boards cleared on ${difficulties[difficulty]}`;
  const showResult =
    !menu &&
    (hud.status === "lost" || hud.status === "won" || hud.status === "paused");
  return (
    <div
      className={styles.shell}
      data-game-skin={skin}
      ref={field}
      tabIndex={-1}
    >
      <div className={skin === "rail" ? styles.railCab : styles.console}>
        <header className={styles.bar}>
          <div className={styles.brand}>
            <h1>Last Local</h1>
          </div>
          {skin === "rail" && (
            <div
              className={styles.routeLights}
              role="progressbar"
              aria-label="Campaign completion"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={completed}
              aria-valuetext={progressLabel}
              title={progressLabel}
            >
              <span className={styles.routeTrack} aria-hidden="true">
                <span
                  className={styles.routeFill}
                  style={{ width: `${percent}%` }}
                />
                {[20, 40, 60, 80, 100].map((stop) => (
                  <i
                    key={stop}
                    style={{ left: `${stop}%` }}
                    data-lit={percent >= stop}
                  />
                ))}
              </span>
              <span className={styles.routeReading}>{percent}%</span>
            </div>
          )}
        </header>
        <section className={styles.screen} aria-label="Game display">
          <section className={styles.hud} aria-label="Level status">
            <div className={styles.topActions}>
              <button
                aria-label="Pause"
                onClick={pause}
                disabled={hud.status !== "playing"}
              >
                <FiPause />
              </button>
              <button
                aria-label="Menu"
                onClick={() => {
                  pause();
                  onMenu();
                }}
              >
                <FiMenu aria-hidden="true" />
                <span>Menu</span>
              </button>
            </div>
            <div className={styles.levelTitle}>
              <span
                aria-label={
                  practice ? "Level 0" : `Level ${level.number} of ${total}`
                }
              >
                {practice
                  ? "Level 0"
                  : `${String(level.number).padStart(2, "0")} / ${total}`}
              </span>
              <h2>{level.name}</h2>
            </div>
            <dl>
              <div>
                <dt>Time</dt>
                <dd>{clock(hud.seconds)}</dd>
              </div>
              <div>
                <dt>{practice ? "Step" : "Score"}</dt>
                <dd>
                  {practice
                    ? `${practiceStep + 1}/${practiceMoves.length + 1}`
                    : hud.score.toLocaleString("en-US")}
                </dd>
              </div>
            </dl>
          </section>
          <div className={styles.stage}>
            <div className={styles.instrument}>
              <canvas
                ref={canvas}
                aria-label={
                  practice
                    ? "Two practice pegs and a rotating gold hand."
                    : `${level.name} playing field. Guide the gold hand to the diamond.`
                }
              />
              {showResult && (
                <div className={styles.result}>
                  <div role="status">
                    <h3>
                      {hud.status === "won"
                        ? practice
                          ? "Training complete"
                          : "Level complete"
                        : hud.status === "lost"
                          ? hud.reason
                          : "Paused"}
                    </h3>
                    {hud.status === "paused" ? (
                      <button onClick={resume}>
                        <FiPlay />
                        Resume
                      </button>
                    ) : hud.status === "lost" ? (
                      <button onClick={restart}>
                        <FiRotateCcw />
                        Try again
                      </button>
                    ) : (
                      <button onClick={onNext}>{nextLabel} →</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p
            className={styles.tip}
            data-practice={practice}
            aria-live={practice ? "polite" : undefined}
            aria-atomic={practice || undefined}
          >
            {drill && guidedControl ? (
              <span>
                {drill.action === "reverse" ? "Tap" : "Hold"}{" "}
                <strong>{guidedControl.label}</strong>
                <span className={styles.lessonKey}>
                  {" "}
                  ({guidedControl.key})
                </span>{" "}
                {drill.instruction}
              </span>
            ) : practice ? (
              "Hold Swing or Flip to grab the diamond."
            ) : (
              (hint ?? `${difficulties[difficulty]} · Reach the diamond`)
            )}
          </p>
        </section>
        <div
          className={styles.controls}
          role="group"
          aria-label="Game controls"
        >
          {controls.map((c) => (
            <button
              key={c.action}
              aria-label={c.label}
              aria-description={c.description}
              data-guided={
                practice &&
                hud.status !== "won" &&
                (drill
                  ? c.action === drill.action
                  : c.action === "swing" || c.action === "flip")
              }
              data-action={c.action}
              disabled={!interactive}
              data-held={held.has(c.action)}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                press("p" + e.pointerId, c.action);
              }}
              onPointerUp={(e) => {
                if (
                  e.pointerType === "touch" &&
                  world.current.status === "playing"
                )
                  audio.start();
                release("p" + e.pointerId);
              }}
              onPointerCancel={(e) => release("p" + e.pointerId)}
              onLostPointerCapture={(e) => release("p" + e.pointerId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  press("button" + e.code, c.action);
                }
              }}
              onKeyUp={(e) => {
                release("button" + e.code);
              }}
              onBlur={() => {
                release("buttonEnter");
                release("buttonSpace");
              }}
            >
              <ControlIcon action={c.action} />
              <span>{c.label}</span>
              <kbd>{c.key}</kbd>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
