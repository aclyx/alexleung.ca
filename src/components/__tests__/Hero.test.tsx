import { render, screen } from "@testing-library/react";

import { Hero } from "../Hero";

describe("Hero", () => {
  it("renders Alex's name, professional identity, and portrait", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Alex Leung"
    );
    expect(
      screen.getByText(/Software engineer and writer/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /Alex Leung sitting in an art studio/i,
      })
    ).toBeInTheDocument();
  });

  it("summarizes Alex's work and writing directly", () => {
    render(<Hero />);

    expect(
      screen.getByText(
        /I build products and systems that make new technology useful in everyday life\. I write about software, technical books, and life outside work\./i
      )
    ).toBeInTheDocument();
  });

  it("renders Now, contact, and writing links", () => {
    render(<Hero />);

    expect(
      screen.getByRole("link", {
        name: /Now — what I’m reading and studying/i,
      })
    ).toHaveAttribute("href", "/now");
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute(
      "href",
      "/contact"
    );
    expect(
      screen.getByRole("link", { name: /read my writing/i })
    ).toHaveAttribute("href", "/blog");
  });

  it('uses id="about" for the consolidated profile section', () => {
    const { container } = render(<Hero />);

    expect(container.querySelector("section")).toHaveAttribute("id", "about");
  });

  it("animates the copy while keeping the portrait immediately visible", () => {
    const { container } = render(<Hero />);
    const portrait = screen.getByRole("img", {
      name: /Alex Leung sitting in an art studio/i,
    });

    expect(container.querySelectorAll(".hero-enter")).toHaveLength(1);
    expect(portrait.closest(".hero-enter")).toBeNull();
  });
});
