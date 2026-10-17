import { act, fireEvent, render, screen } from "@testing-library/react";

import { DEFAULT_CONFIG, simulate } from "@/features/pid-simulator/simulation";
import { trackExperimentInteraction } from "@/lib/analytics";

import { PidSimulator } from "../PidSimulator";

jest.mock("@/lib/analytics", () => ({ trackExperimentInteraction: jest.fn() }));

describe("PidSimulator", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.useRealTimers());
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
    expect(screen.getByTestId("physical-plant")).toHaveAttribute(
      "data-plant",
      "spring"
    );
    expect(screen.getByRole("button", { name: "Smooth" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
  it("offers only the three physical presets, without custom settings", () => {
    render(<PidSimulator />);
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.queryByText(/Edit plant equation/)).not.toBeInTheDocument();
    for (const id of ["spring", "tank", "plate"]) {
      fireEvent.change(screen.getByLabelText("Plant"), {
        target: { value: id },
      });
      expect(screen.getByTestId("physical-plant")).toHaveAttribute(
        "data-plant",
        id
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
  });
  it("scrubs both views to the same sample and resets when tuning changes", () => {
    render(<PidSimulator />);
    fireEvent.change(screen.getByRole("slider", { name: "Time" }), {
      target: { value: "3.42" },
    });
    const sample = simulate(DEFAULT_CONFIG).samples[342];
    expect(screen.getByTestId("response-playhead")).toHaveAttribute(
      "data-time",
      "3.42"
    );
    expect(screen.getByTestId("response-playhead")).toHaveAttribute(
      "data-value",
      String(sample.value)
    );
    expect(screen.getByTestId("plant-output")).toHaveTextContent(
      `${Number(sample.value.toPrecision(3))} °C`
    );
    fireEvent.click(screen.getByRole("button", { name: "Take snapshot" }));
    expect(screen.getByTestId("playback-time")).toHaveTextContent(
      "3.42 / 20 s"
    );
    fireEvent.click(screen.getByRole("button", { name: "Overshoot" }));
    expect(screen.getByTestId("playback-time")).toHaveTextContent(
      "0.00 / 20 s"
    );
  });
  it.each([
    ["spring", "plant-mass", "transform"],
    ["tank", "plant-waterline", "y1"],
    ["plate", "plant-temperature", "opacity"],
  ])("updates the %s drawing when scrubbing", (plant, element, attribute) => {
    render(<PidSimulator />);
    fireEvent.change(screen.getByLabelText("Plant"), {
      target: { value: plant },
    });
    const initial = screen.getByTestId(element).getAttribute(attribute);
    fireEvent.change(screen.getByRole("slider", { name: "Time" }), {
      target: { value: "20" },
    });
    expect(screen.getByTestId(element).getAttribute(attribute)).not.toBe(
      initial
    );
  });
  it("plays on request, pauses, finishes, replays, and cancels on unmount", () => {
    jest.useFakeTimers();
    const { unmount } = render(<PidSimulator />);
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByTestId("playback-time")).toHaveTextContent(
      "0.00 / 20 s"
    );
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => jest.advanceTimersByTime(1000));
    expect(
      Number(screen.getByRole("slider", { name: "Time" }).getAttribute("value"))
    ).toBeGreaterThan(0.8);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    const paused = screen.getByTestId("playback-time").textContent;
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByTestId("playback-time").textContent).toBe(paused);
    fireEvent.change(screen.getByRole("slider", { name: "Time" }), {
      target: { value: "19.9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => jest.advanceTimersByTime(200));
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByTestId("playback-time")).toHaveTextContent(
      "0.00 / 20 s"
    );
    unmount();
    expect(jest.getTimerCount()).toBe(0);
    expect(
      jest
        .mocked(trackExperimentInteraction)
        .mock.calls.filter(([, action]) => action === "play_response")
    ).toHaveLength(1);
  });
  it("counts each intentional action once, never playback frames", () => {
    render(<PidSimulator />);
    expect(trackExperimentInteraction).not.toHaveBeenCalled();
    for (const value of [3, 4, 5]) {
      fireEvent.change(screen.getByRole("slider", { name: /Proportional/ }), {
        target: { value: String(value) },
      });
      fireEvent.change(screen.getByRole("slider", { name: "Time" }), {
        target: { value: String(value) },
      });
    }
    fireEvent.click(screen.getByRole("button", { name: "Take snapshot" }));
    fireEvent.click(screen.getByRole("button", { name: "Update snapshot" }));
    expect(trackExperimentInteraction).toHaveBeenCalledTimes(3);
    for (const action of ["adjust_kp", "scrub_response", "take_snapshot"])
      expect(trackExperimentInteraction).toHaveBeenCalledWith(
        "pid-controller",
        action
      );
  });
});
