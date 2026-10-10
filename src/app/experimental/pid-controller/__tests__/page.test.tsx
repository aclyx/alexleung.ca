import { render, screen } from "@testing-library/react";

import PidControllerNotesPage from "../page";

describe("PidControllerNotesPage", () => {
  it("renders the archived model and source links", () => {
    render(<PidControllerNotesPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "PID Controller Simulator Notes",
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/first-order process/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "controller and simulation modules",
      })
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/src/features/pid-simulator")
    );
    expect(
      screen.getByRole("link", { name: "Mandelbrot explorer" })
    ).toHaveAttribute("href", "/experimental/mandelbrot");
  });
});
