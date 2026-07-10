import { render, screen } from "@testing-library/react";

import LoadFlowPage from "../page";

describe("LoadFlowPage", () => {
  it("renders the load-flow workspace shell", () => {
    render(<LoadFlowPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "AC Load Flow Solver" })
    ).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(
      screen.getByText(/newton-raphson ac load flow engine/i)
    ).toBeInTheDocument();
  });
});
