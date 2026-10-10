import { render, screen } from "@testing-library/react";

import ContactPage from "../page";

describe("ContactPage", () => {
  it("uses one page heading and one subscription heading", () => {
    render(<ContactPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Contact" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Get new posts by email",
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading")).toHaveLength(2);
  });
});
