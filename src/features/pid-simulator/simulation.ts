import { compileEquation } from "./expression";
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

export function validatePlant(plant: Plant) {
  for (const value of [
    plant.initialValue,
    plant.initialVelocity,
    plant.target,
    plant.outputMin,
    plant.outputMax,
  ]) {
    if (!Number.isFinite(value) || Math.abs(value) > 10000)
      throw new Error(
        "Initial conditions, target, and limits must be finite numbers between −10000 and 10000."
      );
  }
  if (plant.outputMin >= plant.outputMax)
    throw new Error(
      "The lower actuator limit must be less than the upper limit."
    );
  if (plant.order !== 1 && plant.order !== 2)
    throw new Error("Choose a first- or second-order plant.");
  if (plant.order === 1 && /\bv\b/.test(plant.equation))
    throw new Error(
      "Velocity v is only available in second-order plants. Use y for a first-order state."
    );
  return compileEquation(plant.equation);
}

export function simulate({ kp, ki, kd, plant }: SimulationConfig) {
  const equation = validatePlant(plant);
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
  const samples: ResponseSample[] = [{ time: 0, value, control: 0 }];

  for (let step = 1; step <= DURATION / DT; step += 1) {
    const time = (step - 1) * DT;
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

    // RK4 advances the plant while controller output is held for this 10 ms step.
    const rate = (y: number, v: number, t: number) => {
      const result = equation({ y, v, u: control, t });
      return plant.order === 1 ? { y: result, v: 0 } : { y: v, v: result };
    };
    const a = rate(value, velocity, time);
    const b = rate(
      value + (a.y * DT) / 2,
      velocity + (a.v * DT) / 2,
      time + DT / 2
    );
    const c = rate(
      value + (b.y * DT) / 2,
      velocity + (b.v * DT) / 2,
      time + DT / 2
    );
    const d = rate(value + c.y * DT, velocity + c.v * DT, time + DT);
    value += (DT * (a.y + 2 * b.y + 2 * c.y + d.y)) / 6;
    velocity += (DT * (a.v + 2 * b.v + 2 * c.v + d.v)) / 6;
    const nextTime = step * DT;
    if (
      ![value, velocity].every(
        (state) => Number.isFinite(state) && Math.abs(state) <= 1e6
      )
    ) {
      throw new Error(
        `The response diverged or became undefined at ${nextTime.toFixed(2)} s. Check the equation or reduce the gains; this fixed-step solver is not suitable for every system.`
      );
    }
    const progress =
      targetStep === 0 ? 0 : (value - plant.initialValue) / targetStep;
    peakProgress = Math.max(peakProgress, progress);
    if (tenPercent === null && progress >= 0.1) tenPercent = nextTime;
    if (ninetyPercent === null && progress >= 0.9) ninetyPercent = nextTime;
    if (Math.abs(plant.target - value) > Math.abs(targetStep) * 0.02)
      lastOutsideBand = nextTime;
    samples.push({ time: nextTime, value, control });
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
