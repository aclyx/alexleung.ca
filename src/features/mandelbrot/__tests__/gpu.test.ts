import Decimal from "decimal.js";

import {
  canRenderViewportWithWebGpu,
  renderMandelbrotWithWebGpu,
} from "@/features/mandelbrot/gpu";
import { createDefaultViewport } from "@/features/mandelbrot/viewport";

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe("canRenderViewportWithWebGpu", () => {
  it("keeps auto mode on WebGPU at the old relaxed boundary", () => {
    expect(
      canRenderViewportWithWebGpu(
        {
          centerX: new Decimal(-0.75),
          centerY: new Decimal(0),
          width: new Decimal("0.00005"),
          height: new Decimal("0.00003125"),
        },
        {
          width: 960,
          height: 600,
        }
      )
    ).toBe(true);
  });

  it("switches auto mode back to CPU once the pixel step drops below the float32 cushion", () => {
    expect(
      canRenderViewportWithWebGpu(
        {
          centerX: new Decimal(-0.75),
          centerY: new Decimal(0),
          width: new Decimal("0.00002"),
          height: new Decimal("0.0000125"),
        },
        {
          width: 960,
          height: 600,
        }
      )
    ).toBe(false);
  });
});

describe("renderMandelbrotWithWebGpu", () => {
  it("does not report a directly presented frame before submitted GPU work finishes", async () => {
    const submittedWork = createDeferred();
    const computePass = {
      dispatchWorkgroups: jest.fn(),
      end: jest.fn(),
      setBindGroup: jest.fn(),
      setPipeline: jest.fn(),
    };
    const renderPass = {
      draw: jest.fn(),
      end: jest.fn(),
      setBindGroup: jest.fn(),
      setPipeline: jest.fn(),
    };
    const commandEncoder = {
      beginComputePass: jest.fn(() => computePass),
      beginRenderPass: jest.fn(() => renderPass),
      copyBufferToBuffer: jest.fn(),
      finish: jest.fn(() => ({})),
    };
    const buffer = {
      destroy: jest.fn(),
      getMappedRange: jest.fn(() => new ArrayBuffer(0)),
      mapAsync: jest.fn(async () => undefined),
      unmap: jest.fn(),
    };
    const onSubmittedWorkDone = jest.fn(() => submittedWork.promise);
    const submit = jest.fn();
    const device = {
      createBindGroup: jest.fn(() => ({})),
      createBindGroupLayout: jest.fn(() => ({})),
      createBuffer: jest.fn(() => buffer),
      createCommandEncoder: jest.fn(() => commandEncoder),
      createComputePipeline: jest.fn(() => ({})),
      createPipelineLayout: jest.fn(() => ({})),
      createRenderPipeline: jest.fn(() => ({})),
      createShaderModule: jest.fn(() => ({})),
      queue: {
        onSubmittedWorkDone,
        submit,
        writeBuffer: jest.fn(),
      },
    };
    const gpu = {
      getPreferredCanvasFormat: jest.fn(() => "bgra8unorm"),
      requestAdapter: jest.fn(async () => ({
        requestDevice: jest.fn(async () => device),
      })),
    };
    const targetCanvas = document.createElement("canvas");
    const webGpuContext = {
      configure: jest.fn(),
      getCurrentTexture: jest.fn(() => ({
        createView: jest.fn(() => ({})),
      })),
    };
    const getContext = jest.fn((contextType: string) =>
      contextType === "webgpu" ? webGpuContext : null
    );

    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: gpu,
    });
    Object.defineProperty(targetCanvas, "getContext", {
      configurable: true,
      value: getContext,
    });

    let settled = false;
    const renderPromise = renderMandelbrotWithWebGpu({
      viewport: createDefaultViewport({ width: 8, height: 6 }),
      size: { width: 8, height: 6 },
      settings: {
        maxIterations: 32,
        paletteId: "oceanic",
        resolutionScale: 1,
        renderBackendPreference: "webgpu",
      },
      gpuTargetCanvas: targetCanvas,
      onChunk: jest.fn(),
    });

    renderPromise.then(() => {
      settled = true;
    });

    for (
      let attempt = 0;
      attempt < 10 && !onSubmittedWorkDone.mock.calls.length;
      attempt += 1
    ) {
      await Promise.resolve();
    }

    expect(onSubmittedWorkDone).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);

    submittedWork.resolve();

    await expect(renderPromise).resolves.toEqual({
      completed: true,
      rendered: true,
    });
  });
});
