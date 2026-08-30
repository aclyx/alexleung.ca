import { fireEvent, render, screen } from "@testing-library/react";

import { FollowItSubscribeForm } from "../FollowItSubscribeForm";

describe("FollowItSubscribeForm", () => {
  it("renders default copy and required fields", () => {
    render(<FollowItSubscribeForm />);

    expect(
      screen.getByRole("heading", { name: /get new posts by email/i })
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute(
      "required"
    );

    expect(
      screen.getByRole("button", { name: /subscribe/i })
    ).toBeInTheDocument();
  });

  it("posts to the follow.it action by default", () => {
    const { container } = render(<FollowItSubscribeForm />);
    const form = container.querySelector("form");

    expect(form).not.toBeNull();
    expect(form).toHaveAttribute(
      "action",
      "https://api.follow.it/subscription-form/RkY1QllwUjBPUEZhSnNWMnZQVjdlK2tMZWtJOWRrVGlma0xlT09iU0pIUWtPWjVVMWVucTE1WWdNYjZIckhoWGwzTy9yME5WNjJaQUxyUG5oclg2VC9Td2FIRGl5aWZZL3JheTB0UTdHOFZMaXJDV1FXcGlham5lSlFXc013NGl8bTM1Qkt0b1VwU0RNS1Z1Y1EzU0dnUkt1NjFOQ0FBd01wbW5RTFB2dHFHVT0=/8"
    );
    expect(form).toHaveAttribute("method", "post");
  });

  it("supports custom heading and button label", () => {
    render(
      <FollowItSubscribeForm
        title="Join the newsletter"
        buttonLabel="Join now"
      />
    );

    expect(
      screen.getByRole("heading", { name: /join the newsletter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join now/i })
    ).toBeInTheDocument();
  });

  it("supports a nested section heading level", () => {
    render(<FollowItSubscribeForm headingLevel="h3" />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: /get new posts by email/i,
      })
    ).toBeInTheDocument();
  });

  it("uses shared action and field styles", () => {
    render(<FollowItSubscribeForm />);

    expect(screen.getByRole("button", { name: /subscribe/i })).toHaveClass(
      "bg-accent-primary"
    );
    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveClass(
      "border-control-border"
    );
  });

  it("shows submitting affordance after submit", () => {
    const { container } = render(<FollowItSubscribeForm />);
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    fireEvent.change(emailInput, {
      target: { value: "alex@example.com" },
    });
    const form = container.querySelector<HTMLFormElement>("form");

    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(
      screen.getByRole("button", { name: /subscribing\.\.\./i })
    ).toHaveAttribute("aria-disabled", "true");
    expect(emailInput).toHaveAttribute("readonly");
    expect(form).toHaveAttribute("aria-busy", "true");
  });
});
