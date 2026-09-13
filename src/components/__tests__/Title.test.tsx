import { render, screen } from "@testing-library/react";

import { Title } from "../Title";

describe("Title", () => {
  it("should render as h1 with title text", () => {
    render(<Title title="Test Title" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Test Title");
  });

  it("should support id for anchor linking", () => {
    render(<Title title="Section Title" id="section-anchor" />);

    const heading = screen.getByText("Section Title");
    expect(heading).toHaveAttribute("id", "section-anchor");
  });

  it("renders only the heading primitive and accepts caller classes", () => {
    const { container } = render(
      <Title title="Pure heading" className="max-w-2xl" />
    );

    expect(container.firstElementChild?.tagName).toBe("H1");
    expect(screen.getByRole("heading")).toHaveClass("max-w-2xl");
  });
});
