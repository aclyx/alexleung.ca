import { render, screen } from "@testing-library/react";

import TagArchivePage, {
  generateMetadata,
  generateStaticParams,
} from "../page";

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
  getAllPosts: jest.fn((fields?: string[]) => {
    const posts = [
      {
        slug: "agent-notes",
        title: "Agent Notes",
        date: "2026-04-10T00:00:00.000Z",
        excerpt: "Thinking through AI workflows.",
        coverImage: undefined,
        tags: ["AI", "Developer Workflow"],
      },
      {
        slug: "deep-learning-review",
        title: "Deep Learning Review",
        date: "2026-03-01T00:00:00.000Z",
        excerpt: "Notes on representation learning.",
        coverImage: undefined,
        tags: ["Deep Learning"],
      },
    ];

    if (!fields) {
      return posts;
    }

    return posts.map((post) =>
      Object.fromEntries(
        fields.map((field) => {
          const valuesByField: Record<string, unknown> = post;
          return [field, valuesByField[field]];
        })
      )
    );
  }),
}));

function getJsonLdEntries(container: HTMLElement) {
  return [
    ...container.querySelectorAll('script[type="application/ld+json"]'),
  ].map((script) => JSON.parse(script.textContent || "{}"));
}

describe("TagArchivePage", () => {
  it("renders only posts for the requested tag", async () => {
    const view = await TagArchivePage({
      params: Promise.resolve({ tag: "ai" }),
    });

    render(view);

    expect(
      screen.getByRole("heading", { level: 1, name: "AI" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agent Notes" })).toHaveAttribute(
      "href",
      "/blog/agent-notes/"
    );
    expect(screen.queryByText("Deep Learning Review")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Posts about AI tools, coding agents, creativity/i)
    ).toBeInTheDocument();
  });

  it("generates one static param per unique tag slug", () => {
    expect(generateStaticParams()).toEqual([
      { tag: "ai" },
      { tag: "developer-workflow" },
      { tag: "deep-learning" },
    ]);
  });

  it("emits a tag-specific item list identifier", async () => {
    const view = await TagArchivePage({
      params: Promise.resolve({ tag: "ai" }),
    });

    const { container } = render(view);
    const schemas = getJsonLdEntries(container);
    const itemListSchema = schemas.find(
      (schema) => schema["@type"] === "ItemList"
    );

    expect(itemListSchema["@id"]).toBe(
      "https://alexleung.ca/blog/tags/ai/#itemlist"
    );
  });

  it("marks single-post tag archives as noindex while preserving follow", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ tag: "ai" }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
