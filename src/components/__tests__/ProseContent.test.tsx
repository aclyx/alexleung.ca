import { render, screen } from "@testing-library/react";

import { ProseContent } from "../ProseContent";

describe("ProseContent", () => {
  it("renders children content", () => {
    render(
      <ProseContent>
        <p>Hello prose</p>
      </ProseContent>
    );

    expect(screen.getByText("Hello prose")).toBeInTheDocument();
  });

  it("renders html content", () => {
    render(<ProseContent html="<p>Rendered HTML</p>" />);

    expect(screen.getByText("Rendered HTML")).toBeInTheDocument();
  });

  it("uses the shared inline link treatment for prose anchors", () => {
    render(<ProseContent html='<p><a href="/blog/">Writing</a></p>' />);

    const wrapper = screen.getByText("Writing").closest("div");
    expect(wrapper).toHaveClass("prose-a:text-accent-link");
    expect(wrapper).toHaveClass("prose-a:underline");
    expect(wrapper).toHaveClass("prose-a:decoration-accent-link/40");
    expect(wrapper).toHaveClass("prose-a:hover:text-accent-link-hover");
    expect(wrapper).toHaveClass("prose-a:focus-visible:rounded-sm");
    expect(wrapper).toHaveClass("prose-a:focus-visible:outline-none");
    expect(wrapper).toHaveClass("prose-a:focus-visible:ring-2");
    expect(wrapper).toHaveClass("prose-a:focus-visible:ring-accent-link");
    expect(wrapper).toHaveClass("prose-a:focus-visible:ring-offset-2");
    expect(wrapper).toHaveClass("prose-a:focus-visible:ring-offset-paper");
  });

  it("uses base prose sizing by default", () => {
    render(
      <ProseContent>
        <p>Default size</p>
      </ProseContent>
    );

    const wrapper = screen.getByText("Default size").closest("div");
    expect(wrapper).toHaveClass("prose");
    expect(wrapper).not.toHaveClass("md:prose-lg");
    expect(wrapper).not.toHaveClass("prose-sm");
  });

  it("applies small prose sizing when size is sm", () => {
    render(
      <ProseContent size="sm">
        <p>Small size</p>
      </ProseContent>
    );

    const wrapper = screen.getByText("Small size").closest("div");
    expect(wrapper).toHaveClass("prose-sm");
    expect(wrapper).toHaveClass("md:prose-sm");
  });

  it("applies large prose sizing when size is lg", () => {
    render(
      <ProseContent size="lg">
        <p>Large size</p>
      </ProseContent>
    );

    const wrapper = screen.getByText("Large size").closest("div");
    expect(wrapper).toHaveClass("md:prose-lg");
  });
});
