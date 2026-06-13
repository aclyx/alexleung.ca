import { fireEvent, render, screen } from "@testing-library/react";

import { TopicRevealList, type TopicLink } from "../TopicRevealList";

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

const topics: TopicLink[] = [
  "AI",
  "Reflection",
  "Deep Learning",
  "Book Notes",
  "Developer Workflow",
  "Review",
  "Architecture",
  "Lifestyle",
  "Next.js",
  "Systems",
].map((name) => ({
  name,
  href: `/blog/tags/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`,
}));

describe("TopicRevealList", () => {
  it("shows an initial topic batch and reveals more topics incrementally", () => {
    render(<TopicRevealList topics={topics} />);

    expect(screen.getByRole("link", { name: "AI" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Developer Workflow" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Review" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View 4 more" }));

    expect(screen.getByRole("link", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next.js" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Systems" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View 1 more" }));

    expect(screen.getByRole("link", { name: "Systems" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders no controls when there are no topics", () => {
    const { container } = render(<TopicRevealList topics={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
