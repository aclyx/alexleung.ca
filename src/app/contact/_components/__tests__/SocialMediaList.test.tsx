import { render, screen } from "@testing-library/react";

import { SocialMediaList } from "../SocialMediaList";

describe("SocialMediaList", () => {
  it("renders the Professional Links subtitle", () => {
    render(<SocialMediaList />);
    expect(screen.getByText("Professional Links")).toBeInTheDocument();
  });

  it("renders the primary professional links", () => {
    render(<SocialMediaList />);
    expect(screen.getByLabelText("LinkedIn Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("GitHub Profile")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Corporate GitHub Profile")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("X (Twitter) Profile")
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Bluesky Profile")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Instagram Profile")
    ).not.toBeInTheDocument();
  });

  it("renders links with correct hrefs", () => {
    render(<SocialMediaList />);
    expect(screen.getByLabelText("LinkedIn Profile")).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/aclyx"
    );
    expect(screen.getByLabelText("GitHub Profile")).toHaveAttribute(
      "href",
      "https://www.github.com/aclyx"
    );
  });

  it("opens links in new tab with security attributes", () => {
    render(<SocialMediaList />);
    const linkedInLink = screen.getByLabelText("LinkedIn Profile");
    expect(linkedInLink).toHaveAttribute("target", "_blank");
    expect(linkedInLink).toHaveAttribute("rel", "noopener noreferrer me");
  });

  it("displays platform names without 'Profile' suffix", () => {
    render(<SocialMediaList />);
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.queryByText("Corporate GitHub")).not.toBeInTheDocument();
    expect(screen.queryByText("X (Twitter)")).not.toBeInTheDocument();
    expect(screen.queryByText("Bluesky")).not.toBeInTheDocument();
    expect(screen.queryByText("Instagram")).not.toBeInTheDocument();
  });
});
