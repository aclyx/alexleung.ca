import { PLANT_PRESETS } from "../plants";
import { DEFAULT_CONFIG, simulate } from "../simulation";

const openLoop = { kp: 0, ki: 0, kd: 0 };

describe("plant simulation", () => {
  it("matches the sampled proportional thermal response", () => {
    const result = simulate({ ...DEFAULT_CONFIG, kp: 20, ki: 0, kd: 0 });
    // Exact held-input solution for 20 J/K capacity and 10 W/K heat loss.
    const decay = 3 * Math.exp(-0.005) - 2;
    expect(result.samples[100].value).toBeCloseTo(
      20 + (80 / 3) * (1 - decay ** 100),
      8
    );
    expect(result.finalError).toBeCloseTo(40 / 3, 8);
    expect(result.riseTime).toBeNull();
    expect(result.settlingTime).toBeNull();
  });
  it("matches the damped mass's analytical free response", () => {
    const plant = {
      ...PLANT_PRESETS[1].plant,
      initialValue: 1,
      initialVelocity: 0,
      target: 0,
    };
    const result = simulate({ ...openLoop, plant });
    const frequency = Math.sqrt(1 - 0.3 ** 2);
    for (const time of [1, 5, 20]) {
      const expected =
        Math.exp(-0.3 * time) *
        (Math.cos(frequency * time) +
          (0.3 / frequency) * Math.sin(frequency * time));
      expect(result.samples[time * 100].value).toBeCloseTo(expected, 8);
    }
  });
  it("matches square-root tank drainage before reaching empty", () => {
    const plant = { ...PLANT_PRESETS[2].plant, initialValue: 1, target: 0 };
    const result = simulate({ ...openLoop, plant });
    expect(result.samples[100].value).toBeCloseTo((1 - 0.2) ** 2, 8);
    expect(result.samples[400].value).toBeCloseTo((1 - 0.8) ** 2, 8);
    expect(result.samples.every(({ value }) => value >= 0)).toBe(true);
  });
  it.each(PLANT_PRESETS)(
    "$plant.name presets match their named behavior",
    ({ plant, controllers }) => {
      const runs = controllers.map((gains) => simulate({ ...gains, plant }));
      const step = plant.target - plant.initialValue;
      expect(runs[0].finalError / step).toBeGreaterThan(0.1);
      expect(runs[1].overshoot).toBeLessThan(1);
      expect(runs[1].settlingTime).not.toBeNull();
      expect(runs[2].overshoot).toBeGreaterThan(10);
      const crossings = runs[3].samples
        .slice(1)
        .filter(
          (sample, index) =>
            (sample.value - plant.target) *
              (runs[3].samples[index].value - plant.target) <
            0
        );
      expect(crossings.length).toBeGreaterThan(5);
      for (const run of runs)
        for (const sample of run.samples.slice(1)) {
          expect(sample.control).toBeGreaterThanOrEqual(plant.outputMin);
          expect(sample.control).toBeLessThanOrEqual(plant.outputMax);
        }
    }
  );
  it("saturates even when an integral increment exceeds the actuator range", () => {
    const run = simulate({
      kp: 0,
      ki: 1000,
      kd: 0,
      plant: PLANT_PRESETS[2].plant,
    });
    expect(run.samples[1].control).toBe(1);
    expect(run.samples[1].value).toBeGreaterThan(0);
  });
  it("avoids derivative kick and handles a zero step", () => {
    const run = simulate({
      kp: 0,
      ki: 0,
      kd: 100,
      plant: { ...DEFAULT_CONFIG.plant, target: 20 },
    });
    expect(
      run.samples.every((sample) => sample.value === 20 && sample.control === 0)
    ).toBe(true);
    expect(run.riseTime).toBeNull();
    expect(run.overshoot).toBeNull();
    expect(run.settlingTime).toBeNull();
  });
  it("measures a downward thermal step in the requested direction", () => {
    const down = simulate({
      ...openLoop,
      plant: { ...DEFAULT_CONFIG.plant, initialValue: 60, target: 20 },
    });
    expect(down.riseTime).toBeCloseTo(2 * Math.log(9), 1);
    expect(down.settlingTime).toBeCloseTo(-2 * Math.log(0.02), 1);
    expect(down.overshoot).toBe(0);
  });
  it.each([NaN, Infinity, 1001])("rejects invalid gain %s", (kp) => {
    expect(() => simulate({ ...DEFAULT_CONFIG, kp })).toThrow(/gains/);
  });
  it("is deterministic and retains the full 20-second sample window", () => {
    const result = simulate(DEFAULT_CONFIG);
    expect(result).toEqual(simulate(DEFAULT_CONFIG));
    expect(result.samples).toHaveLength(2001);
    expect(result.samples.at(-1)!.time).toBe(20);
  });
});
