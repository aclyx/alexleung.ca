import {
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { PreciseViewport } from "@/features/mandelbrot/types";
import { useMandelbrotRender } from "@/features/mandelbrot/useMandelbrotRender";
import { createDefaultViewport } from "@/features/mandelbrot/viewport";

import { MandelbrotCanvas } from "../MandelbrotCanvas";

jest.mock("@/features/mandelbrot/useMandelbrotRender", () => ({
  useMandelbrotRender: jest.fn(),
}));

const mockedUseMandelbrotRender = jest.mocked(useMandelbrotRender);
const size = { width: 960, height: 600 };

function firePointerEvent(
  element: HTMLElement,
  type: "pointerdown" | "pointermove" | "pointerup",
  {
    button = 0,
    clientX,
    clientY,
    pointerId,
  }: {
    button?: number;
    clientX: number;
    clientY: number;
    pointerId: number;
  }
) {
  const eventInit = {
    button,
    clientX,
    clientY,
    pointerId,
  };

  if (type === "pointerdown") {
    fireEvent.pointerDown(element, eventInit);
  } else if (type === "pointermove") {
    fireEvent.pointerMove(element, eventInit);
  } else {
    fireEvent.pointerUp(element, eventInit);
  }
}

function mockCanvasBounds(canvas: HTMLElement) {
  jest.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    bottom: 600,
    height: 600,
    left: 0,
    right: 960,
    top: 0,
    width: 960,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

function renderCanvas({ canGoBack = false } = {}) {
  const viewport = createDefaultViewport(size);
  const onCanvasSizeChange = jest.fn();
  const onPreviewViewport = jest.fn<void, [PreciseViewport | null]>();
  const onCommitViewport = jest.fn<void, [PreciseViewport]>();
  const onBack = jest.fn();
  const onZoomIn = jest.fn();
  const onZoomOut = jest.fn();
  const onReset = jest.fn();

  render(
    <MandelbrotCanvas
      viewport={viewport}
      settings={{
        maxIterations: 180,
        paletteId: "ember",
        resolutionScale: 0.5,
        renderBackendPreference: "auto",
      }}
      canGoBack={canGoBack}
      magnificationLabel="1x"
      onCanvasSizeChange={onCanvasSizeChange}
      onPreviewViewport={onPreviewViewport}
      onCommitViewport={onCommitViewport}
      onBack={onBack}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onReset={onReset}
    />
  );

  return {
    viewport,
    onCanvasSizeChange,
    onPreviewViewport,
    onCommitViewport,
    onBack,
    onZoomIn,
    onZoomOut,
    onReset,
  };
}

describe("MandelbrotCanvas", () => {
  beforeEach(() => {
    mockedUseMandelbrotRender.mockReset();
    mockedUseMandelbrotRender.mockReturnValue({
      phase: "ready",
      message: "Render complete.",
    });
  });

  it("exposes focusable keyboard controls and a polite render status", () => {
    const { viewport, onCommitViewport, onReset } = renderCanvas();
    const canvas = screen.getByLabelText(/Interactive Mandelbrot set/i);
    const status = screen.getByRole("status");

    expect(canvas).toHaveAttribute("tabindex", "0");
    expect(canvas).toHaveAttribute(
      "aria-describedby",
      "mandelbrot-canvas-instructions mandelbrot-render-status"
    );
    expect(canvas).toHaveClass("focus-visible:ring-paper");
    expect(canvas).not.toHaveClass("focus-visible:ring-cyan-200");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Render complete.");
    expect(status).toHaveTextContent("1x");
    expect(status).not.toHaveTextContent("Rendered at");
    expect(
      screen.getByText("Click or tap to zoom. Drag to pan.")
    ).toBeInTheDocument();

    fireEvent.keyDown(canvas, { key: "ArrowLeft" });

    expect(onCommitViewport).toHaveBeenCalledTimes(1);
    expect(onCommitViewport.mock.calls[0][0].centerX.lt(viewport.centerX)).toBe(
      true
    );

    fireEvent.keyDown(canvas, { key: "+" });

    expect(onCommitViewport).toHaveBeenCalledTimes(2);
    expect(onCommitViewport.mock.calls[1][0].width.eq("1.75")).toBe(true);

    fireEvent.keyDown(canvas, { key: "0" });

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("exposes one compact toolbar with navigation controls", () => {
    const { onBack, onReset, onZoomIn, onZoomOut } = renderCanvas({
      canGoBack: true,
    });

    expect(screen.getAllByRole("button", { name: "Undo view" })).toHaveLength(
      1
    );
    expect(screen.getAllByRole("button", { name: "Zoom in" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Zoom out" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Reset" })).toHaveLength(1);
    expect(screen.queryByLabelText("Color palette")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo view" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("zooms at the selected point when a pointer clicks without dragging", () => {
    const { viewport, onCommitViewport, onPreviewViewport } = renderCanvas();
    const canvas = screen.getByLabelText(/Interactive Mandelbrot set/i);

    mockCanvasBounds(canvas);
    onPreviewViewport.mockClear();
    firePointerEvent(canvas, "pointerdown", {
      button: 0,
      pointerId: 23,
      clientX: 240,
      clientY: 180,
    });
    firePointerEvent(canvas, "pointerup", {
      pointerId: 23,
      clientX: 240,
      clientY: 180,
    });

    expect(onCommitViewport).toHaveBeenCalledTimes(1);
    expect(
      onCommitViewport.mock.calls[0][0].width.eq(viewport.width.mul(0.5))
    ).toBe(true);
    expect(onPreviewViewport).toHaveBeenLastCalledWith(null);
  });

  it("uses the measured canvas width for narrow-screen interactions", async () => {
    const boundsSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        bottom: 320,
        height: 320,
        left: 0,
        right: 278,
        top: 0,
        width: 278,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

    try {
      const { viewport, onCanvasSizeChange, onCommitViewport } = renderCanvas();
      const canvas = screen.getByLabelText(/Interactive Mandelbrot set/i);

      await waitFor(() => {
        expect(onCanvasSizeChange).toHaveBeenLastCalledWith({
          width: 278,
          height: 320,
        });
        expect(mockedUseMandelbrotRender.mock.calls.at(-1)?.[0].size).toEqual({
          width: 278,
          height: 320,
        });
      });

      firePointerEvent(canvas, "pointerdown", {
        button: 0,
        pointerId: 31,
        clientX: 139,
        clientY: 160,
      });
      firePointerEvent(canvas, "pointerup", {
        pointerId: 31,
        clientX: 139,
        clientY: 160,
      });

      expect(onCommitViewport).toHaveBeenCalledTimes(1);
      expect(
        onCommitViewport.mock.calls[0][0].centerX.eq(viewport.centerX)
      ).toBe(true);
      expect(
        onCommitViewport.mock.calls[0][0].centerY.eq(viewport.centerY)
      ).toBe(true);

      onCommitViewport.mockClear();
      firePointerEvent(canvas, "pointerdown", {
        button: 0,
        pointerId: 32,
        clientX: 0,
        clientY: 160,
      });
      firePointerEvent(canvas, "pointerup", {
        pointerId: 32,
        clientX: 139,
        clientY: 160,
      });

      expect(onCommitViewport).toHaveBeenCalledTimes(1);
      expect(
        onCommitViewport.mock.calls[0][0].centerX.eq(
          viewport.centerX.sub(viewport.width.mul(0.5))
        )
      ).toBe(true);
    } finally {
      boundsSpy.mockRestore();
    }
  });

  it("renders pan previews, ignores unrelated pointers, and commits the owner pointer", () => {
    const { viewport, onCommitViewport, onPreviewViewport } = renderCanvas();
    const canvas = screen.getByLabelText(/Interactive Mandelbrot set/i);
    const renderedLayer = screen.getByTestId(
      "mandelbrot-render-canvas"
    ).parentElement;

    mockCanvasBounds(canvas);
    onPreviewViewport.mockClear();
    firePointerEvent(canvas, "pointerdown", {
      button: 0,
      pointerId: 41,
      clientX: 200,
      clientY: 180,
    });
    firePointerEvent(canvas, "pointermove", {
      pointerId: 41,
      clientX: 260,
      clientY: 180,
    });

    expect(onPreviewViewport).toHaveBeenCalledTimes(1);
    const firstPreview = onPreviewViewport.mock.calls[0][0];
    expect(firstPreview).not.toBeNull();
    expect(firstPreview?.centerX.lt(viewport.centerX)).toBe(true);
    expect(renderedLayer?.style.transform).toBe("");
    expect(onCommitViewport).not.toHaveBeenCalled();

    firePointerEvent(canvas, "pointerup", {
      pointerId: 99,
      clientX: 300,
      clientY: 180,
    });
    expect(onCommitViewport).not.toHaveBeenCalled();

    firePointerEvent(canvas, "pointermove", {
      pointerId: 41,
      clientX: 320,
      clientY: 180,
    });
    expect(onPreviewViewport).toHaveBeenCalledTimes(2);

    firePointerEvent(canvas, "pointerup", {
      pointerId: 41,
      clientX: 340,
      clientY: 180,
    });

    expect(onCommitViewport).toHaveBeenCalledTimes(1);
    expect(onCommitViewport.mock.calls[0][0].centerX.lt(viewport.centerX)).toBe(
      true
    );
    expect(onPreviewViewport).toHaveBeenLastCalledWith(null);
  });

  it("treats a far pointerup without an intermediate move as a pan", () => {
    const { viewport, onCommitViewport, onPreviewViewport } = renderCanvas();
    const canvas = screen.getByLabelText(/Interactive Mandelbrot set/i);

    mockCanvasBounds(canvas);
    onPreviewViewport.mockClear();
    firePointerEvent(canvas, "pointerdown", {
      button: 0,
      pointerId: 57,
      clientX: 200,
      clientY: 180,
    });
    firePointerEvent(canvas, "pointerup", {
      pointerId: 57,
      clientX: 320,
      clientY: 180,
    });

    expect(onCommitViewport).toHaveBeenCalledTimes(1);
    expect(onCommitViewport.mock.calls[0][0].width.eq(viewport.width)).toBe(
      true
    );
    expect(onCommitViewport.mock.calls[0][0].centerX.lt(viewport.centerX)).toBe(
      true
    );
    expect(onPreviewViewport).toHaveBeenLastCalledWith(null);
  });

  it("commits the latest pan once when a moved pointer loses capture", () => {
    const { onCommitViewport, onPreviewViewport } = renderCanvas();
    const canvas = screen.getByLabelText(/Interactive Mandelbrot set/i);

    mockCanvasBounds(canvas);
    onPreviewViewport.mockClear();
    firePointerEvent(canvas, "pointerdown", {
      button: 0,
      pointerId: 63,
      clientX: 200,
      clientY: 180,
    });
    firePointerEvent(canvas, "pointermove", {
      pointerId: 63,
      clientX: 320,
      clientY: 220,
    });

    const latestPreview = onPreviewViewport.mock.calls.at(-1)?.[0];

    if (!latestPreview) {
      throw new Error("Expected a pan preview before pointer capture was lost");
    }

    fireEvent.pointerCancel(canvas, {
      pointerId: 63,
      clientX: 320,
      clientY: 220,
    });
    fireEvent.lostPointerCapture(canvas, {
      pointerId: 63,
      clientX: 320,
      clientY: 220,
    });

    expect(onCommitViewport).toHaveBeenCalledTimes(1);
    expect(
      onCommitViewport.mock.calls[0][0].centerX.eq(latestPreview.centerX)
    ).toBe(true);
    expect(
      onCommitViewport.mock.calls[0][0].centerY.eq(latestPreview.centerY)
    ).toBe(true);
    expect(onPreviewViewport).toHaveBeenLastCalledWith(null);
  });

  it("leaves ordinary and modified wheel gestures untouched", () => {
    const { onCommitViewport } = renderCanvas();
    const canvas = screen.getByLabelText(/Interactive Mandelbrot set/i);
    const ordinaryWheelEvent = createEvent.wheel(canvas, {
      cancelable: true,
      deltaY: -80,
      clientX: 200,
      clientY: 120,
    });
    const modifiedWheelEvent = createEvent.wheel(canvas, {
      cancelable: true,
      ctrlKey: true,
      deltaY: -80,
      clientX: 200,
      clientY: 120,
    });

    fireEvent(canvas, ordinaryWheelEvent);
    fireEvent(canvas, modifiedWheelEvent);

    expect(ordinaryWheelEvent.defaultPrevented).toBe(false);
    expect(modifiedWheelEvent.defaultPrevented).toBe(false);
    expect(onCommitViewport).not.toHaveBeenCalled();
  });

  it("uses concise rendering status copy", () => {
    mockedUseMandelbrotRender.mockReturnValue({
      phase: "refining",
      message: "Rendering…",
    });
    renderCanvas();

    expect(screen.getByRole("status")).toHaveTextContent("Rendering…");
    expect(screen.getByRole("status")).not.toHaveTextContent("1x");
  });

  it("discloses an effective CPU iteration limit without changing the request", () => {
    mockedUseMandelbrotRender.mockReturnValue({
      phase: "ready",
      message: "Render complete.",
      backend: "cpu",
      requestedMaxIterations: 4000,
      effectiveMaxIterations: 555,
      cpuBudgetApplied: true,
    });
    renderCanvas();

    expect(screen.getByRole("status")).toHaveTextContent(
      "1x · CPU render used 555 of 4,000 requested iterations."
    );
  });
});
