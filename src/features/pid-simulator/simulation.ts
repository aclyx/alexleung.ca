import { PidGains, Plant, PLANT_PRESETS } from "./plants";

export type SimulationConfig = PidGains & { plant: Plant };
export const DEFAULT_CONFIG: SimulationConfig = {
  ...PLANT_PRESETS[0].controllers[1],
  plant: PLANT_PRESETS[0].plant,
};
export const DURATION = 20;
const DT = 0.01;
const DERIVATIVE_FILTER = 0.1;
export type ResponseSample = { time: number; value: number; control: number };

function plantRate(plant: Plant, y: number, v: number, u: number) {
  switch (plant.id) {
    case "plate":
      return (20 - y + u / 10) / 2;
    case "spring":
      return u - 0.6 * v - y;
    case "tank":
      return u - 0.4 * Math.sqrt(Math.max(y, 0));
  }
}

export function simulate({ kp, ki, kd, plant }: SimulationConfig) {
  if (
    ![kp, ki, kd].every(
      (gain) => Number.isFinite(gain) && Math.abs(gain) <= 1000
    )
  )
    throw new Error(
      "Controller gains must be finite numbers between −1000 and 1000."
    );
  let value = plant.initialValue;
  let velocity = plant.order === 2 ? plant.initialVelocity : 0;
  let previousValue = value;
  let integral = 0;
  let derivative = 0;
  let peakProgress = 0;
  let tenPercent: number | null = null;
  let ninetyPercent: number | null = null;
  let lastOutsideBand = 0;
  const targetStep = plant.target - plant.initialValue;
  const samples: ResponseSample[] = [];

  for (let step = 0; step <= DURATION / DT; step += 1) {
    const error = plant.target - value;
    derivative +=
      (DT / (DERIVATIVE_FILTER + DT)) *
      ((value - previousValue) / DT - derivative);
    previousValue = value;
    const candidateIntegral = integral + ki * error * DT;
    const candidateOutput = kp * error + candidateIntegral - kd * derivative;
    // Reject integration that drives further into an actuator limit.
    const integralChange = candidateIntegral - integral;
    if (
      (candidateOutput >= plant.outputMin &&
        candidateOutput <= plant.outputMax) ||
      (candidateOutput > plant.outputMax && integralChange < 0) ||
      (candidateOutput < plant.outputMin && integralChange > 0)
    )
      integral = candidateIntegral;
    const control = Math.max(
      plant.outputMin,
      Math.min(plant.outputMax, candidateOutput)
    );
    // Record the command applied at this instant, not the previous interval's.
    samples.push({ time: step * DT, value, control });
    if (step === DURATION / DT) break;

    // RK4 advances the plant while controller output is held for this 10 ms step.
    const rate = (y: number, v: number) => {
      const result = plantRate(plant, y, v, control);
      return plant.order === 1 ? { y: result, v: 0 } : { y: v, v: result };
    };
    const a = rate(value, velocity);
    const b = rate(value + (a.y * DT) / 2, velocity + (a.v * DT) / 2);
    const c = rate(value + (b.y * DT) / 2, velocity + (b.v * DT) / 2);
    const d = rate(value + c.y * DT, velocity + c.v * DT);
    value += (DT * (a.y + 2 * b.y + 2 * c.y + d.y)) / 6;
    // Stop at the tank floor if a numerical step crosses the empty boundary.
    if (plant.id === "tank") value = Math.max(0, value);
    velocity += (DT * (a.v + 2 * b.v + 2 * c.v + d.v)) / 6;
    const nextTime = (step + 1) * DT;
    if (
      ![value, velocity].every(
        (state) => Number.isFinite(state) && Math.abs(state) <= 1e6
      )
    ) {
      throw new Error(
        `The response diverged at ${nextTime.toFixed(2)} s. Reduce the gains or choose a controller preset.`
      );
    }
    const progress =
      targetStep === 0 ? 0 : (value - plant.initialValue) / targetStep;
    peakProgress = Math.max(peakProgress, progress);
    if (tenPercent === null && progress >= 0.1) tenPercent = nextTime;
    if (ninetyPercent === null && progress >= 0.9) ninetyPercent = nextTime;
    if (Math.abs(plant.target - value) > Math.abs(targetStep) * 0.02)
      lastOutsideBand = nextTime;
  }
  return {
    samples,
    riseTime:
      tenPercent !== null && ninetyPercent !== null
        ? ninetyPercent - tenPercent
        : null,
    settlingTime:
      targetStep !== 0 && lastOutsideBand + DT <= DURATION - 1
        ? lastOutsideBand + DT
        : null,
    overshoot: targetStep === 0 ? null : Math.max(0, (peakProgress - 1) * 100),
    finalError: plant.target - value,
  };
}

export type SimulationResult = ReturnType<typeof simulate>;
