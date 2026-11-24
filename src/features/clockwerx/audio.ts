import { tick, type Input } from "./engine";
import type { World } from "./world";

type Strike = readonly [
  fromHz: number,
  toHz: number,
  duration: number,
  delay: number,
  gain: number,
  waveform?: OscillatorType,
];
const signals = {
  swing: [[680, 310, 0.055, 0, 0.13]],
  flip: [
    [470, 270, 0.045, 0, 0.1],
    [760, 430, 0.06, 0.038, 0.09],
  ],
  bounce: [[215, 105, 0.09, 0, 0.15]],
  reverse: [[330, 540, 0.065, 0, 0.1]],
  switch: [
    [385, 170, 0.046, 0, 0.13],
    [820, 460, 0.055, 0.065, 0.09],
  ],
  warp: [
    [294, 880, 0.13, 0, 0.1],
    [660, 330, 0.16, 0.1, 0.09],
  ],
  bonus: [
    [523.25, 523.25, 0.16, 0, 0.13],
    [698.46, 698.46, 0.24, 0.08, 0.12],
  ],
  time: [
    [659.25, 659.25, 0.18, 0, 0.11],
    [880, 880, 0.28, 0.12, 0.1],
  ],
  checkpoint: [
    [880, 880, 0.35, 0, 0.12],
    [659.25, 659.25, 0.55, 0.19, 0.13],
  ],
  arrival: [
    [440, 440, 0.28, 0, 0.11],
    [587.33, 587.33, 0.32, 0.13, 0.12],
    [698.46, 698.46, 0.38, 0.27, 0.1],
    [880, 880, 0.65, 0.43, 0.13],
  ],
  miss: [
    // The relay releases first. The bell's metallic overtone dies before its low ring.
    [1180, 370, 0.022, 0, 0.055],
    [293.66, 146.83, 0.415, 0.045, 0.13, "sine"],
    [793, 644, 0.125, 0.045, 0.044, "sine"],
  ],
} satisfies Record<string, Strike[]>;
type Cue = keyof typeof signals | "blast";

// A pickup or arrival takes precedence over the peg click at the same instant.
function actionCue(w: World, input: Input, bonuses: number, direction: number) {
  if (w.status === "won") return "arrival";
  if (w.status === "lost") return "miss";
  if (w.checkpoint && w.pegs[w.checkpoint.peg].activatedAt === w.tick)
    return "checkpoint";
  if (w.glasses.some((g) => g.collectedAt === w.tick)) return "time";
  if (w.bonuses !== bonuses) return "bonus";
  if (w.lastSwitchTick === w.tick) return "switch";
  if (w.lastGrabTick === w.tick) {
    if (w.warps.has(w.hands[0].peg)) return "warp";
    return input.flip || (input.swing && input.bounce) ? "flip" : "swing";
  }
  if (input.reverse) return "reverse";
  if (w.hands[0].direction !== direction) return "bounce";
}

export function tickWithAudio(
  w: World,
  input: Input,
  audio: Pick<StationAudio, "playCue">
) {
  const playing = w.status === "playing",
    bonuses = w.bonuses,
    direction = w.hands[0].direction;
  tick(w, input);
  if (!playing) return;
  const cue = actionCue(w, input, bonuses, direction);
  if (cue) audio.playCue(cue);
  // A loss clears the effects bus, so mix a simultaneous explosion after it.
  if (w.lastBlastTick === w.tick) audio.playCue("blast");
}

function renderBlast(ctx: AudioContext) {
  const rate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.ceil(rate * 0.32), rate);
  const samples = buffer.getChannelData(0);
  let phase = 0;
  let debris = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    const crack = Math.exp(-40 * t);
    phase += (2 * Math.PI * (60 + 125 * crack)) / rate;
    const noise = Math.random() * 2 - 1;
    debris += (noise - debris) * (1 - Math.exp((-2200 - 17000 * crack) / rate));
    samples[i] =
      Math.min(1, t / 0.002) *
      (0.25 * Math.sin(phase) * Math.exp(-22 * t) +
        0.38 * debris * Math.exp(-25 * t));
  }
  return buffer;
}

export class StationAudio {
  private track?: HTMLAudioElement;
  private context?: AudioContext;
  private effectsBus?: GainNode;
  private blast?: AudioBuffer;
  private music = true;
  private effects = true;

  configure(music: boolean, effects: boolean) {
    this.music = music;
    this.effects = effects;
    if (!music) this.track?.pause();
    if (!effects) this.quietEffects();
  }

  // Called directly from a game input or Resume, including touch release.
  start() {
    if (this.music) {
      if (!this.track) {
        this.track = new Audio("/assets/kickturn/last-local-night-service.mp3");
        this.track.loop = true;
      }
      if (this.track.paused) void this.track.play().catch(() => {});
    }
    if (this.effects && typeof AudioContext !== "undefined") {
      try {
        this.context ??= new AudioContext({ latencyHint: "interactive" });
        if (this.context.state !== "running")
          void this.context.resume().catch(() => {});
      } catch {
        // Playback can be unavailable while another app owns the audio device.
      }
    }
  }

  playCue(cue: Cue) {
    if (cue === "arrival" || cue === "miss") this.pause();
    const ctx = this.context;
    if (!this.effects || ctx?.state !== "running") return;
    if (!this.effectsBus) {
      this.effectsBus = ctx.createGain();
      this.effectsBus.connect(ctx.destination);
    }
    if (cue === "blast") {
      const source = ctx.createBufferSource();
      source.buffer = this.blast ??= renderBlast(ctx);
      source.connect(this.effectsBus);
      source.onended = () => source.disconnect();
      source.start();
      return;
    }
    const now = ctx.currentTime;
    for (const [from, to, duration, delay, volume, waveform] of signals[cue]) {
      const source = ctx.createOscillator(),
        envelope = ctx.createGain();
      const start = now + delay,
        end = start + duration;
      source.type = waveform ?? (from === to ? "sine" : "triangle");
      source.frequency.setValueAtTime(from, start);
      source.frequency.exponentialRampToValueAtTime(to, end);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(volume, start + 0.005);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      source.connect(envelope).connect(this.effectsBus);
      source.onended = () => {
        source.disconnect();
        envelope.disconnect();
      };
      source.start(start);
      source.stop(end);
    }
  }

  private quietEffects() {
    this.effectsBus?.disconnect();
    this.effectsBus = undefined;
  }

  pause() {
    this.track?.pause();
    this.quietEffects();
  }

  dispose() {
    this.pause();
    if (this.track) {
      this.track.removeAttribute("src");
      this.track.load();
      this.track = undefined;
    }
    if (this.context) void this.context.close().catch(() => {});
    this.context = undefined;
  }
}
