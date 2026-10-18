import { render, screen } from "@testing-library/react";

import { NOW_CONTENT, NOW_PAGE_LAST_UPDATED_ISO } from "@/constants/now";

import { Hero } from "../Hero";

describe("Hero", () => {
  it("introduces Alex and previews the first shared Now entry", () => {
    const { container } = render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Alex Leung"
    );
    expect(screen.getByText(/I work on ChatGPT at OpenAI/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      NOW_CONTENT.entries[0].title
    );
    expect(
      screen.getByRole("link", { name: /Reinforcement Learning/ })
    ).toHaveAttribute("href", "https://rlhfbook.com/");
    expect(container.querySelector("time")).toHaveAttribute(
      "datetime",
      NOW_PAGE_LAST_UPDATED_ISO
    );
    expect(
      screen.getByRole("link", { name: /More on the Now page/ })
    ).toHaveAttribute("href", expect.stringMatching(/^\/now\/?$/));
    expect(
      screen.queryByText(NOW_CONTENT.entries[1].title)
    ).not.toBeInTheDocument();
  });
});
