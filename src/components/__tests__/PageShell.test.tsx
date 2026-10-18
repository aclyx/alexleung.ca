import { render, screen } from "@testing-library/react";

import { PageShell } from "../PageShell";

describe("PageShell", () => {
  it("composes page header content", () => {
    const { container } = render(
      <PageShell
        title="Page title"
        eyebrow="Eyebrow"
        description="Description"
        metadata="Metadata"
        headerRail="prose"
      >
        <p>Page content</p>
      </PageShell>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Page title"
    );
    expect(container.querySelector("header")).toHaveClass("max-w-3xl");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
