import { fireEvent, render, screen } from "@testing-library/react";

import { trackExperimentInteraction } from "@/lib/analytics";

import { PidSimulator } from "../PidSimulator";

jest.mock("@/lib/analytics", () => ({ trackExperimentInteraction: jest.fn() }));

function editPlant() {
  fireEvent.click(screen.getByText("Edit plant equation & settings"));
}
describe("PidSimulator", () => {
  beforeEach(() => jest.clearAllMocks());
  it("updates gains and retains a snapshot until the plant changes", () => {
    render(<PidSimulator />);
    const initial = screen.getByTestId("pid-response-curve").getAttribute("d");
    fireEvent.click(screen.getByRole("button", { name: "Take snapshot" }));
    fireEvent.click(screen.getByRole("button", { name: "Steady offset" }));
    expect(screen.getByTestId("pid-response-curve").getAttribute("d")).not.toBe(
      initial
    );
    expect(
      screen.getByText("Snapshot: Kp 20, Ki 10, Kd 0.")
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Plant"), {
      target: { value: "spring" },
    });
    expect(screen.queryByText(/Snapshot: Kp/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Spring–mass–damper/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Smooth" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
  it("validates a custom equation without replacing the current curve on syntax errors", () => {
    render(<PidSimulator />);
    editPlant();
    const equation = screen.getByLabelText("dy/dt =");
    fireEvent.change(equation, { target: { value: "window.alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply plant" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("pid-response-curve")).toBeInTheDocument();
    fireEvent.change(equation, { target: { value: "(u - y)/3" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply plant" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Plant")).toHaveValue("custom");
    expect(
      screen.queryByRole("group", { name: "Controller presets" })
    ).not.toBeInTheDocument();
  });
  it("shows a numerical failure instead of a stale curve, then recovers", () => {
    render(<PidSimulator />);
    editPlant();
    fireEvent.change(screen.getByLabelText("dy/dt ="), {
      target: { value: "sqrt(-1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply plant" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/undefined/);
    expect(screen.queryByTestId("pid-response-curve")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Take snapshot" })
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Plant"), {
      target: { value: "tank" },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("pid-response-curve")).toBeInTheDocument();
  });
  it("applies a second-order equation and initial velocity", () => {
    render(<PidSimulator />);
    editPlant();
    fireEvent.change(screen.getByLabelText("Equation order"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("d²y/dt² ="), {
      target: { value: "u - 0.6*v - y" },
    });
    fireEvent.change(screen.getByLabelText("Initial velocity · v(0)"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply plant" }));
    expect(screen.getByText("d²y/dt² = u - 0.6*v - y")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("emits no automatic events and counts each intentional action once per mount", () => {
    render(<PidSimulator />);
    expect(trackExperimentInteraction).not.toHaveBeenCalled();
    for (const value of [3, 4, 5])
      fireEvent.change(screen.getByRole("slider", { name: /Proportional/ }), {
        target: { value: String(value) },
      });
    fireEvent.click(screen.getByRole("button", { name: "Take snapshot" }));
    fireEvent.click(screen.getByRole("button", { name: "Update snapshot" }));
    expect(trackExperimentInteraction).toHaveBeenCalledTimes(2);
    expect(trackExperimentInteraction).toHaveBeenCalledWith(
      "pid-controller",
      "adjust_kp"
    );
    expect(trackExperimentInteraction).toHaveBeenCalledWith(
      "pid-controller",
      "take_snapshot"
    );
  });
});
