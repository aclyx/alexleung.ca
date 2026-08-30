import { renderMandelbrotOnCpu } from "@/features/mandelbrot/renderer";
import { createViewport } from "@/features/mandelbrot/viewport";
import type {
  MandelbrotWorkerRequest,
  MandelbrotWorkerResponse,
} from "@/features/mandelbrot/workerProtocol";

function send(message: MandelbrotWorkerResponse) {
  if (message.type === "chunk") {
    self.postMessage(message, { transfer: [message.pixels.buffer] });
    return;
  }

  self.postMessage(message);
}

self.addEventListener(
  "message",
  (event: MessageEvent<MandelbrotWorkerRequest>) => {
    const { settings, size, viewport: serializedViewport } = event.data;

    void renderMandelbrotOnCpu({
      viewport: createViewport({
        centerX: serializedViewport.centerX,
        centerY: serializedViewport.centerY,
        width: serializedViewport.width,
        size,
      }),
      settings,
      size,
      onChunk: (chunk) => {
        send({ type: "chunk", ...chunk });
      },
    })
      .then((completed) => {
        send({ type: "complete", completed });
      })
      .catch((error) => {
        send({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "CPU rendering failed unexpectedly.",
        });
      });
  }
);
