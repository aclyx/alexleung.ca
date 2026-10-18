import type { RenderRequest } from "@/features/mandelbrot/types";
import type {
  MandelbrotWorkerRequest,
  MandelbrotWorkerResponse,
} from "@/features/mandelbrot/workerProtocol";

export function renderMandelbrotInWorker(
  request: RenderRequest
): Promise<boolean> {
  if (request.signal?.aborted) {
    return Promise.resolve(false);
  }

  if (typeof Worker === "undefined") {
    return Promise.reject(
      new Error("CPU rendering requires Web Worker support in this browser.")
    );
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./mandelbrot.worker.ts", import.meta.url),
      { type: "module" }
    );
    let settled = false;

    const cleanup = () => {
      request.signal?.removeEventListener("abort", handleAbort);
      worker.terminate();
    };

    const finish = (completed: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(completed);
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    const handleAbort = () => {
      finish(false);
    };

    worker.addEventListener(
      "message",
      (event: MessageEvent<MandelbrotWorkerResponse>) => {
        if (settled || request.signal?.aborted) {
          return;
        }

        const message = event.data;

        if (message.type === "chunk") {
          request.onChunk({
            startRow: message.startRow,
            rowCount: message.rowCount,
            pixels: message.pixels,
          });
          return;
        }

        if (message.type === "error") {
          fail(new Error(message.message));
          return;
        }

        finish(message.completed);
      }
    );
    worker.addEventListener("error", () => {
      fail(new Error("The CPU render worker stopped unexpectedly."));
    });
    worker.addEventListener("messageerror", () => {
      fail(new Error("The CPU render worker returned unreadable data."));
    });
    request.signal?.addEventListener("abort", handleAbort, { once: true });

    const workerRequest: MandelbrotWorkerRequest = {
      viewport: {
        centerX: request.viewport.centerX.toString(),
        centerY: request.viewport.centerY.toString(),
        width: request.viewport.width.toString(),
      },
      settings: request.settings,
      size: request.size,
    };

    try {
      worker.postMessage(workerRequest);
    } catch {
      fail(new Error("The CPU render worker could not start."));
    }
  });
}
