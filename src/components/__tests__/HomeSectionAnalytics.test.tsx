import { act, render, screen } from "@testing-library/react";

import { HomeSectionAnalytics } from "../HomeSectionAnalytics";

const trackHomeSectionView = jest.fn();
const originalIntersectionObserver = globalThis.IntersectionObserver;

jest.mock("@/lib/analytics", () => ({
  trackHomeSectionView: (...args: unknown[]) => trackHomeSectionView(...args),
}));

function createEntry(
  target: Element,
  isIntersecting: boolean
): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect();

  return {
    boundingClientRect: rect,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: rect,
    isIntersecting,
    rootBounds: null,
    target,
    time: 0,
  };
}

describe("HomeSectionAnalytics", () => {
  let callback: IntersectionObserverCallback;
  let disconnect: jest.Mock;
  let observe: jest.Mock;
  let observer: IntersectionObserver;
  let unobserve: jest.Mock;

  beforeEach(() => {
    trackHomeSectionView.mockClear();
    disconnect = jest.fn();
    observe = jest.fn();
    unobserve = jest.fn();
    observer = {
      disconnect,
      observe,
      root: null,
      rootMargin: "0px",
      scrollMargin: "0px",
      takeRecords: () => [],
      thresholds: [0.25],
      unobserve,
    };

    class MockIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly scrollMargin = "0px";
      readonly thresholds = [0.25];

      constructor(nextCallback: IntersectionObserverCallback) {
        callback = nextCallback;
      }

      disconnect() {
        disconnect();
      }

      observe(target: Element) {
        observe(target);
      }

      takeRecords() {
        return [];
      }

      unobserve(target: Element) {
        unobserve(target);
      }
    }

    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: MockIntersectionObserver,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: originalIntersectionObserver,
    });
  });

  it("observes homepage sections and tracks each one once", () => {
    render(
      <>
        <HomeSectionAnalytics />
        <section id="writing">
          <h2>Writing</h2>
        </section>
        <section id="tools">
          <h2>Tools</h2>
        </section>
      </>
    );
    const writing = screen.getByText("Writing");
    const tools = screen.getByText("Tools");

    expect(observe).toHaveBeenCalledTimes(2);
    expect(observe).toHaveBeenCalledWith(writing);
    expect(observe).toHaveBeenCalledWith(tools);

    act(() => {
      callback(
        [createEntry(writing, true), createEntry(tools, false)],
        observer
      );
      callback(
        [createEntry(writing, true), createEntry(tools, true)],
        observer
      );
    });

    expect(trackHomeSectionView.mock.calls).toEqual([["writing"], ["tools"]]);
    expect(unobserve).toHaveBeenCalledTimes(2);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(
      <>
        <HomeSectionAnalytics />
        <section id="writing">Writing</section>
      </>
    );

    unmount();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
