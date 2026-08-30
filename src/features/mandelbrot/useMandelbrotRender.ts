"use client";

import { RefObject, useEffect, useRef, useState } from "react";

import { calculateViewportFramePlacement } from "@/features/mandelbrot/framePreview";
import {
  renderMandelbrotWithStrategy,
  shouldAttemptWebGpu,
} from "@/features/mandelbrot/renderer";
import { createMandelbrotRenderPlan } from "@/features/mandelbrot/renderPlan";
import {
  MandelbrotSettings,
  PixelSize,
  PreciseViewport,
} from "@/features/mandelbrot/types";
import { cloneViewport } from "@/features/mandelbrot/viewport";
import { renderMandelbrotInWorker } from "@/features/mandelbrot/workerRenderer";

type RenderPhase = "idle" | "preview" | "refining" | "ready" | "error";

type RenderState = {
  phase: RenderPhase;
  message: string;
  backend?: Awaited<ReturnType<typeof renderMandelbrotWithStrategy>>["backend"];
  requestedMaxIterations?: number;
  effectiveMaxIterations?: number;
  cpuBudgetApplied?: boolean;
};

type UseMandelbrotRenderInput = {
  cpuCanvasRef: RefObject<HTMLCanvasElement | null>;
  gpuCanvasRef: RefObject<HTMLCanvasElement | null>;
  viewport: PreciseViewport;
  settings: MandelbrotSettings;
  size: PixelSize;
};

type CompletedFrame = {
  canvas: HTMLCanvasElement;
  size: PixelSize;
  viewport: PreciseViewport;
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
    message: "Waiting for canvas size.",
  });
  const completedFrameRef = useRef<CompletedFrame | null>(null);

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
        message: "Canvas 2D rendering is unavailable in this browser.",
      });
      return;
    }

    const abortController = new AbortController();
    const renderPlan = createMandelbrotRenderPlan(viewport, settings);
    const renderingCanvas = canvas;
    const renderingContext = context;
    const renderingGpuCanvas = gpuCanvas;
    const previousFrame = completedFrameRef.current;

    let isMounted = true;

    function storeCompletedFrame() {
      const completedCanvas = document.createElement("canvas");

      completedCanvas.width = size.width;
      completedCanvas.height = size.height;

      const completedContext = completedCanvas.getContext("2d");

      if (!completedContext) {
        completedFrameRef.current = null;
        return;
      }

      completedContext.clearRect(0, 0, size.width, size.height);
      completedContext.drawImage(
        renderingGpuCanvas,
        0,
        0,
        size.width,
        size.height
      );
      completedContext.drawImage(
        renderingCanvas,
        0,
        0,
        size.width,
        size.height
      );
      completedFrameRef.current = {
        canvas: completedCanvas,
        size: { ...size },
        viewport: cloneViewport(viewport),
      };
    }

    async function runRender() {
      let finalRenderResult: Awaited<
        ReturnType<typeof renderMandelbrotWithStrategy>
      > | null = null;

      renderingCanvas.width = size.width;
      renderingCanvas.height = size.height;
      renderingGpuCanvas.width = size.width;
      renderingGpuCanvas.height = size.height;

      renderingContext.fillStyle = "#030712";
      renderingContext.fillRect(0, 0, size.width, size.height);

      if (previousFrame) {
        const placement = calculateViewportFramePlacement({
          sourceSize: previousFrame.size,
          sourceViewport: previousFrame.viewport,
          targetSize: size,
          targetViewport: viewport,
        });

        if (placement) {
          renderingContext.imageSmoothingEnabled = true;
          renderingContext.drawImage(
            previousFrame.canvas,
            placement.x,
            placement.y,
            placement.width,
            placement.height
          );
        }
      }

      for (const renderPass of renderPlan.passes) {
        const { phase, scale } = renderPass;
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
        }

        setRenderState({
          phase,
          message: "Rendering…",
        });

        const renderResult = await renderMandelbrotWithStrategy(
          {
            viewport,
            size: bufferSize,
            settings: renderPass.settings,
            gpuTargetCanvas: renderingGpuCanvas,
            signal: abortController.signal,
            onChunk: (chunk) => {
              if (!isMounted || abortController.signal.aborted) {
                return;
              }

              const imageData = new ImageData(
                new Uint8ClampedArray(chunk.pixels),
                bufferSize.width,
                chunk.rowCount
              );

              bufferContext.putImageData(imageData, 0, chunk.startRow);
              renderingContext.imageSmoothingEnabled = scale >= 0.75;
              renderingContext.drawImage(buffer, 0, 0, size.width, size.height);
            },
          },
          renderPass.settings.renderBackendPreference,
          renderMandelbrotInWorker
        );

        if (!renderResult.completed || abortController.signal.aborted) {
          return;
        }

        finalRenderResult = renderResult;

        if (renderResult.backend === "webgpu") {
          renderingContext.clearRect(0, 0, size.width, size.height);
        }
      }

      if (isMounted) {
        storeCompletedFrame();
        setRenderState({
          phase: "ready",
          message: "Render complete.",
          backend: finalRenderResult?.backend,
          requestedMaxIterations: settings.maxIterations,
          effectiveMaxIterations: finalRenderResult?.effectiveMaxIterations,
          cpuBudgetApplied: finalRenderResult?.cpuBudgetApplied,
        });
      }
    }

    runRender().catch((error: unknown) => {
      if (!isMounted || abortController.signal.aborted) {
        return;
      }

      setRenderState({
        phase: "error",
        message:
          error instanceof Error
            ? error.message
            : "Rendering failed unexpectedly.",
      });
    });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [cpuCanvasRef, gpuCanvasRef, settings, size.height, size.width, viewport]);

  return renderState;
}
