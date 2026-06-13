import { render, screen } from "@testing-library/react";

import { BlogPostCard } from "../BlogPostCard";

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("BlogPostCard", () => {
  it("renders title, excerpt, and link", () => {
    render(
      <BlogPostCard
        post={{
          slug: "test-post",
          title: "Test Post",
          date: "2026-01-01T00:00:00.000Z",
          coverImage: undefined,
          coverAlt: undefined,
          excerpt: "A short summary",
          tags: ["ai"],
        }}
      />
    );

    expect(screen.getByRole("link", { name: "Test Post" })).toHaveAttribute(
      "href",
      "/blog/test-post/"
    );
    expect(screen.getByText("A short summary")).toBeInTheDocument();
    expect(screen.getByText("January 1, 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ai" })).toHaveAttribute(
      "href",
      "/blog/tags/ai/"
    );
  });

  it("formats inline code spans in excerpt text", () => {
    render(
      <BlogPostCard
        post={{
          slug: "inline-code-post",
          title: "Inline Code Post",
          date: "2026-01-01T00:00:00.000Z",
          coverImage: undefined,
          coverAlt: undefined,
          excerpt: "Use `srcSet` variants to improve performance.",
          tags: [],
        }}
      />
    );

    expect(
      screen.getByText("srcSet", { selector: "code" })
    ).toBeInTheDocument();
  });

  it("uses post cover alt text when rendering the cover image", () => {
    render(
      <BlogPostCard
        post={{
          slug: "cover-post",
          title: "Cover Post",
          date: "2026-01-01T00:00:00.000Z",
          coverImage: "/assets/blog/cover.webp",
          coverAlt: "A person measuring framed landscape images",
          excerpt: "A short summary",
          tags: [],
        }}
      />
    );

    expect(
      screen.getByRole("img", {
        name: "A person measuring framed landscape images",
      })
    ).toHaveAttribute("src", "/assets/blog/cover.webp");
  });
});
