import { Plant, PLANT_PRESETS } from "../plants";
import { DEFAULT_CONFIG, simulate, validatePlant } from "../simulation";

const custom = (changes: Partial<Plant>): Plant => ({
  ...DEFAULT_CONFIG.plant,
  id: "custom",
  equation: "-y + u",
  initialValue: 0,
  target: 1,
  outputMin: -100,
  outputMax: 100,
  ...changes,
});
const openLoop = { kp: 0, ki: 0, kd: 0 };

describe("plant simulation", () => {
  it("matches the proportional first-order analytical response", () => {
    const result = simulate({ kp: 2, ki: 0, kd: 0, plant: custom({}) });
    // The controller is held constant for each 0.01 s plant integration.
    const decay = 3 * Math.exp(-0.01) - 2;
    expect(result.samples[100].value).toBeCloseTo(
      (2 / 3) * (1 - decay ** 100),
      8
    );
    expect(result.finalError).toBeCloseTo(1 / 3, 8);
    expect(result.riseTime).toBeNull();
    expect(result.settlingTime).toBeNull();
  });
  it("integrates position and velocity for a second-order plant", () => {
    const result = simulate({
      ...openLoop,
      plant: custom({
        order: 2,
        equation: "-y",
        initialValue: 1,
        initialVelocity: 0,
        target: 0,
      }),
    });
    expect(result.samples[100].value).toBeCloseTo(Math.cos(1), 8);
    expect(result.samples[2000].value).toBeCloseTo(Math.cos(20), 7);
    const moving = simulate({
      ...openLoop,
      plant: custom({ order: 2, equation: "0", initialVelocity: 2 }),
    });
    expect(moving.samples[100].value).toBeCloseTo(2, 10);
  });
  it("supports time-dependent nonlinear equations", () => {
    const result = simulate({
      ...openLoop,
      plant: custom({ equation: "cos(t)" }),
    });
    expect(result.samples[100].value).toBeCloseTo(Math.sin(1), 9);
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
      plant: custom({ equation: "u", target: 100, outputMin: 0, outputMax: 1 }),
    });
    expect(run.samples[1].control).toBe(1);
    expect(run.samples.at(-1)!.value).toBeCloseTo(20);
  });
  it("avoids derivative kick and treats a zero step as undefined step metrics", () => {
    const run = simulate({
      kp: 0,
      ki: 0,
      kd: 100,
      plant: custom({ equation: "u", initialValue: 3, target: 3 }),
    });
    expect(
      run.samples.every((sample) => sample.value === 3 && sample.control === 0)
    ).toBe(true);
    expect(run.riseTime).toBeNull();
    expect(run.overshoot).toBeNull();
    expect(run.settlingTime).toBeNull();
  });
  it("measures downward steps in the requested direction", () => {
    const down = simulate({
      ...openLoop,
      plant: custom({ equation: "-y", initialValue: 1, target: 0 }),
    });
    expect(down.riseTime).toBeCloseTo(Math.log(9), 1);
    expect(down.settlingTime).toBeCloseTo(-Math.log(0.02), 1);
    expect(down.overshoot).toBe(0);
  });
  it("rejects invalid settings and unusable numerical responses", () => {
    for (const changes of [
      { equation: "sqrt(-1)" },
      { equation: "1/0" },
      { equation: "1000*y + 1" },
      { target: NaN },
      { outputMin: 100, outputMax: 1 },
    ]) {
      expect(() => simulate({ ...openLoop, plant: custom(changes) })).toThrow();
    }
    expect(() => validatePlant(custom({ equation: "v + u" }))).toThrow(
      /second-order/
    );
    expect(() => simulate({ ...DEFAULT_CONFIG, kp: Infinity })).toThrow(
      /gains/
    );
  });
  it("is deterministic and retains the full 20-second sample window", () => {
    const result = simulate(DEFAULT_CONFIG);
    expect(result).toEqual(simulate(DEFAULT_CONFIG));
    expect(result.samples).toHaveLength(2001);
    expect(result.samples.at(-1)!.time).toBe(20);
  });
});
