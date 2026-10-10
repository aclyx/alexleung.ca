import { render, screen, within } from "@testing-library/react";

import { getRelatedPosts, getSeriesNavigation } from "@/lib/blogApi";

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

const mockedGetSeriesNavigation = jest.mocked(getSeriesNavigation);
const mockedGetRelatedPosts = jest.mocked(getRelatedPosts);

describe("Blog post page", () => {
  beforeEach(() => {
    mockedGetSeriesNavigation.mockReturnValue(null);
    mockedGetRelatedPosts.mockReturnValue([]);
  });

  it("renders related posts as title-and-date links in the supplied order", async () => {
    const relatedPosts = ["First", "Second", "Third"].map((name, index) => ({
      slug: `related-${index}`,
      title: `${name} related post`,
      date: "2026-02-01",
      excerpt: `Excerpt for ${name}.`,
      coverImage: "/assets/blog/related.webp",
      tags: [],
      draft: false,
      content: "Related body",
    }));
    mockedGetRelatedPosts.mockReturnValue(relatedPosts);

    const view = await Post({
      params: Promise.resolve({ slug: "cover-alt-hero" }),
    });

    render(view);

    const section = screen.getByRole("region", { name: "Related posts" });
    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(3);
    links.forEach((link, index) => {
      expect(link).toHaveAccessibleName(relatedPosts[index].title);
      expect(link).toHaveAttribute(
        "href",
        `/blog/${relatedPosts[index].slug}/`
      );
      expect(
        within(link).getByRole("heading", {
          level: 3,
          name: relatedPosts[index].title,
        })
      ).toBeInTheDocument();
      expect(link.querySelector("time")).toHaveAttribute(
        "datetime",
        "2026-02-01"
      );
      expect(within(link).queryByRole("img")).not.toBeInTheDocument();
      expect(
        within(link).queryByText(relatedPosts[index].excerpt)
      ).not.toBeInTheDocument();
    });
  });

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
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
      "id",
      "post-title"
    );
    expect(document.querySelector("[data-reading-progress]")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("uses the shared focus treatment for series navigation links", async () => {
    mockedGetSeriesNavigation.mockReturnValue({
      name: "Example Series",
      currentPart: 2,
      totalParts: 3,
      previousPost: {
        slug: "previous-part",
        title: "Previous part",
        seriesOrder: 1,
      },
      nextPost: {
        slug: "next-part",
        title: "Next part",
        seriesOrder: 3,
      },
    });

    const view = await Post({
      params: Promise.resolve({ slug: "cover-alt-hero" }),
    });

    render(view);

    for (const title of ["Previous part", "Next part"]) {
      const link = screen.getByText(title).closest("a");
      expect(link).toHaveClass("focus-visible:outline-none");
      expect(link).toHaveClass("focus-visible:ring-2");
      expect(link).toHaveClass("focus-visible:ring-accent-link");
      expect(link).toHaveClass("focus-visible:ring-offset-paper");
    }
  });
});
