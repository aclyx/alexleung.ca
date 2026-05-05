import { render, screen } from "@testing-library/react";

import NowTimelinePage from "../page";

describe("NowTimelinePage", () => {
  it("renders current and historical Now snapshots", () => {
    render(<NowTimelinePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Now Archive" })
    ).toBeInTheDocument();
    expect(screen.getByText("May 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getAllByText("Top of Mind").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/getting settled into my new role/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/I started playing with OpenClaw/i)
    ).toBeInTheDocument();
  });
});
