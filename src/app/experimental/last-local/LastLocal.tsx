"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiArrowLeft, FiBookOpen, FiX } from "react-icons/fi";

import Link from "next/link";

import { StationAudio } from "@/features/clockwerx/audio";
import { campaign } from "@/features/clockwerx/campaign";
import { signalSchool } from "@/features/clockwerx/practice";
import {
  canSkip,
  cleared,
  finish,
  newProgress,
  restoreCode,
  saveCode,
  skip,
  type Progress,
} from "@/features/clockwerx/progress";
import { isSkin, skins, type Skin } from "@/features/clockwerx/renderer";
import {
  difficulties,
  isDifficulty,
  type Difficulty,
} from "@/features/clockwerx/world";

import { ControlIcon, controls } from "./Controls";
import styles from "./game.module.css";
import { Glossary } from "./Glossary";
import { Playfield } from "./Playfield";
import { tutorialNotes } from "./tutorialNotes";

const prefix = "clockwerx.v1.";
const soundChannels: readonly ("music" | "effects")[] = ["music", "effects"];
function get(key: string) {
  try {
    return localStorage.getItem(prefix + key);
  } catch {
    return null;
  }
}
function put(key: string, value: string) {
  try {
    localStorage.setItem(prefix + key, value);
    return true;
  } catch {
    return false;
  }
}
function progressKey(difficulty: Difficulty) {
  return "windows." + difficulty;
}
function readProgress(difficulty: Difficulty) {
  const saved = restoreCode(get(progressKey(difficulty)) ?? "");
  return saved?.difficulty === difficulty ? saved : newProgress(difficulty);
}
export function LastLocal() {
  const [progress, setProgress] = useState(() => newProgress(1));
  const [replayingSchool, setReplayingSchool] = useState(false);
  const [audio] = useState(() => new StationAudio());
  const [sound, setSound] = useState({ music: true, effects: true });
  const [notes, setNotes] = useState(true);
  const [skin, setSkin] = useState<Skin>("rail");
  const [panel, setPanel] = useState<"menu" | "glossary" | null>(null),
    [message, setMessage] = useState(""),
    [code, setCode] = useState("");
  const [serial, setSerial] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = panel !== null;
  const inSchool = replayingSchool || progress.current === 0;
  const current = inSchool ? signalSchool : campaign[progress.current - 1];
  const lesson = tutorialNotes[current.number];
  useEffect(() => {
    const d = Number(get("difficulty") ?? 1);
    setProgress(readProgress(isDifficulty(d) ? d : 1));
    const music = get("music") !== "off",
      effects = get("effects") !== "off";
    setSound({ music, effects });
    audio.configure(music, effects);
    setNotes(get("notes") !== "off");
    const savedSkin = get("skin");
    if (isSkin(savedSkin)) setSkin(savedSkin);
    return () => audio.dispose();
  }, [audio]);
  useLayoutEffect(() => {
    const el = dialog.current;
    if (open && !el?.open) el?.showModal();
    if (!open && el?.open) el.close();
  }, [open]);
  const persist = (p: Progress) => {
    setProgress(p);
    if (!put(progressKey(p.difficulty), saveCode(p)))
      setMessage(
        "Browser storage is unavailable. Keep your progress code to continue later."
      );
  };
  const bestKey = progressKey(progress.difficulty) + ".best." + current.number;
  const best = open ? Number(get(bestKey)) : 0;
  const win = (score: number) => {
    if (inSchool) {
      if (progress.current === 0) {
        setReplayingSchool(true);
        persist(finish(progress));
      }
      return;
    }
    put(bestKey, String(Math.max(score, Number(get(bestKey)) || 0)));
    persist(finish(progress));
  };
  const close = () => {
    setPanel(null);
    setCode("");
  };
  const leaveSchool = () => {
    setReplayingSchool(false);
    if (progress.current === 0) persist({ ...progress, current: 1 });
  };
  const schoolExit =
    progress.current > 1
      ? `Return to level ${progress.current}`
      : "Start level 1";
  return (
    <>
      <Playfield
        key={[progress.difficulty, current.number, serial].join("-")}
        level={current}
        difficulty={progress.difficulty}
        total={campaign.length}
        completed={
          campaign.filter((board) => cleared(progress, board.number)).length
        }
        skin={skin}
        audio={audio}
        hint={notes ? lesson?.[0] : undefined}
        menu={open}
        onMenu={() => {
          setMessage("");
          setPanel("menu");
        }}
        onWin={win}
        nextLabel={
          inSchool
            ? schoolExit
            : current.number === campaign.length
              ? "Campaign menu"
              : "Next level"
        }
        onNext={() => {
          if (inSchool) {
            leaveSchool();
            return;
          }
          if (current.number === campaign.length) {
            setPanel("menu");
            return;
          }
          persist({ ...progress, current: current.number + 1 });
        }}
      />
      <dialog
        ref={dialog}
        data-game-skin={skin}
        className={styles.menu}
        data-glossary={panel === "glossary"}
        aria-labelledby="clock-menu-title"
        onCancel={close}
        onClose={() => {
          if (!dialog.current?.open) close();
        }}
      >
        <div className={styles.menuHeader}>
          <h2 id="clock-menu-title">
            {panel === "glossary" ? "Glossary" : "Game menu"}
          </h2>
          <button
            className={styles.glossaryToggle}
            onClick={() => {
              dialog.current?.scrollTo(0, 0);
              setPanel(panel === "glossary" ? "menu" : "glossary");
            }}
          >
            {panel === "glossary" ? (
              <>
                <FiArrowLeft aria-hidden="true" /> Game menu
              </>
            ) : (
              <>
                <FiBookOpen aria-hidden="true" /> Glossary
              </>
            )}
          </button>
          <button onClick={close} aria-label="Close menu">
            <FiX />
          </button>
        </div>
        {panel === "glossary" && <Glossary skin={skin} />}
        <div className={styles.menuBody} hidden={panel === "glossary"}>
          <div className={styles.settings}>
            <label>
              Difficulty
              <select
                value={progress.difficulty}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  if (!isDifficulty(d)) return;
                  put("difficulty", String(d));
                  setReplayingSchool(false);
                  setProgress(readProgress(d));
                }}
              >
                {difficulties.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Appearance
              <select
                value={skin}
                onChange={(e) => {
                  const next = e.target.value;
                  if (!isSkin(next)) return;
                  setSkin(next);
                  put("skin", next);
                }}
              >
                {Object.entries(skins).map(([s, v]) => (
                  <option key={s} value={s}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.settings}>
            {soundChannels.map((channel) => (
              <label key={channel} className={styles.checkSetting}>
                <input
                  type="checkbox"
                  checked={sound[channel]}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    const next = { ...sound, [channel]: enabled };
                    setSound(next);
                    audio.configure(next.music, next.effects);
                    put(channel, enabled ? "on" : "off");
                  }}
                />
                {channel === "music" ? "Music" : "Sound effects"}
              </label>
            ))}
          </div>
          {lesson && (
            <details>
              <summary>Level notes</summary>
              <label className={styles.checkSetting}>
                <input
                  type="checkbox"
                  checked={notes}
                  onChange={(e) => {
                    setNotes(e.target.checked);
                    put("notes", e.target.checked ? "on" : "off");
                  }}
                />
                Show the level hint below the board
              </label>
              <ul className={styles.noteList}>
                {lesson.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </details>
          )}
          <label>
            Level
            <select
              value={current.number}
              onChange={(e) => {
                const n = Number(e.target.value);
                setReplayingSchool(n === 0);
                if (n !== 0) persist({ ...progress, current: n });
                setPanel(null);
              }}
            >
              <option value={0}>0. {signalSchool.name}</option>
              {campaign.map((l) => (
                <option
                  value={l.number}
                  key={l.number}
                  disabled={l.number > progress.frontier}
                >
                  {l.number}. {l.name}
                  {cleared(progress, l.number) ? " ✓" : ""}
                </option>
              ))}
            </select>
          </label>
          {best > 0 && (
            <p>Best score on this level · {best.toLocaleString("en-US")}</p>
          )}
          <div className={styles.menuActions}>
            <button
              onClick={() => {
                setSerial((s) => s + 1);
                close();
              }}
            >
              Restart level
            </button>
            {inSchool && (
              <button
                onClick={() => {
                  leaveSchool();
                  close();
                }}
              >
                {schoolExit}
              </button>
            )}
            {!inSchool && canSkip(progress) && (
              <button
                onClick={() => {
                  persist(skip(progress));
                  close();
                }}
              >
                Skip level ({3 - progress.skipped.length} left)
              </button>
            )}
          </div>
          <details>
            <summary>How to play</summary>
            <ul className={styles.controlGuide}>
              {controls.map((c) => (
                <li key={c.action}>
                  <ControlIcon action={c.action} />
                  <div>
                    <strong>{c.label}</strong>
                    <p>{c.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p>
              Use X or period to swing, Shift to flip, Z or slash to bounce, and
              Space to reverse. Press P to pause.
            </p>
          </details>
          <details>
            <summary>Transfer progress</summary>
            <p>
              Enter this code on another device to continue from this level.
            </p>
            <output>{saveCode(progress)}</output>
            <label>
              Restore a progress code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button
              onClick={() => {
                const restored = restoreCode(code);
                if (!restored) {
                  setMessage("Check the progress code and try again.");
                  return;
                }
                persist(restored);
                setReplayingSchool(false);
                put("difficulty", String(restored.difficulty));
                setSerial((s) => s + 1);
                close();
              }}
            >
              Restore progress
            </button>
          </details>
          {message && <p role="status">{message}</p>}
          <Link href="/">Exit to alexleung.ca ↗</Link>
        </div>
      </dialog>
    </>
  );
}
