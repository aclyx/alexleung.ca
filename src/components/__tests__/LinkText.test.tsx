import { render, screen } from "@testing-library/react";

import { LinkText } from "../LinkText";

describe("LinkText", () => {
  it("preserves full-size standalone links by default", () => {
    render(
      <LinkText href="/blog/" standalone>
        Writing
      </LinkText>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("min-h-11", "min-w-11");
    expect(link).not.toHaveClass("md:[@media(pointer:fine)]:min-h-8");
  });

  it("compacts only opted-in links on desktop with a fine pointer", () => {
    render(
      <LinkText href="/blog/" standalone="compact">
        Writing
      </LinkText>
    );
    expect(screen.getByRole("link")).toHaveClass(
      "min-h-11",
      "md:[@media(pointer:fine)]:min-h-8",
      "focus-visible:ring-2"
    );
  });

  it("pads inline targets without switching them to block layout", () => {
    render(
      <LinkText href="/now/" standalone="inline">
        Now →
      </LinkText>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("py-3.5", "px-1.5", "-mx-1.5");
    expect(link).not.toHaveClass("inline-flex", "min-h-11");
  });

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
