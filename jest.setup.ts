// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

if (!window.PointerEvent) {
  class TestPointerEvent extends MouseEvent {
    readonly pointerId: number;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }

  Object.defineProperty(window, "PointerEvent", {
    writable: true,
    value: TestPointerEvent,
  });
}

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

if (!window.performance.mark) {
  // `@next/third-parties` records feature usage on mount, but JSDOM doesn't
  // implement `performance.mark`, so layout tests need a lightweight shim.
  Object.defineProperty(window.performance, "mark", {
    writable: true,
    value: jest.fn(),
  });
}

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  writable: true,
  value: jest.fn().mockImplementation((contextType: string) => {
    if (contextType !== "2d") {
      return null;
    }

    return {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      fillRect: jest.fn(),
      getImageData: jest.fn(),
      imageSmoothingEnabled: false,
      putImageData: jest.fn(),
      setTransform: jest.fn(),
    };
  }),
});
