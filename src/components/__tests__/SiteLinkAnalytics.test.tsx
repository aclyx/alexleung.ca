import { fireEvent, render, screen } from "@testing-library/react";

import { SiteLinkAnalytics } from "../SiteLinkAnalytics";

const trackExternalLinkClick = jest.fn();
const trackInternalLinkClick = jest.fn();

jest.mock("@/lib/analytics", () => ({
  trackExternalLinkClick: (...args: unknown[]) =>
    trackExternalLinkClick(...args),
  trackInternalLinkClick: (...args: unknown[]) =>
    trackInternalLinkClick(...args),
}));

describe("SiteLinkAnalytics", () => {
  beforeEach(() => {
    trackExternalLinkClick.mockClear();
    trackInternalLinkClick.mockClear();
    window.history.pushState({}, "", "/blog/example/");
  });

  it("tracks delegated internal link clicks", () => {
    render(
      <>
        <SiteLinkAnalytics />
        <a href="/about/">About Alex</a>
      </>
    );

    fireEvent.click(screen.getByRole("link", { name: "About Alex" }));

    expect(trackInternalLinkClick).toHaveBeenCalledWith({
      current_path: "/blog/example/",
      destination_path: "/about/",
      link_text: "About Alex",
      link_url: "http://localhost/about/",
    });
    expect(trackExternalLinkClick).not.toHaveBeenCalled();
  });

  it("tracks delegated external link clicks", () => {
    render(
      <>
        <SiteLinkAnalytics />
        <a href="https://github.com/aclyx">GitHub</a>
      </>
    );

    fireEvent.click(screen.getByRole("link", { name: "GitHub" }));

    expect(trackExternalLinkClick).toHaveBeenCalledWith({
      current_path: "/blog/example/",
      link_host: "github.com",
      link_text: "GitHub",
      link_url: "https://github.com/aclyx",
    });
    expect(trackInternalLinkClick).not.toHaveBeenCalled();
  });

  it("ignores same-page hash links", () => {
    render(
      <>
        <SiteLinkAnalytics />
        <a href="#section">Jump</a>
      </>
    );

    fireEvent.click(screen.getByRole("link", { name: "Jump" }));

    expect(trackExternalLinkClick).not.toHaveBeenCalled();
    expect(trackInternalLinkClick).not.toHaveBeenCalled();
  });
});
