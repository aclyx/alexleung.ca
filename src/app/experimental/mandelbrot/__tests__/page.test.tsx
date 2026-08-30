import { fireEvent, render, screen } from "@testing-library/react";

import { detectWebGpuAvailability } from "@/features/mandelbrot/gpu";
import { useMandelbrotRender } from "@/features/mandelbrot/useMandelbrotRender";

import MandelbrotPage from "../page";

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

describe("MandelbrotPage", () => {
  beforeEach(() => {
    mockedDetectWebGpuAvailability.mockReset();
    mockedDetectWebGpuAvailability.mockReturnValue(new Promise(() => {}));
    mockedUseMandelbrotRender.mockReset();
    mockedUseMandelbrotRender.mockReturnValue({
      phase: "ready",
      message: "Render complete.",
    });
  });

  it("renders the explorer shell and core controls", () => {
    render(<MandelbrotPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Mandelbrot Explorer",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo view" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
    fireEvent.click(screen.getByText("Render settings"));
    expect(screen.getByLabelText("Color palette")).toBeVisible();
    expect(screen.getByText("Coordinates")).toBeInTheDocument();
    expect(screen.queryByText("Pan controls")).not.toBeInTheDocument();
    expect(screen.queryByText("Advanced rendering")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1x");
    expect(screen.getByRole("status")).not.toHaveTextContent("Rendered at");
    expect(screen.queryByText("Point inspector")).not.toBeInTheDocument();
    expect(screen.queryByText("Implementation notes")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Box zoom mode" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Redo" })
    ).not.toBeInTheDocument();
  });
});
