import { render, screen } from "@testing-library/react";

import { PLANT_PRESETS } from "@/features/pid-simulator/plants";
import { simulate } from "@/features/pid-simulator/simulation";

import { PhysicalPlant } from "../PhysicalPlant";

const spring = PLANT_PRESETS[1];

describe("spring–mass damper drawing", () => {
  it.each([
    ...spring.controllers,
    { name: "Reversed gains", kp: -4, ki: -1, kd: 0 },
  ])("keeps a rigid rod and contained piston for $name", (gains) => {
    const plant = spring.plant;
    const response = simulate({ ...gains, plant });
    const { rerender } = render(
      <PhysicalPlant
        plant={plant}
        response={response}
        sample={response.samples[0]}
      />
    );
    const cylinder = screen.getByTestId("damper-cylinder");
    const cylinderStart = Number(cylinder.getAttribute("x"));
    const cylinderEnd = cylinderStart + Number(cylinder.getAttribute("width"));
    const initialCylinder = cylinder.outerHTML;
    let rodLength: number | undefined;
    const pistonPositions: number[] = [];
    const samples = [
      response.samples[0],
      response.samples.reduce((low, sample) =>
        sample.value < low.value ? sample : low
      ),
      response.samples.reduce((high, sample) =>
        sample.value > high.value ? sample : high
      ),
      ...[147, 286, 440, 560, 2000].map((index) => response.samples[index]),
    ];

    for (const sample of samples) {
      rerender(
        <PhysicalPlant plant={plant} response={response} sample={sample} />
      );
      const piston = Number(
        screen.getByTestId("damper-piston").getAttribute("x1")
      );
      const rod = screen.getByTestId("damper-rod");
      const end = Number(rod.getAttribute("x2"));
      const mass = Number(
        screen
          .getByTestId("plant-mass")
          .getAttribute("transform")!
          .match(/translate\(([^,]+)/)![1]
      );
      const length = end - piston;
      rodLength ??= length;
      pistonPositions.push(piston);

      expect(piston).toBeGreaterThan(cylinderStart);
      expect(piston).toBeLessThan(cylinderEnd);
      expect(Number(rod.getAttribute("x1"))).toBe(piston);
      expect(length).toBeCloseTo(rodLength, 10);
      expect(end).toBe(mass - 28);
      expect(end).toBeGreaterThan(cylinderEnd);
      expect(
        screen
          .getByTestId("plant-spring")
          .getAttribute("points")!
          .split(" ")
          .at(-1)
      ).toBe(`${end},105`);
      expect(cylinder.outerHTML).toBe(initialCylinder);
    }
    expect(
      Math.max(...pistonPositions) - Math.min(...pistonPositions)
    ).toBeGreaterThan(1);
  });
});
