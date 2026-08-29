import { act, fireEvent, render, screen } from "@testing-library/react";

import { trackExperimentInteraction } from "@/lib/analytics";

import { PidSimulatorWorkspace } from "../PidSimulatorWorkspace";

jest.mock("@/lib/analytics", () => ({
  trackExperimentInteraction: jest.fn(),
}));

const mockedTrackExperimentInteraction = jest.mocked(
  trackExperimentInteraction
);

describe("PidSimulatorWorkspace", () => {
  beforeEach(() => {
    mockedTrackExperimentInteraction.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders controls and chart", () => {
    render(<PidSimulatorWorkspace />);

    expect(
      screen.getByRole("img", { name: /pid simulator response chart/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/preset response/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Kp$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max time \(s\)/i)).toHaveValue("20");
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("toggles run state and resets simulation", () => {
    render(<PidSimulatorWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset simulation/i }));
    expect(screen.getByText(/steady-state error/i)).toBeInTheDocument();
  });

  it("applies selected preset values", () => {
    render(<PidSimulatorWorkspace />);

    fireEvent.change(screen.getByLabelText(/preset response/i), {
      target: { value: "oscillatory" },
    });

    expect(screen.getByLabelText("Ki")).toHaveValue("1");
    expect(screen.getByLabelText("Kd")).toHaveValue("2");
  });

  it("keeps the selected preset label when tuning gains", () => {
    render(<PidSimulatorWorkspace />);

    fireEvent.change(screen.getByLabelText(/preset response/i), {
      target: { value: "oscillatory" },
    });
    fireEvent.change(screen.getByLabelText(/^Kp$/i), {
      target: { value: "0.8" },
    });

    expect(screen.getByLabelText(/preset response/i)).toHaveValue(
      "oscillatory"
    );
  });

  it("restarts the run when tuning changes", () => {
    render(<PidSimulatorWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Kp$/i), {
      target: { value: "2.8" },
    });

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(
      screen.getByText(/full step response stays in view/i)
    ).toBeInTheDocument();
  });

  it("tracks one settled gain commit after continuous tuning", () => {
    jest.useFakeTimers();
    render(<PidSimulatorWorkspace />);

    const proportionalGain = screen.getByLabelText(/^Kp$/i);
    fireEvent.change(proportionalGain, { target: { value: "2.8" } });
    fireEvent.change(proportionalGain, { target: { value: "3.1" } });

    expect(proportionalGain).toHaveValue("3.1");
    expect(mockedTrackExperimentInteraction).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockedTrackExperimentInteraction).toHaveBeenCalledTimes(1);
    expect(mockedTrackExperimentInteraction).toHaveBeenCalledWith(
      "pid_controller_simulator",
      "commit_gain",
      { gain: "kp", value: 3.1 }
    );
  });
});
