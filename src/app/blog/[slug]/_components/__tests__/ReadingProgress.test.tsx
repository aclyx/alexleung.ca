import { act, render } from "@testing-library/react";

import { calculateReadingProgress, ReadingProgress } from "../ReadingProgress";

function rectangle(top: number, bottom: number): DOMRect {
  return {
    bottom,
    height: bottom - top,
    left: 0,
    right: 100,
    toJSON: () => ({}),
    top,
    width: 100,
    x: 0,
    y: top,
  };
}

describe("calculateReadingProgress", () => {
  it("clamps progress between the measured start and end positions", () => {
    expect(calculateReadingProgress(50, 100, 300)).toBe(0);
    expect(calculateReadingProgress(200, 100, 300)).toBe(0.5);
    expect(calculateReadingProgress(350, 100, 300)).toBe(1);
  });

  it("returns null when the reading span cannot fill a viewport", () => {
    expect(calculateReadingProgress(100, 200, 200)).toBeNull();
    expect(calculateReadingProgress(100, 300, 200)).toBeNull();
  });
});

describe("ReadingProgress", () => {
  let animationFrames: FrameRequestCallback[];
  const originalInnerHeight = window.innerHeight;
  const originalScrollY = window.scrollY;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;

  beforeEach(() => {
    animationFrames = [];
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });
    window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    window.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: originalScrollY,
    });
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    jest.restoreAllMocks();
  });

  it("tracks from the title to the end of prose without React scroll state", () => {
    const { container } = render(
      <>
        <header className="fixed" />
        <h1 id="post-title">Post title</h1>
        <article>
          <div className="prose">Post body</div>
        </article>
        <ReadingProgress startId="post-title" endSelector="article .prose" />
      </>
    );

    const header = container.querySelector("header")!;
    const title = container.querySelector("h1")!;
    const prose = container.querySelector<HTMLElement>(".prose")!;
    const progress = container.querySelector<HTMLElement>(
      "[data-reading-progress]"
    )!;

    header.getBoundingClientRect = jest.fn(() => rectangle(0, 68));
    title.getBoundingClientRect = jest.fn(() => rectangle(168, 210));
    prose.getBoundingClientRect = jest.fn(() => rectangle(300, 1100));

    act(() => {
      animationFrames.shift()?.(0);
    });

    expect(progress).not.toHaveAttribute("hidden");
    expect(progress).toHaveStyle({ transform: "scaleX(0)" });

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 350,
      writable: true,
    });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      animationFrames.shift()?.(0);
    });

    expect(progress).toHaveStyle({ transform: "scaleX(0.5)" });
  });

  it("uses CSS to hide the progress line when reduced motion is requested", () => {
    const { container } = render(
      <ReadingProgress startId="post-title" endSelector="article .prose" />
    );

    expect(container.querySelector("[data-reading-progress]")).toHaveClass(
      "motion-reduce:hidden"
    );
  });
});
