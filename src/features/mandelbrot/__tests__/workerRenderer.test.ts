import { RenderRequest } from "@/features/mandelbrot/types";
import { createViewport } from "@/features/mandelbrot/viewport";
import {
  MandelbrotWorkerRequest,
  MandelbrotWorkerResponse,
} from "@/features/mandelbrot/workerProtocol";
import { renderMandelbrotInWorker } from "@/features/mandelbrot/workerRenderer";

type FakeWorkerListener = (event: { data: MandelbrotWorkerResponse }) => void;

class FakeWorker {
  static instances: FakeWorker[] = [];
  static throwOnPostMessage = false;

  readonly postMessage = jest
    .fn<void, [MandelbrotWorkerRequest]>()
    .mockImplementation(() => {
      if (FakeWorker.throwOnPostMessage) {
        throw new Error("Unable to start worker");
      }
    });
  readonly terminate = jest.fn();
  readonly url: string | URL;
  readonly options: WorkerOptions | undefined;

  private readonly messageListeners: FakeWorkerListener[] = [];
  private readonly errorListeners: FakeWorkerListener[] = [];
  private readonly messageErrorListeners: FakeWorkerListener[] = [];

  constructor(url: string | URL, options?: WorkerOptions) {
    this.url = url;
    this.options = options;
    FakeWorker.instances.push(this);
  }

  addEventListener(type: string, listener: FakeWorkerListener) {
    if (type === "message") {
      this.messageListeners.push(listener);
      return;
    }

    if (type === "error") {
      this.errorListeners.push(listener);
      return;
    }

    if (type === "messageerror") {
      this.messageErrorListeners.push(listener);
    }
  }

  emitMessage(data: MandelbrotWorkerResponse) {
    for (const listener of this.messageListeners) {
      listener({ data });
    }
  }

  emitError() {
    for (const listener of this.errorListeners) {
      listener({
        data: {
          type: "error",
          message: "worker error",
        },
      });
    }
  }

  emitMessageError() {
    for (const listener of this.messageErrorListeners) {
      listener({
        data: {
          type: "error",
          message: "unreadable worker message",
        },
      });
    }
  }
}

const originalWorkerDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "Worker"
);

function createRenderRequest(signal?: AbortSignal): RenderRequest {
  const size = { width: 12, height: 8 };

  return {
    viewport: createViewport({
      centerX: "-0.75",
      centerY: "0",
      width: "3.5",
      size,
    }),
    size,
    settings: {
      maxIterations: 100,
      paletteId: "ember",
      resolutionScale: 0.5,
      renderBackendPreference: "cpu",
    },
    signal,
    onChunk: jest.fn(),
  };
}

describe("renderMandelbrotInWorker", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    FakeWorker.throwOnPostMessage = false;
    Object.defineProperty(globalThis, "Worker", {
      configurable: true,
      writable: true,
      value: FakeWorker,
    });
  });

  afterAll(() => {
    if (originalWorkerDescriptor) {
      Object.defineProperty(globalThis, "Worker", originalWorkerDescriptor);
      return;
    }

    Reflect.deleteProperty(globalThis, "Worker");
  });

  it("serializes a request and forwards worker chunks", async () => {
    const request = createRenderRequest();
    const renderPromise = renderMandelbrotInWorker(request);
    const worker = FakeWorker.instances[0];
    const pixels = new Uint8ClampedArray([1, 2, 3, 255]);

    expect(worker.options).toEqual({ type: "module" });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    const postedRequest: MandelbrotWorkerRequest =
      worker.postMessage.mock.calls[0][0];

    expect(postedRequest).toEqual({
      viewport: {
        centerX: request.viewport.centerX.toString(),
        centerY: request.viewport.centerY.toString(),
        width: request.viewport.width.toString(),
      },
      settings: request.settings,
      size: request.size,
    });

    worker.emitMessage({
      type: "chunk",
      startRow: 2,
      rowCount: 1,
      pixels,
    });
    worker.emitMessage({ type: "complete", completed: true });

    await expect(renderPromise).resolves.toBe(true);
    expect(request.onChunk).toHaveBeenCalledWith({
      startRow: 2,
      rowCount: 1,
      pixels,
    });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("terminates the worker and resolves false when a render is aborted", async () => {
    const abortController = new AbortController();
    const request = createRenderRequest(abortController.signal);
    const renderPromise = renderMandelbrotInWorker(request);
    const worker = FakeWorker.instances[0];

    abortController.abort();
    worker.emitMessage({
      type: "chunk",
      startRow: 0,
      rowCount: 1,
      pixels: new Uint8ClampedArray([1, 2, 3, 255]),
    });

    await expect(renderPromise).resolves.toBe(false);
    expect(request.onChunk).not.toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("does not create a worker for an already aborted request", async () => {
    const abortController = new AbortController();

    abortController.abort();

    await expect(
      renderMandelbrotInWorker(createRenderRequest(abortController.signal))
    ).resolves.toBe(false);
    expect(FakeWorker.instances).toHaveLength(0);
  });

  it("rejects a structured worker error and terminates the worker", async () => {
    const renderPromise = renderMandelbrotInWorker(createRenderRequest());
    const worker = FakeWorker.instances[0];

    worker.emitMessage({
      type: "error",
      message: "Unable to render this viewport.",
    });

    await expect(renderPromise).rejects.toThrow(
      "Unable to render this viewport."
    );
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("rejects an unexpected worker failure", async () => {
    const renderPromise = renderMandelbrotInWorker(createRenderRequest());
    const worker = FakeWorker.instances[0];

    worker.emitError();

    await expect(renderPromise).rejects.toThrow(
      "The CPU render worker stopped unexpectedly."
    );
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("rejects unreadable worker messages", async () => {
    const renderPromise = renderMandelbrotInWorker(createRenderRequest());
    const worker = FakeWorker.instances[0];

    worker.emitMessageError();

    await expect(renderPromise).rejects.toThrow(
      "The CPU render worker returned unreadable data."
    );
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("rejects and cleans up when posting the initial request fails", async () => {
    FakeWorker.throwOnPostMessage = true;

    const renderPromise = renderMandelbrotInWorker(createRenderRequest());
    const worker = FakeWorker.instances[0];

    await expect(renderPromise).rejects.toThrow(
      "The CPU render worker could not start."
    );
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("reports when workers are unavailable", async () => {
    Object.defineProperty(globalThis, "Worker", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    await expect(
      renderMandelbrotInWorker(createRenderRequest())
    ).rejects.toThrow("CPU rendering requires Web Worker support");
    expect(FakeWorker.instances).toHaveLength(0);
  });
});
