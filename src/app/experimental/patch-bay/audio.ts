// Tone envelopes are short enough to leave the next Windows movement beat audible.
type Tone = readonly [
  fromHz: number,
  toHz: number,
  seconds: number,
  volume: number,
  delay?: number,
  wave?: OscillatorType,
];
const cues = {
  step: [[105, 68, 0.032, 0.045, 0, "triangle"]],
  bump: [[115, 49, 0.065, 0.1, 0, "triangle"]],
  chip: [
    [880, 880, 0.085, 0.13],
    [1320, 1320, 0.14, 0.09, 0.048],
  ],
  item: [
    [523, 784, 0.1, 0.13],
    [988, 988, 0.12, 0.085, 0.055],
  ],
  door: [
    [145, 90, 0.075, 0.15, 0, "triangle"],
    [495, 705, 0.09, 0.08, 0.047],
  ],
  cradle: [
    [190, 105, 0.08, 0.17, 0, "triangle"],
    [440, 660, 0.12, 0.11, 0.045],
    [880, 880, 0.13, 0.085, 0.12],
  ],
  relay: [
    [1000, 270, 0.025, 0.095],
    [185, 118, 0.052, 0.1, 0.014, "triangle"],
  ],
  toggle: [
    [235, 145, 0.075, 0.12, 0, "triangle"],
    [630, 905, 0.085, 0.095, 0.04],
  ],
  control: [[620, 450, 0.045, 0.08, 0, "triangle"]],
  block: [[150, 62, 0.12, 0.1, 0, "sawtooth"]],
  wall: [[205, 89, 0.085, 0.13, 0, "triangle"]],
  clearedTile: [[395, 185, 0.075, 0.085, 0, "triangle"]],
  trap: [
    [820, 230, 0.055, 0.09],
    [170, 120, 0.085, 0.085, 0.025, "triangle"],
  ],
  hint: [
    [590, 590, 0.08, 0.085],
    [745, 745, 0.1, 0.075, 0.06],
  ],
  skate: [[950, 650, 0.09, 0.045]],
  force: [[215, 360, 0.1, 0.06, 0, "triangle"]],
  fire: [[155, 72, 0.085, 0.08, 0, "sawtooth"]],
  stolen: [
    [720, 310, 0.18, 0.12],
    [290, 120, 0.21, 0.09, 0.09],
  ],
  warp: [
    [260, 1150, 0.16, 0.12],
    [1450, 510, 0.15, 0.075, 0.065],
  ],
  blast: [
    [110, 32, 0.32, 0.25, 0, "sawtooth"],
    [330, 46, 0.105, 0.1, 0, "triangle"],
  ],
  splash: [
    [510, 125, 0.11, 0.1],
    [340, 96, 0.13, 0.09, 0.043],
    [650, 260, 0.055, 0.055, 0.082],
  ],
  low: [[740, 740, 0.065, 0.085]],
  loss: [
    [370, 293, 0.16, 0.13],
    [247, 196, 0.18, 0.12, 0.14],
    [147, 92, 0.31, 0.14, 0.29, "triangle"],
  ],
  clear: [
    [523, 523, 0.13, 0.12],
    [659, 659, 0.15, 0.12, 0.085],
    [784, 784, 0.18, 0.12, 0.17],
    [1046, 1046, 0.34, 0.1, 0.275],
  ],
} satisfies Record<string, Tone[]>;

// Bit positions follow Tile World's defs.h and the two additional MS audio events.
// Independent bits can arrive together, e.g. a block and the button underneath it.
const soundEvents: readonly [number, keyof typeof cues][] = [
  [2, "low"],
  [3, "low"],
  [5, "bump"],
  [6, "chip"],
  [7, "item"],
  [8, "stolen"],
  [9, "warp"],
  [10, "door"],
  [11, "cradle"],
  [12, "relay"],
  [13, "clearedTile"],
  [14, "wall"],
  [15, "trap"],
  [16, "blast"],
  [17, "splash"],
  [18, "block"],
  [19, "skate"],
  [21, "force"],
  [25, "fire"],
  [26, "toggle"],
  [27, "hint"],
];

export class PatchAudio {
  music = true;
  effects = true;
  private active = false;
  private ctx?: AudioContext;
  private bus?: GainNode;
  private loop?: AudioBuffer;
  private loading?: Promise<void>;
  private track?: AudioBufferSourceNode;
  private offset = 0;
  private trackStart = 0;
  private lastPlayed = new Map<keyof typeof cues, number>();
  private disposed = false;

  configure(music: boolean, effects: boolean) {
    this.music = music;
    this.effects = effects;
    if (!music) this.stopTrack();
    if (!effects) this.quietEffects();
    // Opening the audio device can block the first keydown for hundreds of
    // milliseconds. Prepare it at setup; playback still begins on a gesture.
    if (
      (music || effects) &&
      !this.ctx &&
      typeof AudioContext !== "undefined"
    ) {
      try {
        this.context();
      } catch {
        // Browsers that require a gesture for construction retry in unlock().
      }
    }
    if (this.active) this.unlock();
  }

  private context() {
    return (this.ctx ??= new AudioContext({ latencyHint: "interactive" }));
  }
  // Menu controls also work before the first move and while the clock is paused.
  control() {
    if (this.disposed || !this.effects || typeof AudioContext === "undefined")
      return;
    try {
      const ctx = this.context();
      if (ctx.state === "running") this.play("control");
      else
        void ctx
          .resume()
          .then(() => this.play("control"))
          .catch(() => {});
    } catch {
      /* Keep controls usable when the audio device is unavailable. */
    }
  }

  // Also retry from pointerup: some touch browsers grant audio on release.
  unlock() {
    if (
      this.disposed ||
      !this.active ||
      (!this.music && !this.effects) ||
      typeof AudioContext === "undefined"
    )
      return;
    try {
      const ctx = this.context();
      if (ctx.state !== "running")
        void ctx
          .resume()
          .then(() => this.playTrack())
          .catch(() => {});
      if (this.music && !this.loop && !this.loading) {
        this.loading = fetch("/assets/patch-bay/relay-logic.flac")
          .then((response) => {
            if (!response.ok) throw Error("Music unavailable");
            return response.arrayBuffer();
          })
          .then((bytes) => ctx.decodeAudioData(bytes))
          .then((buffer) => {
            if (!this.disposed) {
              this.loop = buffer;
              this.playTrack();
            }
          })
          .catch(() => {})
          .finally(() => {
            this.loading = undefined;
          });
      }
      this.playTrack();
    } catch {
      /* The game clock also runs when the audio device is unavailable. */
    }
  }
  start() {
    this.active = true;
    this.unlock();
  }
  private playTrack() {
    const ctx = this.ctx;
    if (
      !ctx ||
      ctx.state !== "running" ||
      !this.active ||
      !this.music ||
      !this.loop ||
      this.track ||
      this.disposed
    )
      return;
    const track = ctx.createBufferSource(),
      mix = ctx.createGain();
    mix.gain.value = 0.25;
    track.buffer = this.loop;
    track.loop = true;
    track.connect(mix).connect(ctx.destination);
    track.onended = () => {
      track.disconnect();
      mix.disconnect();
    };
    this.trackStart = ctx.currentTime;
    this.track = track;
    track.start(0, this.offset);
  }
  private stopTrack() {
    if (!this.track || !this.ctx || !this.loop) return;
    this.offset =
      (this.offset + this.ctx.currentTime - this.trackStart) %
      this.loop.duration;
    this.track.stop();
    this.track = undefined;
  }
  private quietEffects() {
    this.bus?.disconnect();
    this.bus = undefined;
    this.lastPlayed.clear();
  }
  pause() {
    this.active = false;
    this.stopTrack();
    this.quietEffects();
  }

  private play(cue: keyof typeof cues) {
    const ctx = this.ctx;
    if (!this.effects || !ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    if (t - (this.lastPlayed.get(cue) ?? -Infinity) < 0.035) return;
    this.lastPlayed.set(cue, t);
    if (!this.bus) {
      this.bus = ctx.createGain();
      this.bus.connect(ctx.destination);
    }
    const tones: readonly Tone[] = cues[cue];
    for (const [
      from,
      to,
      duration,
      volume,
      delay = 0,
      wave = "sine",
    ] of tones) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        when = t + delay;
      osc.type = wave;
      osc.frequency.setValueAtTime(from, when);
      osc.frequency.exponentialRampToValueAtTime(to, when + duration);
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(volume, when + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      osc.connect(gain).connect(this.bus);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
      osc.start(when);
      osc.stop(when + duration);
    }
  }
  tick(mask: number, moved: boolean, outcome: number) {
    if (outcome) {
      this.active = false;
      this.stopTrack();
    }
    if (!this.effects) return;
    if (mask)
      for (const [bit, cue] of soundEvents)
        if (mask & (1 << bit)) this.play(cue);
    if (outcome) this.play(outcome > 0 ? "clear" : "loss");
    else if (moved && (mask & ~((1 << 3) | (1 << 2))) === 0) this.play("step");
  }
  dispose() {
    this.disposed = true;
    this.pause();
    void this.ctx?.close().catch(() => {});
  }
}
