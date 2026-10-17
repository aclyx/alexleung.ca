import { render, screen } from "@testing-library/react";

import { DEFAULT_CONFIG, simulate } from "@/features/pid-simulator/simulation";

import { ResponseChart } from "../ResponseChart";

describe("ResponseChart", () => {
  it.each([0, Number.MIN_VALUE, -10])(
    "keeps chart coordinates finite for target %s",
    (target) => {
      const plant = {
        ...DEFAULT_CONFIG.plant,
        initialValue: target,
        target,
      };
      const response = {
        ...simulate(DEFAULT_CONFIG),
        samples: [0, 20].map((time) => ({ time, value: target, control: 0 })),
      };
      const { container } = render(
        <ResponseChart
          response={response}
          saved={null}
          plant={plant}
          sample={response.samples[0]}
        />
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
  it("plots every sample, including fast changes between former plot points", () => {
    const response = simulate(DEFAULT_CONFIG);
    response.samples[1].value = 70;
    render(
      <ResponseChart
        response={response}
        saved={null}
        plant={DEFAULT_CONFIG.plant}
        sample={response.samples[1]}
      />
    );
    const path = screen.getByTestId("pid-response-curve").getAttribute("d")!;
    expect(path.split(" ")).toHaveLength(response.samples.length);
    const cursor = screen.getByTestId("response-playhead");
    expect(path.split(" ")[1]).toBe(
      `L${Number(cursor.getAttribute("cx")).toFixed(2)},${Number(cursor.getAttribute("cy")).toFixed(2)}`
    );
  });
});
