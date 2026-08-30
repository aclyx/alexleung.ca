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
      resolutionScale: 1,
      renderBackendPreference: "auto",
    },
    onChunk: jest.fn(),
  };
}

describe("renderMandelbrotWithStrategy", () => {
  beforeEach(() => {
    mockedDetectWebGpuAvailability.mockReset();
    mockedRenderMandelbrotWithWebGpu.mockReset();
  });

  it("uses WebGPU in auto mode when the viewport passes the precision guard", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: true,
    });
    mockedRenderMandelbrotWithWebGpu.mockResolvedValue({
      completed: true,
      rendered: true,
    });

    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);
    const result = await renderMandelbrotWithStrategy(
      request,
      "auto",
      renderOnCpu
    );

    expect(result).toEqual({
      completed: true,
      backend: "webgpu",
      gpuFallbackReason: undefined,
      effectiveMaxIterations: 32,
      cpuBudgetApplied: false,
    });
    expect(renderOnCpu).not.toHaveBeenCalled();
  });

  it("reports the reason when unavailable WebGPU falls back to CPU", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: false,
      reason: "No compatible WebGPU adapter was found.",
    });

    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);
    const result = await renderMandelbrotWithStrategy(
      request,
      "auto",
      renderOnCpu
    );

    expect(result).toEqual({
      completed: true,
      backend: "cpu",
      gpuFallbackReason: "No compatible WebGPU adapter was found.",
      effectiveMaxIterations: 32,
      cpuBudgetApplied: false,
    });
    expect(renderOnCpu).toHaveBeenCalledWith(request);
  });

  it("uses the injected CPU renderer after a WebGPU failure", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: true,
    });
    mockedRenderMandelbrotWithWebGpu.mockResolvedValue({
      completed: false,
      rendered: false,
      fallbackReason: "WebGPU device was lost.",
    });

    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);
    const result = await renderMandelbrotWithStrategy(
      request,
      "auto",
      renderOnCpu
    );

    expect(result).toEqual({
      completed: true,
      backend: "cpu",
      gpuFallbackReason: "WebGPU device was lost.",
      effectiveMaxIterations: 32,
      cpuBudgetApplied: false,
    });
    expect(renderOnCpu).toHaveBeenCalledWith(request);
  });

  it("does not start CPU fallback after an aborted GPU render", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({
      isAvailable: true,
    });
    mockedRenderMandelbrotWithWebGpu.mockResolvedValue({
      completed: false,
      rendered: true,
    });

    const abortController = new AbortController();
    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);

    abortController.abort();
    request.signal = abortController.signal;

    const result = await renderMandelbrotWithStrategy(
      request,
      "auto",
      renderOnCpu
    );

    expect(result).toEqual({
      completed: false,
      backend: "webgpu",
      gpuFallbackReason: undefined,
      effectiveMaxIterations: 32,
      cpuBudgetApplied: false,
    });
    expect(renderOnCpu).not.toHaveBeenCalled();
  });

  it("uses CPU directly in auto mode beyond the WebGPU precision cutoff", async () => {
    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);

    request.viewport.width = new Decimal("1e-7");
    request.viewport.height = new Decimal("6.666666666666667e-8");

    expect(shouldAttemptWebGpu(request, "auto")).toBe(false);

    const result = await renderMandelbrotWithStrategy(
      request,
      "auto",
      renderOnCpu
    );

    expect(result.backend).toBe("cpu");
    expect(result.completed).toBe(true);
    expect(mockedDetectWebGpuAvailability).not.toHaveBeenCalled();
    expect(mockedRenderMandelbrotWithWebGpu).not.toHaveBeenCalled();
    expect(renderOnCpu).toHaveBeenCalledWith(request);
  });

  it("uses CPU directly when CPU is explicitly selected", async () => {
    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);

    request.settings.renderBackendPreference = "cpu";

    const result = await renderMandelbrotWithStrategy(
      request,
      "cpu",
      renderOnCpu
    );

    expect(result.backend).toBe("cpu");
    expect(result.completed).toBe(true);
    expect(mockedDetectWebGpuAvailability).not.toHaveBeenCalled();
    expect(mockedRenderMandelbrotWithWebGpu).not.toHaveBeenCalled();
    expect(renderOnCpu).toHaveBeenCalledWith(request);
  });

  it("does not let explicit WebGPU bypass the precision guard", async () => {
    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);

    request.viewport.width = new Decimal("1e-7");
    request.viewport.height = new Decimal("6.666666666666667e-8");
    request.settings.renderBackendPreference = "webgpu";

    expect(shouldAttemptWebGpu(request, "webgpu")).toBe(false);

    const result = await renderMandelbrotWithStrategy(
      request,
      "webgpu",
      renderOnCpu
    );

    expect(result.backend).toBe("cpu");
    expect(mockedDetectWebGpuAvailability).not.toHaveBeenCalled();
    expect(mockedRenderMandelbrotWithWebGpu).not.toHaveBeenCalled();
    expect(renderOnCpu).toHaveBeenCalledWith(request);
  });

  it("caps CPU work and reports the effective iteration limit", async () => {
    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);

    request.size = { width: 1000, height: 1000 };
    request.settings = {
      ...request.settings,
      maxIterations: 4000,
      renderBackendPreference: "cpu",
    };

    const result = await renderMandelbrotWithStrategy(
      request,
      "cpu",
      renderOnCpu
    );

    expect(result).toEqual({
      completed: true,
      backend: "cpu",
      gpuFallbackReason: undefined,
      effectiveMaxIterations: 80,
      cpuBudgetApplied: true,
    });
    expect(renderOnCpu).toHaveBeenCalledWith({
      ...request,
      settings: {
        ...request.settings,
        maxIterations: 80,
      },
    });
    expect(request.settings.maxIterations).toBe(4000);
  });

  it("applies the CPU budget when a high-cost GPU frame falls back", async () => {
    mockedDetectWebGpuAvailability.mockResolvedValue({ isAvailable: true });
    mockedRenderMandelbrotWithWebGpu.mockResolvedValue({
      completed: false,
      rendered: false,
      fallbackReason: "WebGPU device was lost.",
    });

    const request = createRenderRequest();
    const renderOnCpu = jest.fn(async () => true);

    request.size = { width: 1000, height: 1000 };
    request.settings = {
      ...request.settings,
      maxIterations: 4000,
    };

    const result = await renderMandelbrotWithStrategy(
      request,
      "auto",
      renderOnCpu
    );

    expect(result.cpuBudgetApplied).toBe(true);
    expect(result.effectiveMaxIterations).toBe(80);
    expect(renderOnCpu).toHaveBeenCalledWith({
      ...request,
      settings: {
        ...request.settings,
        maxIterations: 80,
      },
    });
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
