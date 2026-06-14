import { render, screen } from "@testing-library/react";

import NotFound from "../not-found";

describe("NotFound", () => {
  it("keeps the 404 page semantics around the playable game", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "404" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: "Page Not Found" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 3, name: "Route Repair" })
    ).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: "Back home" })[0]
    ).toHaveAttribute("href", "/");
  });
});
