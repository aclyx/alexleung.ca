import { render, screen } from "@testing-library/react";

import { Hero } from "../Hero";

describe("Hero", () => {
  it("should render name and professional title", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Alex Leung"
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Software Engineer and Writer\./i,
      })
    ).toBeInTheDocument();
  });

  it("should render friendly supporting copy", () => {
    render(<Hero />);

    expect(
      screen.getByText(
        /I build AI product surfaces and reliable software systems\. I share some of my thoughts here\./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /^Writing$/i,
      })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Most pieces start/i)).not.toBeInTheDocument();
  });

  it("should render contact and writing CTA links", () => {
    render(<Hero />);

    expect(screen.getByRole("link", { name: /contact alex/i })).toHaveAttribute(
      "href",
      "/contact"
    );
    expect(screen.getByRole("link", { name: /read writing/i })).toHaveAttribute(
      "href",
      "/blog"
    );
  });

  it('should have id="home" for anchor navigation', () => {
    const { container } = render(<Hero />);

    expect(container.querySelector("section")).toHaveAttribute("id", "home");
  });
});
