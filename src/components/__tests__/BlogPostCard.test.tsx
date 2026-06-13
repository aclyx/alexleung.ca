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

  it("uses custom cover alt text when a cover image is present", () => {
    render(
      <BlogPostCard
        post={{
          slug: "cover-alt-post",
          title: "Cover Alt Post",
          date: "2026-01-01T00:00:00.000Z",
          coverImage: "/assets/blog/cover.webp",
          coverAlt: "A laptop beside a notebook on a desk.",
          excerpt: undefined,
          tags: [],
        }}
      />
    );

    expect(
      screen.getByRole("img", {
        name: "A laptop beside a notebook on a desk.",
      })
    ).toBeInTheDocument();
  });
});
