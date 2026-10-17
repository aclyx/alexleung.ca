export type PidGains = { kp: number; ki: number; kd: number };
export type Plant = {
  id: "plate" | "spring" | "tank";
  name: string;
  description: string;
  order: 1 | 2;
  equation: string;
  initialValue: number;
  initialVelocity: number;
  target: number;
  outputMin: number;
  outputMax: number;
  unit: string;
  controlUnit: string;
};
type ControllerPreset = PidGains & { name: string };
type PlantPreset = {
  plant: Plant;
  controllers: readonly ControllerPreset[];
  gainMax: number;
  gainStep: number;
};

export const PLANT_PRESETS: readonly PlantPreset[] = [
  {
    plant: {
      id: "plate",
      name: "Heated plate",
      order: 1,
      description:
        "A heater and cooler bring a metal plate from 20°C to 60°C. Heat leaks into the room.",
      equation: "(20 - y + u/10)/2",
      initialValue: 20,
      initialVelocity: 0,
      target: 60,
      outputMin: -800,
      outputMax: 800,
      unit: "°C",
      controlUnit: "W",
    },
    controllers: [
      { name: "Steady offset", kp: 20, ki: 0, kd: 0 },
      { name: "Smooth", kp: 20, ki: 10, kd: 0 },
      { name: "Overshoot", kp: 10, ki: 20, kd: 0 },
      { name: "Oscillation", kp: 0, ki: 40, kd: 0 },
    ],
    gainMax: 80,
    gainStep: 0.5,
  },
  {
    plant: {
      id: "spring",
      name: "Spring–mass–damper",
      order: 2,
      description:
        "Apply force to a 1 kg mass attached to a spring and damper.",
      equation: "u - 0.6*v - y",
      initialValue: 0,
      initialVelocity: 0,
      target: 1,
      outputMin: -10,
      outputMax: 10,
      unit: "m",
      controlUnit: "N",
    },
    controllers: [
      { name: "Steady offset", kp: 4, ki: 0, kd: 4 },
      { name: "Smooth", kp: 4, ki: 1, kd: 4 },
      { name: "Overshoot", kp: 4, ki: 1, kd: 1 },
      { name: "Oscillation", kp: 4, ki: 1, kd: 0 },
    ],
    gainMax: 10,
    gainStep: 0.05,
  },
  {
    plant: {
      id: "tank",
      name: "Draining tank",
      order: 1,
      description:
        "Fill a 1 m² tank with a pump. Water drains faster as the level rises; the pump cannot pull water out.",
      equation: "u - 0.4*sqrt(max(y, 0))",
      initialValue: 0,
      initialVelocity: 0,
      target: 1,
      outputMin: 0,
      outputMax: 1,
      unit: "m",
      controlUnit: "m³/s",
    },
    controllers: [
      { name: "Steady offset", kp: 0.8, ki: 0, kd: 0 },
      { name: "Smooth", kp: 1, ki: 0.2, kd: 0 },
      { name: "Overshoot", kp: 0.2, ki: 0.4, kd: 0 },
      { name: "Oscillation", kp: 0, ki: 2, kd: 0 },
    ],
    gainMax: 4,
    gainStep: 0.05,
  },
];
