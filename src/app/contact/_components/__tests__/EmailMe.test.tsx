import { act, fireEvent, render, screen } from "@testing-library/react";

import { EmailMe } from "../EmailMe";

const writeText = jest.fn();

describe("EmailMe", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    writeText.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows temporary confirmation while keeping the copy action available", async () => {
    writeText.mockResolvedValue(undefined);
    render(<EmailMe />);

    const copyButton = screen.getByRole("button", { name: "Copy email" });

    await act(async () => {
      fireEvent.click(copyButton);
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("alex@alexleung.ca");
    expect(copyButton).toHaveAttribute("data-copy-status", "copied");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Email address copied to clipboard."
    );

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(copyButton).toHaveAttribute("data-copy-status", "idle");
    expect(copyButton).toHaveAccessibleName("Copy email");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await act(async () => {
      fireEvent.click(copyButton);
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledTimes(2);
  });

  it("recovers after clipboard failures", async () => {
    writeText.mockRejectedValue(new Error("Clipboard unavailable"));
    render(<EmailMe />);

    const copyButton = screen.getByRole("button", { name: "Copy email" });

    await act(async () => {
      fireEvent.click(copyButton);
      await Promise.resolve();
    });

    expect(copyButton).toHaveAttribute("data-copy-status", "failed");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Could not copy email address."
    );

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(copyButton).toHaveAttribute("data-copy-status", "idle");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
