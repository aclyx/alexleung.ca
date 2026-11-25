"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  benchTest,
  decodeBytes,
  encodeBytes,
  newProgress,
  readProgress,
  readWindowsCampaign,
  type Board,
  type Progress,
} from "./campaign";
import { Console, emptyReadout } from "./console";
import s from "./console.module.css";
import { BoardDisplay, loadEngine } from "./engine";
import { restoreCode, saveCode } from "./save";

const rootKey = "patch-bay.v1.";
const campaignUrl =
  process.env.NEXT_PUBLIC_PATCH_BAY_CAMPAIGN_URL ||
  "https://raw.githubusercontent.com/gcmaniac/win10_cc/74da8199a3e45b7d154f08a683132761fabd7663/direct_method/chips_challenge/CHIPS.DAT";
const directions: readonly [string, number, string][] = [
  ["Up", 1, "▲"],
  ["Left", 2, "◀"],
  ["Right", 8, "▶"],
  ["Down", 4, "▼"],
];
const keys: Record<string, number> = {
  Numpad8: 1,
  Numpad4: 2,
  Numpad2: 4,
  Numpad6: 8,
  ArrowUp: 1,
  KeyW: 1,
  ArrowLeft: 2,
  KeyA: 2,
  ArrowDown: 4,
  KeyS: 4,
  ArrowRight: 8,
  KeyD: 8,
};
const gear: readonly [number, string][] = [
  [101, "Red key"],
  [100, "Blue key"],
  [103, "Yellow key"],
  [102, "Green key"],
  [106, "Skates"],
  [107, "Suction boots"],
  [105, "Fire boots"],
  [104, "Flippers"],
];
const causes = [
  "",
  "Drowned in water",
  "Caught in fire",
  "Caught in a blast",
  "",
  "Hit by a creature",
  "Crushed",
  "Crushed",
];
const testBoards = [benchTest()];
type Panel = "levels" | "save" | "guide" | null;
function stored(key: string) {
  try {
    return localStorage.getItem(rootKey + key);
  } catch {
    return null;
  }
}
function put(key: string, value: string) {
  try {
    localStorage.setItem(rootKey + key, value);
    return true;
  } catch {
    return false;
  }
}

async function loadCampaign(signal: AbortSignal) {
  const cached = stored("dat");
  if (cached) {
    try {
      return await readWindowsCampaign(decodeBytes(cached));
    } catch {
      // Replace an unreadable saved copy with the verified download.
    }
  }
  const response = await fetch(campaignUrl, {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw Error("Campaign download failed");
  const bytes = new Uint8Array(await response.arrayBuffer());
  const levels = await readWindowsCampaign(bytes);
  if (!signal.aborted) put("dat", encodeBytes(bytes));
  return levels;
}

function sprite(id: number, atlasUrl: string) {
  return {
    backgroundImage: `url(${atlasUrl})`,
    backgroundSize: "1600% 700%",
    backgroundPosition: `${((id % 16) * 100) / 15}% ${(Math.floor(id / 16) * 100) / 6}%`,
  };
}

export function PatchBay({ atlasUrl }: { atlasUrl: string }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    message = useRef<HTMLParagraphElement>(null),
    game = useRef<Console | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    boardAction = useRef<HTMLButtonElement>(null);
  const [boards, setBoards] = useState(testBoards),
    book = useRef(testBoards);
  const [progress, setProgress] = useState(newProgress),
    save = useRef(progress);
  const [hud, setHud] = useState(emptyReadout),
    [panel, setPanel] = useState<Panel>(null),
    openPanel = useRef<Panel>(null);
  const [ready, setReady] = useState(false),
    [notice, setNotice] = useState(""),
    [code, setCode] = useState(""),
    [password, setPassword] = useState(""),
    [passwordChoices, setPasswordChoices] = useState<number[]>([]),
    [hintOverflows, setHintOverflows] = useState(false),
    [music, setMusic] = useState(true),
    [effects, setEffects] = useState(true);
  const board = boards[progress.current - 1],
    campaign = boards.length === 149;
  const stopped = hud.mode === "paused" || hud.mode === "lost";
  const hint =
    hud.hint && campaign && board.number === 16
      ? `${hud.hint} In Patch Bay, choose Pause → Restart level.`
      : hud.hint;
  useLayoutEffect(() => {
    const box = message.current;
    if (!box || !hint || hud.mode !== "playing") {
      setHintOverflows(false);
      return;
    }
    const measure = () =>
      setHintOverflows(box.scrollHeight > box.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [hint, hud.mode]);
  useEffect(() => {
    if (stopped && !panel) boardAction.current?.focus({ preventScroll: true });
  }, [stopped, panel]);

  function remember(p: Progress) {
    save.current = p;
    setProgress(p);
    if (
      !put(book.current.length === 149 ? "windows" : "bench", JSON.stringify(p))
    )
      setNotice("Storage is unavailable. Copy a save code before leaving.");
  }
  function install(levels: Board[]) {
    let p = newProgress();
    const raw = stored(levels.length === 149 ? "windows" : "bench");
    if (raw)
      try {
        p = readProgress(raw, levels);
      } catch {
        setNotice("The saved progress could not be read.");
      }
    book.current = levels;
    save.current = p;
    setBoards(levels);
    setProgress(p);
    game.current?.load(levels[p.current - 1]);
  }
  useEffect(() => {
    let disposed = false;
    const request = new AbortController();
    const timeout = window.setTimeout(() => request.abort(), 8000);
    const atlas = new Image();
    atlas.src = atlasUrl;
    void (async () => {
      const [engine, levels] = await Promise.all([
        loadEngine(),
        loadCampaign(request.signal)
          .catch(() => testBoards)
          .finally(() => window.clearTimeout(timeout)),
        atlas.decode(),
      ]);
      if (disposed || !canvas.current) return;
      game.current = new Console(
        engine,
        new BoardDisplay(canvas.current, atlas),
        setHud,
        (ticks) => {
          const p = save.current,
            n = p.current,
            known = new Set(p.known);
          if (n < book.current.length && n !== 144) known.add(n + 1);
          remember({
            ...p,
            known: Array.from(known).sort((a, b) => a - b),
            best: { ...p.best, [n]: Math.min(p.best[n] ?? Infinity, ticks) },
          });
        }
      );
      const musicOn = stored("music") !== "off",
        effectsOn = stored("effects") !== "off";
      game.current.audio.configure(musicOn, effectsOn);
      setMusic(musicOn);
      setEffects(effectsOn);
      install(levels);
      setReady(true);
    })().catch(() => {
      if (!disposed)
        setNotice("Patch Bay could not start. Reload to try again.");
    });
    function keydown(e: KeyboardEvent) {
      if (
        openPanel.current ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        !game.current
      )
        return;
      const cmd = keys[e.code];
      if (cmd) {
        e.preventDefault();
        if (!e.repeat) game.current.press(e.code, cmd);
      } else if (
        e.code === "Escape" ||
        (e.code === "Space" && !(e.target instanceof HTMLButtonElement))
      ) {
        e.preventDefault();
        if (e.repeat) return;
        if (game.current.mode === "playing") game.current.pause();
        else if (
          game.current.mode === "paused" ||
          game.current.mode === "ready"
        )
          game.current.play();
        else return;
        game.current.audio.control();
      }
    }
    const keyup = (e: KeyboardEvent) => game.current?.release(e.code);
    const pause = () => game.current?.pause();
    const hidden = () => {
      if (document.hidden) pause();
    };
    const release = (e: PointerEvent) => {
      game.current?.release("p" + e.pointerId);
      if (e.type === "pointerup" && game.current?.mode === "playing")
        game.current.audio.unlock();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      request.abort();
      game.current?.dispose();
      game.current = null;
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [atlasUrl]);
  function showPanel(which: Exclude<Panel, null>) {
    game.current?.pause();
    openPanel.current = which;
    setPanel(which);
    setPassword("");
    setPasswordChoices([]);
    setCode("");
    setNotice("");
    dialog.current?.showModal();
  }
  function closePanel() {
    openPanel.current = null;
    setPanel(null);
    dialog.current?.close();
    if (game.current?.mode === "ready" || game.current?.mode === "playing")
      canvas.current?.focus({ preventScroll: true });
  }
  function select(n: number) {
    const p = save.current;
    setNotice("");
    remember({
      ...p,
      current: n,
      known: [...new Set([...p.known, n])].sort((a, b) => a - b),
    });
    game.current?.load(book.current[n - 1]);
    closePanel();
  }
  function restore() {
    try {
      const p = restoreCode(code, boards);
      remember(p);
      game.current?.load(boards[p.current - 1]);
      closePanel();
    } catch {
      setNotice("That save code does not match this campaign.");
    }
  }
  const score = Object.entries(progress.best).reduce(
    (sum, [id, ticks]) =>
      sum +
      500 * Number(id) +
      (ticks === null
        ? 0
        : 10 *
          Math.max(0, boards[Number(id) - 1].seconds - Math.floor(ticks / 20))),
    0
  );
  const end144 = campaign && board.number === 144;
  const status =
    hud.mode === "won"
      ? end144
        ? "Campaign complete"
        : "Circuit complete"
      : stopped
        ? ""
        : hint;
  function primary() {
    if (hud.mode === "won" && end144) {
      showPanel("levels");
      return;
    }
    if (hud.mode === "won" && board.number < boards.length) {
      select(board.number + 1);
      return;
    }
    if (hud.mode === "lost" || hud.mode === "won") {
      select(board.number);
      return;
    }
    if (hud.mode === "playing") game.current?.pause();
    else {
      game.current?.play();
      canvas.current?.focus({ preventScroll: true });
    }
  }
  const control =
    hud.mode === "won"
      ? end144
        ? "Bonus levels"
        : board.number < boards.length
          ? "Next level"
          : "Replay"
      : hud.mode === "lost"
        ? "Retry level"
        : hud.mode === "paused"
          ? "Resume"
          : hud.mode === "ready"
            ? "Start"
            : "Pause";
  return (
    <div
      className={s.room}
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest(
            "button:not([data-direction]), input[type=file], a[download]"
          )
        )
          game.current?.audio.control();
      }}
    >
      <section className={s.instrument} aria-label="Patch Bay game console">
        <header className={s.badge}>
          <i />
          <h1>
            <span className={s.ic} aria-hidden="true" />
            Patch Bay
          </h1>
          <b aria-hidden="true" />
          <i />
        </header>
        <div className={s.deck}>
          <div className={s.glass}>
            <canvas
              ref={canvas}
              tabIndex={-1}
              width={864}
              height={864}
              aria-label="Game board. Move with the arrow keys, WASD, or the directional pad."
            />
            {hud.mode === "paused" && !panel && (
              <div className={s.interrupt}>
                <div className={s.readout}>
                  <div role="status">
                    {!hint && (
                      <span className={s.signal} aria-hidden="true">
                        Ⅱ
                      </span>
                    )}
                    <h2 id="patch-pause">Paused</h2>
                  </div>
                  {hint && <p>{hint}</p>}
                  <div className={s.pauseActions}>
                    <button
                      ref={boardAction}
                      onClick={primary}
                      aria-describedby="patch-pause"
                    >
                      Resume game
                    </button>
                    <button onClick={() => select(board.number)}>
                      Restart level
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <aside className={s.rail}>
            <div className={s.level}>
              <span>
                {ready &&
                  (campaign
                    ? `LEVEL ${String(board.number).padStart(3, "0")} / 149`
                    : "WORKBENCH")}
              </span>
              <h2 data-level={ready ? board.number : undefined}>
                {ready ? board.title : "Loading campaign…"}
              </h2>
            </div>
            <div className={s.meters}>
              <div>
                Chips <output>{String(hud.chips).padStart(2, "0")}</output>
              </div>
              <div>
                Time{" "}
                <output>
                  {board.seconds ? String(hud.remaining).padStart(3, "0") : "—"}
                </output>
              </div>
            </div>
            <div className={s.inventory} aria-label="Inventory">
              {gear.map(([id, name], i) => (
                <div
                  key={id}
                  title={name + " × " + hud.equipment[i]}
                  aria-label={name + " × " + hud.equipment[i]}
                >
                  <span
                    style={{
                      ...sprite(id, atlasUrl),
                      opacity: hud.equipment[i] ? 1 : 0.18,
                    }}
                  />
                  {hud.equipment[i] > 1 && <small>{hud.equipment[i]}</small>}
                </div>
              ))}
            </div>
            <p
              ref={message}
              className={s.message}
              role="status"
              data-mode={hud.mode}
            >
              <span>
                {status ||
                  (ready && hud.mode === "ready"
                    ? campaign
                      ? "Ready"
                      : "Campaign unavailable. Try this board or open CHIPS.DAT in Levels."
                    : "")}
              </span>
              {hintOverflows && hud.mode === "playing" && (
                <button
                  className={s.readHint}
                  onClick={() => game.current?.pause()}
                >
                  Read hint
                </button>
              )}
            </p>
            <div
              className={s.pad}
              aria-label={hud.mode === "lost" ? undefined : "Directional pad"}
            >
              {hud.mode === "lost" ? (
                <div className={s.fault} role="alert">
                  <h2 id="patch-loss">
                    {hud.cause === 4 ? "Time’s up" : "You died"}
                  </h2>
                  {causes[hud.cause] && (
                    <p id="patch-cause">{causes[hud.cause]}</p>
                  )}
                </div>
              ) : (
                directions.map(([name, cmd, arrow]) => (
                  <button
                    key={cmd}
                    className={s["dir" + cmd]}
                    data-direction={cmd}
                    aria-label={"Move " + name.toLowerCase()}
                    disabled={!ready || stopped || hud.mode === "won"}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      game.current?.press("p" + e.pointerId, cmd);
                    }}
                    onPointerMove={(e) => {
                      if (!e.currentTarget.hasPointerCapture(e.pointerId))
                        return;
                      const hit = document
                        .elementFromPoint(e.clientX, e.clientY)
                        ?.closest("button[data-direction]");
                      const dir = Number(hit?.getAttribute("data-direction"));
                      if (dir) game.current?.press("p" + e.pointerId, dir);
                      else game.current?.release("p" + e.pointerId);
                    }}
                    onLostPointerCapture={(e) =>
                      game.current?.release("p" + e.pointerId)
                    }
                    onClick={(e) => {
                      if (e.detail === 0) game.current?.tap(cmd);
                    }}
                  >
                    {arrow}
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
        <footer className={s.strip}>
          <i />
          <div className={s.vents} aria-hidden="true" />
          <button disabled={!ready} onClick={() => showPanel("levels")}>
            Levels
          </button>
          <button disabled={!ready} onClick={() => showPanel("save")}>
            Save
          </button>
          <button disabled={!ready} onClick={() => showPanel("guide")}>
            Guide
          </button>
          <button
            className={s.primary}
            disabled={!ready}
            ref={hud.mode === "lost" ? boardAction : undefined}
            aria-describedby={
              hud.mode === "lost"
                ? causes[hud.cause]
                  ? "patch-loss patch-cause"
                  : "patch-loss"
                : undefined
            }
            onClick={primary}
          >
            {control}
          </button>
          <i />
        </footer>
        {!panel && notice && (
          <p className={s.error} role="alert">
            {notice}
          </p>
        )}
      </section>
      <dialog
        ref={dialog}
        className={s.dialog}
        onCancel={(event) => {
          event.preventDefault();
          closePanel();
          game.current?.audio.control();
        }}
      >
        <header>
          <h2>
            {panel === "levels"
              ? "Levels"
              : panel === "save"
                ? "Save progress"
                : "Field guide"}
          </h2>
          <button aria-label="Close menu" onClick={closePanel}>
            ✕
          </button>
        </header>
        {panel === "levels" && (
          <>
            <p>
              {campaign
                ? `${Object.keys(progress.best).length} of 149 cleared · ${score.toLocaleString()} points`
                : "Load the 149-level Windows campaign from your copy of Chip’s Challenge."}
            </p>
            <label className={s.import}>
              Open CHIPS.DAT
              <input
                type="file"
                accept=".dat"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    if (file.size !== 108569)
                      throw Error("Choose the 149-level Windows CHIPS.DAT.");
                    const bytes = new Uint8Array(await file.arrayBuffer()),
                      levels = await readWindowsCampaign(bytes);
                    const saved = put("dat", encodeBytes(bytes));
                    install(levels);
                    closePanel();
                    setNotice(
                      saved
                        ? ""
                        : "Reopen CHIPS.DAT next visit. Browser storage is unavailable."
                    );
                  } catch (err) {
                    setNotice(
                      err instanceof Error
                        ? err.message
                        : "Could not read this file."
                    );
                  }
                }}
              />
            </label>
            {campaign && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const matches = boards.filter(
                    (v) => v.password === password.trim().toUpperCase()
                  );
                  if (matches.length === 1) select(matches[0].number);
                  else {
                    setPasswordChoices(matches.map((b) => b.number));
                    setNotice(matches.length ? "" : "Unknown level password.");
                  }
                }}
              >
                <label>
                  Level password
                  <input
                    value={password}
                    maxLength={4}
                    autoCapitalize="characters"
                    placeholder="Four letters"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordChoices([]);
                      setNotice("");
                    }}
                  />
                </label>
                <button>Open level</button>
              </form>
            )}
            {passwordChoices.length > 0 && (
              <p role="status">Choose a level for this password.</p>
            )}
            <div className={s.list}>
              {(passwordChoices.length ? passwordChoices : progress.known).map(
                (n) => (
                  <button key={n} onClick={() => select(n)}>
                    <span>{String(n).padStart(3, "0")}</span>{" "}
                    {boards[n - 1].title}{" "}
                    {progress.best[n] !== undefined ? "✓" : ""}
                  </button>
                )
              )}
            </div>
          </>
        )}
        {panel === "save" && (
          <>
            <p>
              Progress saves on this device after each clear. Paste a code on
              another device with the same campaign open.
            </p>
            <label>
              Progress code · levels and clears
              <textarea
                readOnly
                value={saveCode(progress, boards.length, false)}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <label>
              Full save · includes best times
              <textarea
                readOnly
                value={saveCode(progress, boards.length, true)}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <label>
              Restore progress
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <button disabled={!code.trim()} onClick={restore}>
              Restore save
            </button>
            {campaign && (
              <p>
                Current level password <strong>{board.password}</strong>
              </p>
            )}
          </>
        )}
        {panel === "guide" && (
          <>
            <p>
              Move with the arrows, WASD, numeric keypad or directional pad.
              Hold to keep moving, or slide your thumb to turn. Space pauses and
              resumes.
            </p>
            <div className={s.legend}>
              {[
                [2, "Chip", "Collect the required count."],
                [34, "DIP cradle", "Pass once the chip counter reaches zero."],
                [21, "Exit lift", "Enter to clear the board."],
              ].map(([id, name, desc]) => (
                <div key={id}>
                  <span style={sprite(Number(id), atlasUrl)} />
                  <p>
                    <strong>{name}</strong>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
            <button
              aria-pressed={music}
              onClick={() => {
                game.current?.audio.configure(!music, effects);
                put("music", music ? "off" : "on");
                setMusic(!music);
              }}
            >
              Music {music ? "on" : "off"}
            </button>{" "}
            <button
              aria-pressed={effects}
              onClick={() => {
                game.current?.audio.configure(music, !effects);
                put("effects", effects ? "off" : "on");
                setEffects(!effects);
              }}
            >
              Effects {effects ? "on" : "off"}
            </button>{" "}
            <button onClick={() => select(board.number)}>Restart level</button>
            <p className={s.credit}>
              Microsoft rules powered by Tile World.{" "}
              <a href="/assets/patch-bay/engine-source.zip" download>
                Engine source and GPL license
              </a>
            </p>
          </>
        )}
        {panel && notice && <p role="alert">{notice}</p>}
      </dialog>
    </div>
  );
}
