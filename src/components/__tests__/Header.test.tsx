import { usePathname } from "next/navigation";

import { render, screen, within } from "@testing-library/react";

import Header from "../Header";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = jest.mocked(usePathname);

describe("Header", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("exposes the same navigation directly without opening a menu", () => {
    render(<Header />);
    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });

    expect(
      within(navigation).getByRole("link", { name: "alexleung.ca" })
    ).toHaveAttribute("href", "/");
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => link.textContent)
    ).toEqual(["alexleung.ca", "Home", "Writing", "Now", "Contact"]);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it.each([
    ["/", "Home"],
    ["/blog", "Writing"],
    ["/blog/", "Writing"],
    ["/blog/a-post/", "Writing"],
    ["/blog/tags/ai/", "Writing"],
    ["/now/", "Now"],
    ["/contact/", "Contact"],
  ])("marks the active link on %s", (pathname, label) => {
    mockUsePathname.mockReturnValue(pathname);
    render(<Header />);

    const currentLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAccessibleName(label);
  });

  it("does not treat a partial path match as the Writing page", () => {
    mockUsePathname.mockReturnValue("/blogging/");
    render(<Header />);

    expect(screen.getByRole("link", { name: "Writing" })).not.toHaveAttribute(
      "aria-current"
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("updates the current link after navigation", () => {
    const { rerender } = render(<Header />);
    mockUsePathname.mockReturnValue("/now/");
    rerender(<Header />);

    expect(screen.getByRole("link", { name: "Now" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});
