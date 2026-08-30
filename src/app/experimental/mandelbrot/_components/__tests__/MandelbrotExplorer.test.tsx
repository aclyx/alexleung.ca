import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { detectWebGpuAvailability } from "@/features/mandelbrot/gpu";
import { useMandelbrotRender } from "@/features/mandelbrot/useMandelbrotRender";

import { MandelbrotExplorer } from "../MandelbrotExplorer";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/experimental/mandelbrot/"),
}));

jest.mock("@/features/mandelbrot/gpu", () => ({
  ...jest.requireActual("@/features/mandelbrot/gpu"),
  detectWebGpuAvailability: jest.fn(),
}));

jest.mock("@/features/mandelbrot/useMandelbrotRender", () => ({
  useMandelbrotRender: jest.fn(),
}));

const mockedDetectWebGpuAvailability = jest.mocked(detectWebGpuAvailability);
const mockedUseMandelbrotRender = jest.mocked(useMandelbrotRender);

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

function getDisclosure(name: string): HTMLDetailsElement {
  const details = screen.getByText(name, { exact: true }).closest("details");

  if (!(details instanceof HTMLDetailsElement)) {
    throw new Error(`Could not find the ${name} disclosure`);
  }

  return details;
}

function openDisclosure(name: string) {
  const details = getDisclosure(name);
  const summary = details.querySelector("summary");

  if (!summary) {
    throw new Error(`Could not find the ${name} summary`);
  }

  expect(details.open).toBe(false);
  fireEvent.click(summary);
  expect(details.open).toBe(true);
}

async function renderExplorer() {
  render(<MandelbrotExplorer />);

  await act(async () => {
    await Promise.resolve();
  });
}

describe("MandelbrotExplorer", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/experimental/mandelbrot/");
    mockedDetectWebGpuAvailability.mockReset();
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: false,
    });
    mockedUseMandelbrotRender.mockReset();
    mockedUseMandelbrotRender.mockReturnValue({
      phase: "ready",
      message: "Render complete.",
    });
  });

  it("renders one compact toolbar and two closed disclosures", async () => {
    await renderExplorer();

    expect(
      screen.getByLabelText(/Interactive Mandelbrot set/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Render complete.");
    expect(screen.getByRole("status")).toHaveTextContent("1x");

    expect(screen.getAllByRole("button", { name: "Undo view" })).toHaveLength(
      1
    );
    expect(screen.getByRole("button", { name: "Undo view" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Zoom in" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Zoom out" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Reset" })).toHaveLength(1);
    expect(getDisclosure("Render settings").open).toBe(false);
    expect(getDisclosure("Coordinates").open).toBe(false);
    expect(screen.queryByText("Pan controls")).not.toBeInTheDocument();
    expect(screen.queryByText("Advanced rendering")).not.toBeInTheDocument();
    expect(screen.queryByText("View details")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("viewport-magnification")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Box zoom mode" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Redo" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Point inspector")).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation notes")).not.toBeInTheDocument();
    expect(screen.queryByText("View height")).not.toBeInTheDocument();
  });

  it("uses higher-quality defaults when WebGPU is available", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: true,
    });

    await renderExplorer();
    openDisclosure("Render settings");

    await waitFor(() => {
      expect(screen.getByLabelText(/Maximum iterations/i)).toHaveValue(2000);
    });
    expect(mockedUseMandelbrotRender.mock.calls.at(-1)?.[0].settings).toEqual(
      expect.objectContaining({
        maxIterations: 2000,
        resolutionScale: 1,
        renderBackendPreference: "auto",
      })
    );
    expect(screen.queryByLabelText(/Render backend/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Render quality/i)).not.toBeInTheDocument();
  });

  it("updates coordinates with zoom and accessible move controls", async () => {
    await renderExplorer();
    openDisclosure("Coordinates");

    const initialWidth = screen.getByTestId("viewport-width").textContent;
    const initialCenterX = screen.getByTestId("viewport-center-x").textContent;

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    expect(screen.getByTestId("viewport-width").textContent).not.toBe(
      initialWidth
    );
    expect(screen.getByRole("status")).toHaveTextContent("2x");

    fireEvent.click(screen.getByRole("button", { name: "Pan left" }));

    expect(screen.getByTestId("viewport-center-x").textContent).not.toBe(
      initialCenterX
    );
  });

  it("renders a live viewport preview while a pointer pan is active", async () => {
    await renderExplorer();
    openDisclosure("Coordinates");

    const canvas = screen.getByLabelText(/Interactive Mandelbrot set/i);
    const initialCenterX = screen.getByTestId("viewport-center-x").textContent;
    const initialRenderViewport =
      mockedUseMandelbrotRender.mock.calls.at(-1)?.[0].viewport;

    mockCanvasBounds(canvas);
    firePointerEvent(canvas, "pointerdown", {
      button: 0,
      pointerId: 17,
      clientX: 200,
      clientY: 180,
    });
    firePointerEvent(canvas, "pointermove", {
      pointerId: 17,
      clientX: 280,
      clientY: 180,
    });

    expect(screen.getByTestId("viewport-center-x").textContent).not.toBe(
      initialCenterX
    );
    const previewRenderViewport =
      mockedUseMandelbrotRender.mock.calls.at(-1)?.[0].viewport;
    expect(
      previewRenderViewport?.centerX.eq(initialRenderViewport?.centerX ?? 0)
    ).toBe(false);

    firePointerEvent(canvas, "pointerup", {
      pointerId: 17,
      clientX: 300,
      clientY: 180,
    });

    expect(screen.getByRole("button", { name: "Undo view" })).toBeEnabled();
  });

  it("supports undo and reset without exposing redo", async () => {
    await renderExplorer();
    openDisclosure("Coordinates");

    const initialWidth = screen.getByTestId("viewport-width").textContent;
    const undoButton = screen.getByRole("button", { name: "Undo view" });

    expect(undoButton).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByTestId("viewport-width").textContent).not.toBe(
      initialWidth
    );
    expect(undoButton).toBeEnabled();

    fireEvent.click(undoButton);
    expect(screen.getByTestId("viewport-width").textContent).toBe(initialWidth);

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByTestId("viewport-width").textContent).toBe(initialWidth);
    expect(
      screen.queryByRole("button", { name: "Redo" })
    ).not.toBeInTheDocument();
  });

  it("updates render settings without mutating the URL", async () => {
    await renderExplorer();

    openDisclosure("Render settings");
    fireEvent.change(screen.getByLabelText("Color palette"), {
      target: { value: "glacier" },
    });
    fireEvent.change(screen.getByLabelText(/Maximum iterations/i), {
      target: { value: "320" },
    });

    expect(screen.getByLabelText("Color palette")).toHaveValue("glacier");
    expect(screen.getByLabelText(/Maximum iterations/i)).toHaveValue(320);
    expect(screen.queryByLabelText(/Render backend/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Coloring mode/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Render quality/i)).not.toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("loads a strict deep-link query at the supported zoom floor", async () => {
    window.history.replaceState(
      null,
      "",
      "/experimental/mandelbrot/?cx=-0.743643887037151&cy=0.13182590420533&w=1e-40&iter=300&quality=0.75&palette=glacier&mode=bands&backend=cpu"
    );

    await renderExplorer();
    openDisclosure("Coordinates");
    openDisclosure("Render settings");

    expect(screen.getByRole("status")).toHaveTextContent("3.5e+40x");
    expect(screen.getByLabelText(/Maximum iterations/i)).toHaveValue(300);
    expect(screen.getByLabelText("Color palette")).toHaveValue("glacier");
    expect(mockedUseMandelbrotRender.mock.calls.at(-1)?.[0].settings).toEqual({
      maxIterations: 300,
      paletteId: "glacier",
      resolutionScale: 0.75,
      renderBackendPreference: "cpu",
    });
    expect(screen.queryByLabelText(/Render backend/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Render quality/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Coloring mode/i)).not.toBeInTheDocument();
  });

  it("falls back to the default view for an out-of-range deep link", async () => {
    window.history.replaceState(
      null,
      "",
      "/experimental/mandelbrot/?cx=-0.75&cy=0&w=1e-41"
    );

    await renderExplorer();
    openDisclosure("Coordinates");

    expect(screen.getByTestId("viewport-width")).toHaveTextContent("3.5");
    expect(screen.getByRole("status")).toHaveTextContent("1x");
  });
});
