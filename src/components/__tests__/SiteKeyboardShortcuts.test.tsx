import { fireEvent, render, screen } from "@testing-library/react";

import SiteKeyboardShortcuts from "../SiteKeyboardShortcuts";

describe("SiteKeyboardShortcuts", () => {
  let scrollBy: jest.Mock;

  beforeEach(() => {
    scrollBy = jest.fn();

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, "scrollBy", {
      configurable: true,
      value: scrollBy,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("scrolls down with j and up with k", () => {
    render(<SiteKeyboardShortcuts />);

    fireEvent.keyDown(document, { key: "j" });
    fireEvent.keyDown(document, { key: "k" });

    expect(scrollBy).toHaveBeenNthCalledWith(1, { top: 280, left: 0 });
    expect(scrollBy).toHaveBeenNthCalledWith(2, { top: -280, left: 0 });
  });

  it("ignores shortcuts when modifier keys are held", () => {
    render(<SiteKeyboardShortcuts />);

    fireEvent.keyDown(document, { key: "j", metaKey: true });
    fireEvent.keyDown(document, { key: "k", shiftKey: true });

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("ignores shortcuts from form controls and buttons", () => {
    render(
      <>
        <SiteKeyboardShortcuts />
        <input aria-label="Name" />
        <textarea aria-label="Message" />
        <select aria-label="Options" />
        <button type="button">Menu</button>
      </>
    );

    fireEvent.keyDown(screen.getByLabelText("Name"), { key: "j" });
    fireEvent.keyDown(screen.getByLabelText("Message"), { key: "k" });
    fireEvent.keyDown(screen.getByLabelText("Options"), { key: "j" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Menu" }), {
      key: "k",
    });

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("ignores shortcuts inside contenteditable regions", () => {
    render(
      <>
        <SiteKeyboardShortcuts />
        <div contentEditable suppressContentEditableWarning>
          <span data-testid="editable-child">Draft</span>
        </div>
      </>
    );

    fireEvent.keyDown(screen.getByTestId("editable-child"), { key: "j" });

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("uses the focused element when a keydown starts at the document", () => {
    render(
      <>
        <SiteKeyboardShortcuts />
        <input aria-label="Focused input" />
      </>
    );

    screen.getByLabelText("Focused input").focus();
    fireEvent.keyDown(document, { key: "j" });

    expect(scrollBy).not.toHaveBeenCalled();
  });
});
