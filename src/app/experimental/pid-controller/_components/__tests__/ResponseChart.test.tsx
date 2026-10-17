import { render, screen } from "@testing-library/react";

import { DEFAULT_CONFIG, simulate } from "@/features/pid-simulator/simulation";

import { ResponseChart } from "../ResponseChart";

describe("ResponseChart", () => {
  it.each([0, Number.MIN_VALUE, -10])(
    "keeps chart coordinates finite for target %s",
    (target) => {
      const plant = {
        ...DEFAULT_CONFIG.plant,
        initialValue: 0,
        target,
        equation: "0",
      };
      const response = simulate({ kp: 0, ki: 0, kd: 0, plant });
      const { container } = render(
        <ResponseChart response={response} saved={null} plant={plant} />
      );
      expect(
        screen.getByTestId("pid-response-curve").getAttribute("d")
      ).not.toMatch(/NaN|Infinity/);
      expect(container.querySelectorAll("line").length).toBeGreaterThan(1);
      for (const line of container.querySelectorAll("line")) {
        expect(Number.isFinite(Number(line.getAttribute("y1")))).toBe(true);
      }
    }
  );
});
