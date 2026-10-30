import { render, screen, within } from "@testing-library/react";

import { BROWSER_TOOLS } from "@/constants/browserTools";

import { BrowserToolGrid } from "../BrowserToolGrid";

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

describe("BrowserToolGrid", () => {
  it("links each tool card by name to its route", () => {
    render(<BrowserToolGrid />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(BROWSER_TOOLS.length);
    BROWSER_TOOLS.forEach((tool, index) => {
      const link = within(items[index]).getByRole("link");
      expect(link).toHaveAccessibleName(tool.title);
      expect(link).toHaveAttribute("href", tool.href);
      expect(within(link).getByText(tool.description)).toBeInTheDocument();
      expect(link.querySelector("img")).toHaveAttribute("src", tool.image.src);
    });
  });

  it("widens only the featured tool", () => {
    render(<BrowserToolGrid />);

    const featured = BROWSER_TOOLS.filter((tool) => tool.featured);
    expect(featured).toHaveLength(1);
    const items = screen.getAllByRole("listitem");
    BROWSER_TOOLS.forEach((tool, index) => {
      expect(items[index].className.includes("sm:col-span-2")).toBe(
        Boolean(tool.featured)
      );
    });
  });
});
