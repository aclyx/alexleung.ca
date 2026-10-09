import { render, screen } from "@testing-library/react";

import { NOW_CONTENT, NOW_PAGE_LAST_UPDATED_DISPLAY } from "@/constants/now";

import NowPage from "../page";

describe("Now page", () => {
  it("renders every shared entry in order and the shared update date", () => {
    const { container } = render(<NowPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Now");
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual(NOW_CONTENT.entries.map((entry) => entry.title));
    expect(container.querySelector("time")).toHaveAttribute(
      "datetime",
      NOW_CONTENT.updatedAt
    );
    expect(container.querySelector("time")).toHaveTextContent(
      `Updated ${NOW_PAGE_LAST_UPDATED_DISPLAY}`
    );
    expect(
      screen.getByText(
        /I particularly liked its effervescence and brighter aroma/
      )
    ).toBeInTheDocument();
  });

  it("preserves the reading reference and its accessible external link", () => {
    render(<NowPage />);

    const bookLink = screen.getByRole("link", {
      name: "Reinforcement Learning from Human Feedback",
    });
    expect(bookLink).toHaveAttribute("href", "https://rlhfbook.com/");
    expect(bookLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(bookLink.closest("p")).toHaveTextContent(
      "I’m reading Reinforcement Learning from Human Feedback by Nathan Lambert."
    );
  });
});
