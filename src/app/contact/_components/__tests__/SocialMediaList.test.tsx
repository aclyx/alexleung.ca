import { render, screen } from "@testing-library/react";

import { SocialMediaList } from "../SocialMediaList";

describe("SocialMediaList", () => {
  it("groups the profile links in a named navigation", () => {
    render(<SocialMediaList />);
    expect(
      screen.getByRole("navigation", { name: "Profiles" })
    ).toBeInTheDocument();
  });

  it("renders the selected profile links", () => {
    render(<SocialMediaList />);
    expect(screen.getByLabelText("LinkedIn Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("GitHub Profile")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Work GitHub Profile")
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("X (Twitter) Profile")).toBeInTheDocument();
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
    expect(screen.getByLabelText("X (Twitter) Profile")).toHaveAttribute(
      "href",
      "https://www.x.com/aclyxpse"
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
    expect(screen.queryByText("Work GitHub")).not.toBeInTheDocument();
    expect(screen.getByText("X", { exact: true })).toBeInTheDocument();
    expect(screen.queryByText("Bluesky")).not.toBeInTheDocument();
    expect(screen.queryByText("Instagram")).not.toBeInTheDocument();
  });
});
