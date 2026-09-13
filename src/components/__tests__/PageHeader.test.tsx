import { render, screen } from "@testing-library/react";

import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("renders the optional semantic header slots", () => {
    render(
      <PageHeader
        title="Writing"
        titleId="writing"
        eyebrow="Notes and essays"
        description="Software, books, and life outside work."
        metadata={<time dateTime="2026-08-29">August 29, 2026</time>}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
      "id",
      "writing"
    );
    expect(screen.getByText("Notes and essays")).toBeInTheDocument();
    expect(
      screen.getByText("Software, books, and life outside work.")
    ).toBeInTheDocument();
    expect(screen.getByText("August 29, 2026")).toBeInTheDocument();
  });

  it("supports the prose rail", () => {
    const { container } = render(<PageHeader title="Post" rail="prose" />);

    expect(container.querySelector("header")).toHaveClass("max-w-3xl");
  });
});
