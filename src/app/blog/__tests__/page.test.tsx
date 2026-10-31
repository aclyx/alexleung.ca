import { render, screen } from "@testing-library/react";

import BlogIndex from "../page";

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

jest.mock("@/lib/blogApi", () => ({
  getAllPosts: jest.fn(() =>
    Array.from({ length: 6 }, (_, index) => ({
      slug: `post-${index + 1}`,
      title: `Post ${index + 1}`,
      date: "2026-10-03",
      excerpt: `An excerpt for post ${index + 1}.`,
      tags: ["AI"],
    }))
  ),
  getSeriesSummaries: jest.fn(() => [
    { name: "Book notes", firstPost: { slug: "post-1" } },
  ]),
}));

describe("BlogIndex", () => {
  it("renders the complete archive and keeps structured data in sync", () => {
    const { container } = render(<BlogIndex />);

    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Post 6" })).toHaveAttribute(
      "href",
      "/blog/post-6/"
    );
    const schemas = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
      (script) => JSON.parse(script.textContent || "{}")
    );
    expect(
      schemas.find((schema) => schema["@type"] === "ItemList").itemListElement
    ).toHaveLength(6);
  });

  it("preserves topic, series, and email discovery alongside the text archive", () => {
    const { container } = render(<BlogIndex />);

    expect(container.querySelector("details")).toBeNull();
    expect(screen.getByRole("link", { name: "AI" })).toHaveAttribute(
      "href",
      "/blog/tags/ai/"
    );
    expect(screen.getByRole("link", { name: "Book notes" })).toHaveAttribute(
      "href",
      "/blog/post-1/"
    );
    expect(container.querySelectorAll("#blog-topic-list")).toHaveLength(1);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Subscribe" })
    ).toBeInTheDocument();
  });
});
