import { render, screen } from "@testing-library/react";

import { Badge } from "../Badge";

describe("Badge", () => {
  it("uses default info tone", () => {
    render(<Badge>Status</Badge>);

    const badge = screen.getByText("Status");

    expect(badge).toHaveClass("text-accent-info");
    expect(
      badge.className
        .split(/\s+/)
        .filter((className) => className === "inline-flex")
    ).toHaveLength(1);
  });

  it("supports success tone", () => {
    render(<Badge tone="success">Done</Badge>);

    expect(screen.getByText("Done")).toHaveClass("text-accent-success");
  });
});
