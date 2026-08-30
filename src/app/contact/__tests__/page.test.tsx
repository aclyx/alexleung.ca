import { render, screen } from "@testing-library/react";

import ContactPage from "../page";

describe("ContactPage", () => {
  it("uses a logical heading hierarchy for the subscription section", () => {
    render(<ContactPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Contact" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Subscribe" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Get new posts by email",
      })
    ).toBeInTheDocument();
  });
});
