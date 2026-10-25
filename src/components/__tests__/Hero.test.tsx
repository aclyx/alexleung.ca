import { render, screen } from "@testing-library/react";

import { NOW_CONTENT } from "@/constants/now";

import { Hero } from "../Hero";

describe("Hero", () => {
  it("introduces Alex and links a compact reading update to Now", () => {
    const { container } = render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Alex Leung"
    );
    expect(screen.getByText(/I work on ChatGPT at OpenAI/)).toBeInTheDocument();
    expect(screen.getByText(/Currently reading:/)).toHaveTextContent(
      "Currently reading: Reinforcement Learning from Human Feedback. Now →"
    );
    expect(
      screen.getByRole("link", { name: /Reinforcement Learning/ })
    ).toHaveAttribute("href", "https://rlhfbook.com/");
    expect(container.querySelector("time")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Now →" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/now\/?$/)
    );
    expect(
      screen.queryByText(NOW_CONTENT.entries[1].title)
    ).not.toBeInTheDocument();
  });
});
