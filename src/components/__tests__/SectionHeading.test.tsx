import { render, screen } from "@testing-library/react";

import { SectionHeading } from "../SectionHeading";

describe("SectionHeading", () => {
  it("renders the shared eyebrow and section-title hierarchy", () => {
    render(
      <SectionHeading
        eyebrow="Work and study"
        title="Experience"
        titleId="experience-title"
      />
    );

    expect(screen.getByText("Work and study")).toHaveClass("text-eyebrow");
    expect(
      screen.getByRole("heading", { level: 2, name: "Experience" })
    ).toHaveAttribute("id", "experience-title");
  });
});
