import type {
  MandelbrotSettings,
  PixelSize,
} from "@/features/mandelbrot/types";

type SerializedViewport = {
  centerX: string;
  centerY: string;
  width: string;
};

export type MandelbrotWorkerRequest = {
  settings: MandelbrotSettings;
  size: PixelSize;
  viewport: SerializedViewport;
};

export type MandelbrotWorkerResponse =
  | {
      type: "chunk";
      startRow: number;
      rowCount: number;
      pixels: Uint8ClampedArray<ArrayBuffer>;
    }
  | {
      type: "complete";
      completed: boolean;
    }
  | {
      type: "error";
      message: string;
    };
