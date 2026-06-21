import { fireEvent, render, screen } from "@testing-library/react";

import { EventLoopVisualizer } from "../EventLoopVisualizer";

describe("EventLoopVisualizer", () => {
  it("steps through execution and appends timeline events", () => {
    render(<EventLoopVisualizer />);

    const stepButton = screen.getByRole("button", { name: "Step forward" });
    fireEvent.click(stepButton);

    expect(screen.getAllByText(/console\.log\('A'\)/i).length).toBeGreaterThan(
      0
    );
  });

  it("labels completed stack frames without impossible next-op counts", () => {
    render(<EventLoopVisualizer />);

    const stepButton = screen.getByRole("button", { name: "Step forward" });
    fireEvent.click(stepButton);
    fireEvent.click(stepButton);
    fireEvent.click(stepButton);

    expect(
      screen.getByText(/source: sync.*complete.*done/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/next op 2\/1/i)).not.toBeInTheDocument();
  });

  it("resets the selected example state", () => {
    render(<EventLoopVisualizer />);

    fireEvent.change(screen.getByLabelText("Runnable examples"), {
      target: { value: "timeout-vs-promise" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByText("Tick: 0")).toBeInTheDocument();
  });
});
