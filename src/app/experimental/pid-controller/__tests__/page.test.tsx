import { render, screen } from "@testing-library/react";

import PidControllerPage, { metadata } from "../page";

describe("PidControllerPage", () => {
  it("renders the simulator and plant controls with canonical metadata", () => {
    render(<PidControllerPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "PID Controller Simulator",
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Plant")).toHaveValue("plate");
    expect(screen.getByText(/metal plate/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Mandelbrot/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: /Proportional/ })
    ).toBeInTheDocument();
    expect(metadata.alternates?.canonical).toBe(
      "https://alexleung.ca/experimental/pid-controller/"
    );
  });
});
