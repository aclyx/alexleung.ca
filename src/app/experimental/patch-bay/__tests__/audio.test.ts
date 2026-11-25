import { PatchAudio } from "../audio";

const connect = (destination: unknown) => destination;
const parameter = () => ({
  setValueAtTime: jest.fn(),
  linearRampToValueAtTime: jest.fn(),
  exponentialRampToValueAtTime: jest.fn(),
});

class TestContext {
  currentTime = 0;
  state: AudioContextState = "running";
  onstatechange: (() => void) | null = null;
  resume = jest.fn(async () => {});
  close = jest.fn(async () => {});
  decodeAudioData = jest.fn(async () => ({ duration: 60 }));
  createBufferSource = jest.fn(() => ({
    connect,
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  }));
  createGain = () => ({ gain: parameter(), connect, disconnect: jest.fn() });
  createOscillator = jest.fn(() => ({
    frequency: parameter(),
    connect,
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  }));
}

const originalContext = Object.getOwnPropertyDescriptor(
  globalThis,
  "AudioContext"
);
const originalFetch = global.fetch;
let contexts: TestContext[];
let now: number;
let audio: PatchAudio;

beforeEach(() => {
  contexts = [];
  now = 0;
  jest.spyOn(performance, "now").mockImplementation(() => now);
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: jest.fn(() => {
      const ctx = new TestContext();
      contexts.push(ctx);
      return ctx;
    }),
  });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(1),
  });
  audio = new PatchAudio();
  audio.configure(true, true);
});

afterEach(() => {
  audio.dispose();
  if (originalContext)
    Object.defineProperty(globalThis, "AudioContext", originalContext);
  else Reflect.deleteProperty(globalThis, "AudioContext");
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

it("resumes a foreground interruption and starts a loop decoded while interrupted only once", async () => {
  const [ctx] = contexts;
  audio.start();
  ctx.state = "interrupted";
  ctx.onstatechange?.();
  expect(ctx.resume).toHaveBeenCalledTimes(1);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(ctx.createBufferSource).not.toHaveBeenCalled();
  ctx.state = "running";
  ctx.onstatechange?.();
  audio.unlock();
  expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
  audio.tick(0, true, 0);
  expect(ctx.createOscillator).toHaveBeenCalled();

  audio.pause();
  ctx.state = "interrupted";
  ctx.onstatechange?.();
  expect(ctx.resume).toHaveBeenCalledTimes(1);
  ctx.state = "running";
  ctx.onstatechange?.();
  expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
});

it("reuses a healthy device and replaces a frozen running clock on input, preserving the loop position and effects", async () => {
  const [old] = contexts;
  audio.start();
  await new Promise((resolve) => setTimeout(resolve, 0));
  now = 8000;
  old.currentTime = 8;
  audio.unlock();
  expect(contexts).toHaveLength(1);
  now += 2000;
  audio.unlock();
  const fresh = contexts[1];
  expect(old.close).toHaveBeenCalledTimes(1);
  expect(old.onstatechange).toBeNull();
  expect(
    fresh.createBufferSource.mock.results[0].value.start
  ).toHaveBeenCalledWith(0, 8);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  audio.tick(0, true, 0);
  expect(fresh.createOscillator).toHaveBeenCalled();
});

it("allows the first gesture to unlock a prewarmed device after a long wait and respects muted music on recovery", () => {
  const [old] = contexts;
  audio.configure(false, true);
  old.state = "suspended";
  audio.pause();
  now = 10_000;
  audio.start();
  expect(contexts).toHaveLength(1);
  expect(old.resume).toHaveBeenCalledTimes(1);
  now += 2000;
  audio.unlock();
  expect(contexts).toHaveLength(2);
  audio.tick(0, true, 0);
  expect(contexts[1].createOscillator).toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
});
