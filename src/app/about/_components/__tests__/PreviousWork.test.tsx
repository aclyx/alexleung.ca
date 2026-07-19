import { render, screen } from "@testing-library/react";

import { PreviousWork } from "../PreviousWork";

describe("PreviousWork", () => {
  it("shows companies, domains, and concrete scope", () => {
    render(<PreviousWork />);

    expect(
      screen.getByRole("heading", { name: "Cash App" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Google" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Jetson" })).toBeInTheDocument();
    expect(screen.getByText("Consumer finance")).toBeInTheDocument();
    expect(screen.getByText("AR/AI glasses")).toBeInTheDocument();
    expect(screen.getByText("Home electrification")).toBeInTheDocument();
  });
});
