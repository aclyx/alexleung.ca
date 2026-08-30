import { render, screen } from "@testing-library/react";

import { LinkText } from "../LinkText";

describe("LinkText", () => {
  it("renders external links with security attributes", () => {
    render(
      <LinkText href="https://example.com" external>
        External
      </LinkText>
    );

    const link = screen.getByText("External");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders internal links", () => {
    render(<LinkText href="/blog">Blog</LinkText>);

    expect(screen.getByText("Blog")).toHaveAttribute("href", "/blog");
  });

  it("uses the shared inline link treatment by default", () => {
    render(<LinkText href="/blog">Blog</LinkText>);

    const link = screen.getByText("Blog");
    expect(link).toHaveClass("text-accent-link");
    expect(link).toHaveClass("underline");
    expect(link).toHaveClass("decoration-accent-link/40");
  });
});
