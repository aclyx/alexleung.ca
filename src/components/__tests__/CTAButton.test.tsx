import { render, screen } from "@testing-library/react";

import { CTAButton } from "../CTAButton";

describe("CTAButton", () => {
  it("renders as internal link by default", () => {
    render(<CTAButton href="/projects">View Projects</CTAButton>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects");
    expect(link).not.toHaveAttribute("target");
  });

  it("renders as external link when external prop is true", () => {
    render(
      <CTAButton href="https://example.com" external>
        External
      </CTAButton>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies primary variant styles by default", () => {
    render(<CTAButton href="/test">Test</CTAButton>);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("bg-accent-primary");
  });

  it("applies secondary variant styles when specified", () => {
    render(
      <CTAButton href="/test" variant="secondary">
        Test
      </CTAButton>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("border");
  });

  it("renders children content", () => {
    render(<CTAButton href="/test">Click Me</CTAButton>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <CTAButton href="/test" className="custom-class">
        Test
      </CTAButton>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("custom-class");
  });
});
