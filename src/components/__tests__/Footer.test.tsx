import { fireEvent, render, screen, within } from "@testing-library/react";

import { data } from "@/constants/socialLinks";
import { trackContactLinkClick } from "@/lib/analytics";

import Footer from "../Footer";

jest.mock("@/lib/analytics", () => ({
  trackContactLinkClick: jest.fn(),
}));

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

describe("Footer", () => {
  it("renders Alex's name and five direct text links in the intended order", () => {
    render(<Footer />);
    const navigation = screen.getByRole("navigation", {
      name: "Footer navigation",
    });

    expect(screen.getByText("Alex Leung")).toBeInTheDocument();
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => link.textContent)
    ).toEqual(["GitHub", "LinkedIn", "X", "RSS", "Contact"]);
  });

  it.each(data.filter(({ id }) => [1, 2, 4].includes(id)))(
    "preserves the canonical URL and safe external-link attributes for $label",
    ({ label, url }) => {
      render(<Footer />);
      const profileLink = screen.getByRole("link", { name: label });

      expect(profileLink).toHaveAttribute("href", url);
      expect(profileLink).toHaveAttribute("target", "_blank");
      expect(profileLink).toHaveAttribute("rel", "me noopener");
    }
  );

  it("tracks social clicks with the footer placement and canonical profile data", () => {
    render(<Footer />);
    fireEvent.click(screen.getByRole("link", { name: "X (Twitter) Profile" }));

    expect(trackContactLinkClick).toHaveBeenCalledWith({
      label: "X (Twitter) Profile",
      placement: "footer",
      url: data.find(({ id }) => id === 4)?.url,
    });
  });

  it("links to the RSS file and the contact route", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "RSS" })).toHaveAttribute(
      "href",
      "/feed.xml"
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact/"
    );
  });
});
