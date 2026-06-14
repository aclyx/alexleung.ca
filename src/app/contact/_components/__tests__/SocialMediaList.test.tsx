import { render, screen } from "@testing-library/react";

import { SocialMediaList } from "../SocialMediaList";

describe("SocialMediaList", () => {
  it("renders the Connect subtitle", () => {
    render(<SocialMediaList />);
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("renders all social media links", () => {
    render(<SocialMediaList />);
    expect(screen.getByLabelText("LinkedIn Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("GitHub Profile")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Corporate GitHub Profile")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("X (Twitter) Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("Bluesky Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram Profile")).toBeInTheDocument();
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
    expect(screen.getByLabelText("Corporate GitHub Profile")).toHaveAttribute(
      "href",
      "https://github.com/aclyx-oai"
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
    expect(screen.getByText("Corporate GitHub")).toBeInTheDocument();
    expect(screen.getByText("X (Twitter)")).toBeInTheDocument();
    expect(screen.getByText("Bluesky")).toBeInTheDocument();
    expect(screen.getByText("Instagram")).toBeInTheDocument();
  });
});
