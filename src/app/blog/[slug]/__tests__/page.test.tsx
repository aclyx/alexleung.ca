import { render, screen } from "@testing-library/react";

import Post from "../page";

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

jest.mock("@/lib/markdownToHtml", () => ({
  __esModule: true,
  default: jest.fn(async () => "<p>Rendered body</p>"),
}));

jest.mock("@/lib/blogApi", () => ({
  getPostBySlug: jest.fn((slug: string, fields?: string[]) => {
    const post = {
      slug,
      title: "Cover Alt Hero",
      date: "2026-01-01T00:00:00.000Z",
      updated: undefined,
      content: "Body",
      coverImage: "/assets/blog/cover.webp",
      coverAlt: "A laptop beside a notebook on a desk.",
      excerpt: "A short summary.",
      tags: [],
    };

    if (!fields) {
      return post;
    }

    return Object.fromEntries(
      fields.map((field) => {
        const valuesByField: Record<string, unknown> = post;
        return [field, valuesByField[field]];
      })
    );
  }),
  getAllPosts: jest.fn(() => []),
  getRelatedPosts: jest.fn(() => []),
  getSeriesNavigation: jest.fn(() => null),
}));

describe("Blog post page", () => {
  it("uses custom cover alt text for the hero image", async () => {
    const view = await Post({
      params: Promise.resolve({ slug: "cover-alt-hero" }),
    });

    render(view);

    expect(
      screen.getByRole("img", {
        name: "A laptop beside a notebook on a desk.",
      })
    ).toBeInTheDocument();
  });
});
