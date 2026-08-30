import { act, renderHook, waitFor } from "@testing-library/react";

import {
  renderMandelbrotWithStrategy,
  shouldAttemptWebGpu,
} from "@/features/mandelbrot/renderer";
import { MandelbrotSettings } from "@/features/mandelbrot/types";
import { useMandelbrotRender } from "@/features/mandelbrot/useMandelbrotRender";
import { createDefaultViewport } from "@/features/mandelbrot/viewport";

jest.mock("@/features/mandelbrot/renderer", () => ({
  ...jest.requireActual("@/features/mandelbrot/renderer"),
  renderMandelbrotWithStrategy: jest.fn(),
  shouldAttemptWebGpu: jest.fn(),
}));

const mockedRenderMandelbrotWithStrategy = jest.mocked(
  renderMandelbrotWithStrategy
);
const mockedShouldAttemptWebGpu = jest.mocked(shouldAttemptWebGpu);

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function createCanvasContext() {
  return {
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    fillStyle: "",
    imageSmoothingEnabled: false,
    putImageData: jest.fn(),
  };
}

describe("useMandelbrotRender", () => {
  beforeEach(() => {
    mockedRenderMandelbrotWithStrategy.mockReset();
    mockedShouldAttemptWebGpu.mockReset();
  });

  it("ignores chunks from a superseded render during rapid viewport changes", async () => {
    const size = { width: 20, height: 12 };
    const initialViewport = createDefaultViewport(size);
    const firstPanViewport = {
      ...initialViewport,
      centerX: initialViewport.centerX.add("0.1"),
    };
    const secondPanViewport = {
      ...initialViewport,
      centerX: initialViewport.centerX.add("0.2"),
    };
    const settings: MandelbrotSettings = {
      maxIterations: 32,
      paletteId: "oceanic",
      resolutionScale: 0.2,
      renderBackendPreference: "cpu",
    };
    const cpuCanvas = document.createElement("canvas");
    const gpuCanvas = document.createElement("canvas");
    const cpuContext = createCanvasContext();
    const cpuCanvasRef = { current: cpuCanvas };
    const gpuCanvasRef = { current: gpuCanvas };
    const firstPanFrame =
      createDeferred<
        Awaited<ReturnType<typeof renderMandelbrotWithStrategy>>
      >();
    const secondPanFrame =
      createDeferred<
        Awaited<ReturnType<typeof renderMandelbrotWithStrategy>>
      >();
    const completedCpuFrame: Awaited<
      ReturnType<typeof renderMandelbrotWithStrategy>
    > = {
      completed: true,
      backend: "cpu",
      gpuFallbackReason: undefined,
      effectiveMaxIterations: 32,
      cpuBudgetApplied: false,
    };

    Object.defineProperty(cpuCanvas, "getContext", {
      configurable: true,
      value: jest.fn((contextType: string) =>
        contextType === "2d" ? cpuContext : null
      ),
    });

    mockedShouldAttemptWebGpu.mockReturnValue(false);
    mockedRenderMandelbrotWithStrategy
      .mockResolvedValueOnce(completedCpuFrame)
      .mockReturnValueOnce(firstPanFrame.promise)
      .mockReturnValueOnce(secondPanFrame.promise);

    const { rerender, result } = renderHook(
      ({ viewport }) =>
        useMandelbrotRender({
          cpuCanvasRef,
          gpuCanvasRef,
          viewport,
          settings,
          size,
        }),
      {
        initialProps: { viewport: initialViewport },
      }
    );

    await waitFor(() => {
      expect(result.current.phase).toBe("ready");
    });

    rerender({ viewport: firstPanViewport });
    await waitFor(() => {
      expect(mockedRenderMandelbrotWithStrategy).toHaveBeenCalledTimes(2);
    });

    const supersededRequest =
      mockedRenderMandelbrotWithStrategy.mock.calls[1][0];

    rerender({ viewport: secondPanViewport });
    await waitFor(() => {
      expect(mockedRenderMandelbrotWithStrategy).toHaveBeenCalledTimes(3);
    });

    const drawCountBeforeStaleChunk = cpuContext.drawImage.mock.calls.length;
    const previousImageData = globalThis.ImageData;

    Object.defineProperty(globalThis, "ImageData", {
      configurable: true,
      value: class TestImageData {},
    });

    try {
      supersededRequest.onChunk({
        startRow: 0,
        rowCount: 1,
        pixels: new Uint8ClampedArray(size.width * 4),
      });
    } finally {
      Object.defineProperty(globalThis, "ImageData", {
        configurable: true,
        value: previousImageData,
      });
    }

    expect(supersededRequest.signal?.aborted).toBe(true);
    expect(cpuContext.drawImage).toHaveBeenCalledTimes(
      drawCountBeforeStaleChunk
    );
  });

  it("keeps the mapped CPU preview until the replacement WebGPU frame completes", async () => {
    const size = { width: 20, height: 12 };
    const initialViewport = createDefaultViewport(size);
    const nextViewport = {
      ...initialViewport,
      centerX: initialViewport.centerX.add("0.1"),
    };
    const settings: MandelbrotSettings = {
      maxIterations: 32,
      paletteId: "oceanic",
      resolutionScale: 0.2,
      renderBackendPreference: "webgpu",
    };
    const cpuCanvas = document.createElement("canvas");
    const gpuCanvas = document.createElement("canvas");
    const cpuContext = createCanvasContext();
    const cpuCanvasRef = { current: cpuCanvas };
    const gpuCanvasRef = { current: gpuCanvas };
    const replacementFrame =
      createDeferred<
        Awaited<ReturnType<typeof renderMandelbrotWithStrategy>>
      >();
    const completedGpuFrame: Awaited<
      ReturnType<typeof renderMandelbrotWithStrategy>
    > = {
      completed: true,
      backend: "webgpu",
      gpuFallbackReason: undefined,
      effectiveMaxIterations: 32,
      cpuBudgetApplied: false,
    };

    Object.defineProperty(cpuCanvas, "getContext", {
      configurable: true,
      value: jest.fn((contextType: string) =>
        contextType === "2d" ? cpuContext : null
      ),
    });

    mockedShouldAttemptWebGpu.mockReturnValue(true);
    mockedRenderMandelbrotWithStrategy
      .mockResolvedValueOnce(completedGpuFrame)
      .mockReturnValueOnce(replacementFrame.promise);

    const { rerender, result } = renderHook(
      ({ viewport }) =>
        useMandelbrotRender({
          cpuCanvasRef,
          gpuCanvasRef,
          viewport,
          settings,
          size,
        }),
      {
        initialProps: { viewport: initialViewport },
      }
    );

    await waitFor(() => {
      expect(result.current.phase).toBe("ready");
    });
    expect(cpuContext.clearRect).toHaveBeenCalledTimes(1);

    rerender({ viewport: nextViewport });

    await waitFor(() => {
      expect(mockedRenderMandelbrotWithStrategy).toHaveBeenCalledTimes(2);
    });

    expect(cpuContext.drawImage).toHaveBeenCalledTimes(1);
    expect(cpuContext.clearRect).toHaveBeenCalledTimes(1);

    await act(async () => {
      replacementFrame.resolve(completedGpuFrame);
      await replacementFrame.promise;
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("ready");
    });
    expect(cpuContext.clearRect).toHaveBeenCalledTimes(2);
  });

  it("reports iteration metadata from the final refinement pass", async () => {
    const size = { width: 20, height: 12 };
    const viewport = createDefaultViewport(size);
    const settings: MandelbrotSettings = {
      maxIterations: 4000,
      paletteId: "oceanic",
      resolutionScale: 1,
      renderBackendPreference: "cpu",
    };
    const cpuCanvas = document.createElement("canvas");
    const gpuCanvas = document.createElement("canvas");
    const cpuContext = createCanvasContext();
    const cpuCanvasRef = { current: cpuCanvas };
    const gpuCanvasRef = { current: gpuCanvas };

    Object.defineProperty(cpuCanvas, "getContext", {
      configurable: true,
      value: jest.fn((contextType: string) =>
        contextType === "2d" ? cpuContext : null
      ),
    });

    mockedShouldAttemptWebGpu.mockReturnValue(false);
    mockedRenderMandelbrotWithStrategy
      .mockResolvedValueOnce({
        completed: true,
        backend: "webgpu",
        gpuFallbackReason: undefined,
        effectiveMaxIterations: 4000,
        cpuBudgetApplied: false,
      })
      .mockResolvedValueOnce({
        completed: true,
        backend: "cpu",
        gpuFallbackReason: undefined,
        effectiveMaxIterations: 555,
        cpuBudgetApplied: true,
      });

    const { result } = renderHook(() =>
      useMandelbrotRender({
        cpuCanvasRef,
        gpuCanvasRef,
        viewport,
        settings,
        size,
      })
    );

    await waitFor(() => {
      expect(result.current.phase).toBe("ready");
    });

    expect(mockedRenderMandelbrotWithStrategy).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({
      phase: "ready",
      message: "Render complete.",
      backend: "cpu",
      requestedMaxIterations: 4000,
      effectiveMaxIterations: 555,
      cpuBudgetApplied: true,
    });
  });
});
