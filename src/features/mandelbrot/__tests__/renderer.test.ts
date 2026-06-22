import Decimal from "decimal.js";

import {
  detectWebGpuAvailability,
  renderMandelbrotWithWebGpu,
} from "@/features/mandelbrot/gpu";
import {
  renderMandelbrotWithStrategy,
  shouldAttemptWebGpu,
  toSafePixelCoordinateNumber,
} from "@/features/mandelbrot/renderer";
import { RenderRequest } from "@/features/mandelbrot/types";
import { configurePrecisionForWidth } from "@/features/mandelbrot/viewport";

jest.mock("@/features/mandelbrot/gpu", () => ({
  ...jest.requireActual("@/features/mandelbrot/gpu"),
  detectWebGpuAvailability: jest.fn(),
  renderMandelbrotWithWebGpu: jest.fn(),
}));

const mockedDetectWebGpuAvailability = jest.mocked(detectWebGpuAvailability);
const mockedRenderMandelbrotWithWebGpu = jest.mocked(
  renderMandelbrotWithWebGpu
);

function createRenderRequest(): RenderRequest {
  return {
    viewport: {
      centerX: new Decimal(-0.75),
      centerY: new Decimal(0),
      width: new Decimal(3),
      height: new Decimal(2),
    },
    size: {
      width: 6,
      height: 4,
    },
    settings: {
      maxIterations: 32,
      paletteId: "oceanic",
      coloringMode: "smooth",
      resolutionScale: 1,
      renderBackendPreference: "auto",
    },
    onChunk: jest.fn(),
    onProgress: jest.fn(),
  };
}

describe("renderMandelbrotWithStrategy", () => {
  beforeEach(() => {
    mockedDetectWebGpuAvailability.mockReset();
    mockedRenderMandelbrotWithWebGpu.mockReset();
  });

  it("uses the WebGPU backend in auto mode when the viewport stays within the float32 cutoff", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: true,
    });
    mockedRenderMandelbrotWithWebGpu.mockResolvedValue({
      completed: true,
      rendered: true,
    });

    const request = createRenderRequest();
    const result = await renderMandelbrotWithStrategy(request);

    expect(result).toEqual({
      completed: true,
      backend: "webgpu",
      gpuFallbackReason: undefined,
    });
  });

  it("falls back to the CPU renderer in auto mode when WebGPU is unavailable", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: false,
      reason: "No compatible WebGPU adapter was found.",
    });

    const request = createRenderRequest();
    const result = await renderMandelbrotWithStrategy(request);

    expect(result.backend).toBe("cpu");
    expect(result.completed).toBe(true);
    expect(result.gpuFallbackReason).toBe(
      "No compatible WebGPU adapter was found."
    );
    expect(request.onChunk).toHaveBeenCalled();
  });

  it("falls back to the CPU renderer when auto mode hits a WebGPU failure mid-render", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: true,
    });
    mockedRenderMandelbrotWithWebGpu.mockResolvedValue({
      completed: false,
      rendered: false,
      fallbackReason: "WebGPU device was lost.",
    });

    const request = createRenderRequest();
    const result = await renderMandelbrotWithStrategy(request);

    expect(result.backend).toBe("cpu");
    expect(result.completed).toBe(true);
    expect(result.gpuFallbackReason).toBe("WebGPU device was lost.");
    expect(request.onChunk).toHaveBeenCalled();
  });

  it("does not fall back to CPU after an aborted GPU render has already started", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: true,
    });
    mockedRenderMandelbrotWithWebGpu.mockResolvedValue({
      completed: false,
      rendered: true,
    });

    const abortController = new AbortController();
    const request = createRenderRequest();

    abortController.abort();
    request.signal = abortController.signal;

    const result = await renderMandelbrotWithStrategy(request);

    expect(result).toEqual({
      completed: false,
      backend: "webgpu",
      gpuFallbackReason: undefined,
    });
    expect(request.onChunk).not.toHaveBeenCalled();
  });

  it("uses the CPU renderer directly in auto mode once the float32 cutoff is exceeded", async () => {
    const request = createRenderRequest();

    request.viewport.width = new Decimal("1e-7");
    request.viewport.height = new Decimal("6.666666666666667e-8");

    expect(shouldAttemptWebGpu(request, "auto")).toBe(false);

    const result = await renderMandelbrotWithStrategy(request, "auto");

    expect(result.backend).toBe("cpu");
    expect(result.completed).toBe(true);
    expect(mockedDetectWebGpuAvailability).not.toHaveBeenCalled();
    expect(mockedRenderMandelbrotWithWebGpu).not.toHaveBeenCalled();
    expect(request.onChunk).toHaveBeenCalled();
  });

  it("uses the CPU renderer directly when CPU is explicitly selected", async () => {
    const request = createRenderRequest();
    request.settings.renderBackendPreference = "cpu";

    const result = await renderMandelbrotWithStrategy(request, "cpu");

    expect(result.backend).toBe("cpu");
    expect(result.completed).toBe(true);
    expect(mockedDetectWebGpuAvailability).not.toHaveBeenCalled();
    expect(mockedRenderMandelbrotWithWebGpu).not.toHaveBeenCalled();
  });

  it("still attempts WebGPU when WebGPU is explicitly selected beyond the auto cutoff", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: true,
    });
    mockedRenderMandelbrotWithWebGpu.mockResolvedValue({
      completed: true,
      rendered: true,
    });

    const request = createRenderRequest();

    request.viewport.width = new Decimal("1e-7");
    request.viewport.height = new Decimal("6.666666666666667e-8");
    request.settings.renderBackendPreference = "webgpu";

    expect(shouldAttemptWebGpu(request, "webgpu")).toBe(true);

    const result = await renderMandelbrotWithStrategy(request, "webgpu");

    expect(result.backend).toBe("webgpu");
    expect(result.completed).toBe(true);
    expect(mockedDetectWebGpuAvailability).toHaveBeenCalled();
    expect(mockedRenderMandelbrotWithWebGpu).toHaveBeenCalledWith(request);
  });
});

describe("toSafePixelCoordinateNumber", () => {
  it("keeps continuation coordinates when numeric rounding is small relative to the pixel step", () => {
    const step = new Decimal("1e-6");

    configurePrecisionForWidth(step);

    expect(toSafePixelCoordinateNumber(new Decimal("0.125"), step)).toBe(0.125);
  });

  it("rejects continuation coordinates when numeric rounding swamps the pixel step", () => {
    const step = new Decimal("1e-32");
    const coordinate = new Decimal("-0.838782074550394572901608663741").add(
      step
    );

    configurePrecisionForWidth(step);

    expect(toSafePixelCoordinateNumber(coordinate, step)).toBeNull();
  });
});
