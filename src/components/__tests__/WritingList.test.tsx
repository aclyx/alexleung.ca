import { render, screen, within } from "@testing-library/react";

import { WritingList } from "../WritingList";

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

describe("WritingList", () => {
  const posts = [
    {
      slug: "using-srcset",
      title: "Using srcSet",
      date: "2026-10-03",
      excerpt: "Use `srcSet` to serve smaller images.",
    },
    {
      slug: "trip-notes",
      title: "Trip Notes",
      date: "2026-09-12",
    },
  ];

  it("keeps every post in source order with one accessible link per article", () => {
    render(<WritingList posts={posts} />);

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(posts.length);
    articles.forEach((article, index) => {
      const links = within(article).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName(posts[index].title);
      expect(links[0]).toHaveAttribute("href", `/blog/${posts[index].slug}/`);
      expect(article.querySelector("time")).toHaveAttribute(
        "datetime",
        posts[index].date
      );
    });
    expect(screen.getByText("October 3, 2026")).toBeInTheDocument();
  });

  it("renders optional excerpts safely and preserves inline code", () => {
    render(<WritingList posts={posts} />);

    expect(
      screen.getByText("srcSet", { selector: "code" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")[1].querySelector("p")).toBeNull();
  });

  it("uses a lower heading level when embedded in a homepage section", () => {
    render(<WritingList posts={posts} variant="selected" headingLevel="h3" />);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });
});
