import { render, screen } from "@testing-library/react";

import { data } from "@/constants/socialLinks";

import Footer from "../Footer";

describe("Footer", () => {
  it("should render social links with proper security attributes", () => {
    const { container } = render(<Footer />);

    const links = data.map((item) =>
      container.querySelector(`a[aria-label="${item.label}"]`)
    );
    expect(links).toHaveLength(data.length);

    links.forEach((link) => {
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "me noopener");
    });
  });

  it("keeps footer social links visible across breakpoints", () => {
    const { container } = render(<Footer />);

    const socialListItems = container.querySelectorAll("li");
    expect(socialListItems).toHaveLength(data.length);

    socialListItems.forEach((item) => {
      expect(item).toHaveClass("inline-block");
      expect(item).not.toHaveClass("lg:hidden");
    });
  });

  it("should render RSS subscription link", () => {
    render(<Footer />);

    const rssLink = screen.getByRole("link", { name: /subscribe via rss/i });
    expect(rssLink).toHaveAttribute("href", "/feed.xml");
    expect(rssLink).toHaveClass("focus-visible:outline-none");
    expect(rssLink).toHaveClass("focus-visible:ring-2");
    expect(rssLink).toHaveClass("focus-visible:ring-accent-link");
    expect(rssLink).toHaveClass("focus-visible:ring-offset-paper");
  });

  it("should display copyright with current year", () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${currentYear}.*Alex Leung`))
    ).toBeInTheDocument();
  });
});
