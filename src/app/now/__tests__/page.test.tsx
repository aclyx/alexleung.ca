import { render, screen } from "@testing-library/react";

import NowPage, { NOW_PAGE_LAST_UPDATED_DISPLAY } from "../page";

jest.mock("@/lib/blogApi", () => ({
  getAllPosts: jest.fn(() => []),
}));

describe("NowPage", () => {
  it("renders the latest Now snapshot and time capsule drawer", () => {
    render(<NowPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "What I'm Doing Now" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Last updated: ${NOW_PAGE_LAST_UPDATED_DISPLAY}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Time capsule", { selector: "summary *" })
    ).toBeInTheDocument();
    expect(screen.getByText("12 past snapshots")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Past Now Pages" })).toBeNull();
    expect(
      screen.getByText(/getting settled into my new role/i)
    ).toBeInTheDocument();
    expect(screen.getByText("April 21, 2026")).toBeInTheDocument();
  });
});
