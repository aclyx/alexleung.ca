import { fireEvent, render, screen } from "@testing-library/react";

import {
  SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY,
  SiteKeyboardShortcutToggle,
} from "../SiteKeyboardShortcutToggle";

function renderShortcutToggle() {
  return render(
    <SiteKeyboardShortcutToggle>
      <span aria-hidden="true" />
    </SiteKeyboardShortcutToggle>
  );
}

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
    window.localStorage.clear();
  });

  it("scrolls down with j and up with k", () => {
    renderShortcutToggle();

    fireEvent.keyDown(document, { key: "j" });
    fireEvent.keyDown(document, { key: "k" });

    expect(scrollBy).toHaveBeenNthCalledWith(1, { top: 280, left: 0 });
    expect(scrollBy).toHaveBeenNthCalledWith(2, { top: -280, left: 0 });
  });

  it("ignores shortcuts when modifier keys are held", () => {
    renderShortcutToggle();

    fireEvent.keyDown(document, { key: "j", metaKey: true });
    fireEvent.keyDown(document, { key: "k", shiftKey: true });

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("ignores shortcuts from form controls and buttons", () => {
    render(
      <>
        <SiteKeyboardShortcutToggle>
          <span aria-hidden="true" />
        </SiteKeyboardShortcutToggle>
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
        <SiteKeyboardShortcutToggle>
          <span aria-hidden="true" />
        </SiteKeyboardShortcutToggle>
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
        <SiteKeyboardShortcutToggle>
          <span aria-hidden="true" />
        </SiteKeyboardShortcutToggle>
        <input aria-label="Focused input" />
      </>
    );

    screen.getByLabelText("Focused input").focus();
    fireEvent.keyDown(document, { key: "j" });

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("honors the persistent opt-out", () => {
    window.localStorage.setItem(SITE_KEYBOARD_SHORTCUTS_STORAGE_KEY, "off");

    renderShortcutToggle();

    fireEvent.keyDown(document, { key: "j" });

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("can be disabled and re-enabled from the footer toggle", () => {
    render(
      <SiteKeyboardShortcutToggle>
        <span aria-hidden="true" />
      </SiteKeyboardShortcutToggle>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Disable j/k shortcuts" })
    );
    fireEvent.keyDown(document, { key: "j" });

    expect(scrollBy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Enable j/k shortcuts" })
    ).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(
      screen.getByRole("button", { name: "Enable j/k shortcuts" })
    );
    fireEvent.keyDown(document, { key: "j" });

    expect(scrollBy).toHaveBeenCalledWith({ top: 280, left: 0 });
    expect(
      screen.getByRole("button", { name: "Disable j/k shortcuts" })
    ).toHaveAttribute("aria-pressed", "true");
  });
});
