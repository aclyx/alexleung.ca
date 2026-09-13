import { usePathname } from "next/navigation";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import Header from "../Header";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = jest.mocked(usePathname);

describe("Header", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render navigation with logo and links", () => {
    render(<Header />);
    expect(screen.getByText("Alex Leung")).toBeInTheDocument();
    expect(screen.getAllByText("Experience")).toHaveLength(2);
    expect(screen.getAllByText("Writing")).toHaveLength(2);
    expect(screen.getAllByText("Now")).toHaveLength(2);
    expect(screen.getAllByText("Contact")).toHaveLength(2);
    expect(screen.queryByText("About")).not.toBeInTheDocument();
    expect(screen.queryByText("Experiments")).not.toBeInTheDocument();
  });

  describe("Mobile Menu", () => {
    it("should toggle menu visibility via aria-expanded", () => {
      render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });

      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-controls", "mobile-nav-drawer");

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveAccessibleName("Close menu");

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAccessibleName("Open menu");
    });

    it("keeps the mobile menu mounted so open and close transitions can run", () => {
      const { container } = render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });
      const drawer = container.querySelector("#mobile-nav-drawer");

      expect(drawer).toHaveAttribute("aria-hidden", "true");
      expect(drawer).toHaveClass("opacity-0", "-translate-y-2");

      fireEvent.click(button);
      expect(drawer).toHaveAttribute("aria-hidden", "false");
      expect(drawer).toHaveClass("opacity-100", "translate-y-0");

      fireEvent.click(button);
      expect(drawer).toHaveAttribute("aria-hidden", "true");
      expect(drawer).toHaveClass("opacity-0", "-translate-y-2");
    });

    it("keeps the non-modal drawer scrollable without locking the page", () => {
      const { container } = render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });

      fireEvent.click(button);
      const drawer = container.querySelector("#mobile-nav-drawer");

      expect(drawer).toHaveClass(
        "max-h-[calc(100dvh-var(--header-height))]",
        "overflow-y-auto"
      );
      expect(document.body.style.overflow).toBe("");
    });

    it("animates the drawer as one unit without staggered link motion", () => {
      const { container } = render(<Header />);
      const drawer = container.querySelector("#mobile-nav-drawer");
      const items = drawer?.querySelectorAll("li") ?? [];

      expect(drawer).toHaveClass("transition-[opacity,translate]");
      items.forEach((item) => {
        expect(item).not.toHaveAttribute("style");
        expect(item).not.toHaveClass("transition-[opacity,transform]");
      });
    });

    it("should close menu when navigation link is clicked", () => {
      render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });

      fireEvent.click(button);
      const mobileLink = screen.getAllByText("Experience")[1];
      fireEvent.click(mobileLink);

      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("does not return focus to the menu button after navigation", () => {
      render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });

      fireEvent.click(button);
      const mobileLink = screen.getAllByText("Experience")[1];
      mobileLink.focus();
      fireEvent.click(mobileLink);

      expect(button).not.toHaveFocus();
      expect(mobileLink).not.toHaveFocus();
    });

    it("should close menu when pathname changes", async () => {
      let pathname = "/";
      mockUsePathname.mockImplementation(() => pathname);

      const { rerender } = render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      pathname = "/now/";
      rerender(<Header />);

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });
  });

  describe("Active Link Detection", () => {
    it("should mark current page link as active", () => {
      mockUsePathname.mockReturnValue("/blog/");
      render(<Header />);

      const writingLink = screen.getAllByText("Writing")[0];
      const nowLink = screen.getAllByText("Now")[0];

      expect(writingLink).toHaveClass("nav-link--active");
      expect(nowLink).toHaveClass("nav-link--inactive");
    });

    it("should handle trailing slashes in pathname matching", () => {
      mockUsePathname.mockReturnValue("/blog");
      render(<Header />);

      const writingLink = screen.getAllByText("Writing")[0];
      expect(writingLink).toHaveClass("nav-link--active");
    });

    it("links to the homepage experience section without marking it as a page", () => {
      mockUsePathname.mockReturnValue("/");
      render(<Header />);

      const experienceLink = screen.getAllByText("Experience")[0];
      expect(experienceLink).toHaveAttribute("href", "/#experience");
      expect(experienceLink).toHaveClass("nav-link--inactive");
      expect(experienceLink).not.toHaveAttribute("aria-current");
    });

    it("marks the homepage experience section as the current location", async () => {
      window.history.replaceState(null, "", "/#experience");
      render(<Header />);

      await waitFor(() => {
        const experienceLinks = screen.getAllByText("Experience");
        expect(experienceLinks[0]).toHaveAttribute("aria-current", "location");
        expect(experienceLinks[1]).toHaveAttribute("aria-current", "location");
      });
    });

    it("marks Experience current when its link changes the hash", async () => {
      render(<Header />);

      fireEvent.click(screen.getAllByText("Experience")[0]);

      await waitFor(() => {
        expect(screen.getAllByText("Experience")[0]).toHaveAttribute(
          "aria-current",
          "location"
        );
      });
    });

    it("should set aria-current on active links across desktop and mobile nav", () => {
      mockUsePathname.mockReturnValue("/blog/");
      render(<Header />);

      const button = screen.getByRole("button", { name: "Open menu" });
      fireEvent.click(button);

      const writingLinks = screen.getAllByText("Writing");
      expect(writingLinks[0]).toHaveAttribute("aria-current", "page");
      expect(writingLinks[1]).toHaveAttribute("aria-current", "page");

      const experienceLinks = screen.getAllByText("Experience");
      expect(experienceLinks[0]).not.toHaveAttribute("aria-current");
      expect(experienceLinks[1]).not.toHaveAttribute("aria-current");
    });

    it("should keep blog navigation active on tag archive routes", () => {
      mockUsePathname.mockReturnValue("/blog/tags/ai/");
      render(<Header />);

      const writingLink = screen.getAllByText("Writing")[0];
      expect(writingLink).toHaveClass("nav-link--active");
      expect(writingLink).toHaveAttribute("aria-current", "page");
    });
  });

  describe("Accessibility", () => {
    it("should not move focus to the menu button on initial render", () => {
      render(<Header />);

      const button = screen.getByRole("button", { name: "Open menu" });

      expect(button).not.toHaveFocus();
    });

    it("should have proper aria-label on menu button", () => {
      render(<Header />);
      expect(
        screen.getByRole("navigation", { name: "Primary navigation" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Open menu" })
      ).toBeInTheDocument();
    });

    it("should have aria-expanded attribute on menu button", () => {
      render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("hides closed mobile links from assistive technology and tab order", () => {
      const { container } = render(<Header />);
      const drawer = container.querySelector("#mobile-nav-drawer");
      const mobileLink = container.querySelector(".mobile-nav-link");

      expect(drawer).toHaveAttribute("aria-hidden", "true");
      expect(mobileLink).toHaveAttribute("tabindex", "-1");
    });

    it("should set tabIndex=0 on mobile links when menu is open", () => {
      render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });

      fireEvent.click(button);

      const mobileLink = screen.getAllByText("Experience")[1];
      expect(mobileLink).toHaveAttribute("tabindex", "0");
    });

    it("should close the mobile menu when Escape is pressed", () => {
      render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      fireEvent.keyDown(document, { key: "Escape" });
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("should return focus to the menu button when the menu closes", () => {
      render(<Header />);
      const button = screen.getByRole("button", { name: "Open menu" });

      fireEvent.click(button);
      fireEvent.keyDown(document, { key: "Escape" });

      expect(button).toHaveFocus();
    });
  });
});
