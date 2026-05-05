import { render, screen } from "@testing-library/react";

import NowPage, { NOW_PAGE_LAST_UPDATED_DISPLAY } from "../page";

jest.mock("@/lib/blogApi", () => ({
  getAllPosts: jest.fn(() => []),
}));

describe("NowPage", () => {
  it("renders the latest Now snapshot and timeline link", () => {
    render(<NowPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "What I'm Doing Now" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Last updated: ${NOW_PAGE_LAST_UPDATED_DISPLAY}`)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Past Now Pages" })
    ).toHaveAttribute("href", expect.stringMatching(/^\/now\/timeline\/?$/));
    expect(
      screen.getByText(/getting settled into my new role/i)
    ).toBeInTheDocument();
  });
});
