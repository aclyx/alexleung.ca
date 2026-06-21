"use client";

import { RefObject, useEffect, useState } from "react";

import {
  renderMandelbrotWithStrategy,
  shouldAttemptWebGpu,
} from "@/features/mandelbrot/renderer";
import { createMandelbrotRenderPlan } from "@/features/mandelbrot/renderPlan";
import {
  MandelbrotSettings,
  PixelSize,
  PreciseViewport,
  RenderBackend,
} from "@/features/mandelbrot/types";

type RenderPhase = "idle" | "preview" | "refining" | "ready" | "error";

type RenderState = {
  phase: RenderPhase;
  progress: number;
  message: string;
  backend: RenderBackend;
};

type UseMandelbrotRenderInput = {
  cpuCanvasRef: RefObject<HTMLCanvasElement | null>;
  gpuCanvasRef: RefObject<HTMLCanvasElement | null>;
  viewport: PreciseViewport;
  settings: MandelbrotSettings;
  size: PixelSize;
};

function renderSizeForScale(size: PixelSize, scale: number): PixelSize {
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

export function useMandelbrotRender({
  cpuCanvasRef,
  gpuCanvasRef,
  viewport,
  settings,
  size,
}: UseMandelbrotRenderInput): RenderState {
  const [renderState, setRenderState] = useState<RenderState>({
    phase: "idle",
    progress: 0,
    message: "Waiting for canvas size.",
    backend: "cpu",
  });

  useEffect(() => {
    const canvas = cpuCanvasRef.current;
    const gpuCanvas = gpuCanvasRef.current;

    if (!canvas || !gpuCanvas || size.width <= 0 || size.height <= 0) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      setRenderState({
        phase: "error",
        progress: 0,
        message: "Canvas 2D rendering is unavailable in this browser.",
        backend: "cpu",
      });
      return;
    }

    const abortController = new AbortController();
    const renderPlan = createMandelbrotRenderPlan(viewport, settings);
    const renderingCanvas = canvas;
    const renderingContext = context;
    const renderingGpuCanvas = gpuCanvas;

    let isMounted = true;

    async function runRender() {
      let activeBackend: RenderBackend = "cpu";
      const previousFrame =
        (renderingCanvas.width > 0 && renderingCanvas.height > 0) ||
        (renderingGpuCanvas.width > 0 && renderingGpuCanvas.height > 0)
          ? document.createElement("canvas")
          : null;

      if (previousFrame) {
        previousFrame.width = Math.max(
          renderingCanvas.width,
          renderingGpuCanvas.width
        );
        previousFrame.height = Math.max(
          renderingCanvas.height,
          renderingGpuCanvas.height
        );
        const previousFrameContext = previousFrame.getContext("2d");

        previousFrameContext?.drawImage(
          renderingGpuCanvas,
          0,
          0,
          previousFrame.width,
          previousFrame.height
        );
        previousFrameContext?.drawImage(
          renderingCanvas,
          0,
          0,
          previousFrame.width,
          previousFrame.height
        );
      }

      renderingCanvas.width = size.width;
      renderingCanvas.height = size.height;
      renderingGpuCanvas.width = size.width;
      renderingGpuCanvas.height = size.height;

      if (previousFrame) {
        renderingContext.drawImage(
          previousFrame,
          0,
          0,
          size.width,
          size.height
        );
      } else {
        renderingContext.fillStyle = "#030712";
        renderingContext.fillRect(0, 0, size.width, size.height);
      }

      for (const renderPass of renderPlan.passes) {
        const { message, phase, scale } = renderPass;
        const buffer = document.createElement("canvas");
        const bufferSize = renderSizeForScale(size, scale);
        const bufferContext = buffer.getContext("2d");
        const shouldUseGpu = shouldAttemptWebGpu(
          {
            viewport,
            size: bufferSize,
          },
          renderPass.settings.renderBackendPreference
        );

        if (!bufferContext) {
          throw new Error("Unable to create an offscreen render buffer.");
        }

        buffer.width = bufferSize.width;
        buffer.height = bufferSize.height;

        if (!shouldUseGpu) {
          bufferContext.drawImage(
            renderingCanvas,
            0,
            0,
            bufferSize.width,
            bufferSize.height
          );
        } else {
          renderingContext.clearRect(0, 0, size.width, size.height);
        }

        activeBackend = shouldUseGpu ? "webgpu" : "cpu";

        setRenderState({
          phase,
          progress: 0,
          message,
          backend: activeBackend,
        });

        const renderResult = await renderMandelbrotWithStrategy(
          {
            viewport,
            size: bufferSize,
            settings: renderPass.settings,
            gpuTargetCanvas: renderingGpuCanvas,
            signal: abortController.signal,
            onChunk: (chunk) => {
              activeBackend = "cpu";

              const imageData = new ImageData(
                new Uint8ClampedArray(chunk.pixels),
                bufferSize.width,
                chunk.rowCount
              );

              bufferContext.putImageData(imageData, 0, chunk.startRow);
              renderingContext.imageSmoothingEnabled = scale >= 0.75;
              renderingContext.drawImage(buffer, 0, 0, size.width, size.height);
            },
            onProgress: (progress) => {
              if (!isMounted) {
                return;
              }

              setRenderState({
                phase,
                progress,
                message,
                backend: activeBackend,
              });
            },
          },
          renderPass.settings.renderBackendPreference
        );

        activeBackend = renderResult.backend;

        if (!renderResult.completed || abortController.signal.aborted) {
          return;
        }
      }

      if (isMounted) {
        setRenderState({
          phase: "ready",
          progress: 1,
          message: renderPlan.completionMessage,
          backend: activeBackend,
        });
      }
    }

    runRender().catch(() => {
      if (!isMounted || abortController.signal.aborted) {
        return;
      }

      setRenderState({
        phase: "error",
        progress: 0,
        message: "Rendering failed unexpectedly.",
        backend: "cpu",
      });
    });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [cpuCanvasRef, gpuCanvasRef, settings, size.height, size.width, viewport]);

  return renderState;
}
