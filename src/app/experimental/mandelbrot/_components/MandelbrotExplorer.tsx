"use client";

import { useEffect, useState } from "react";

import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Surface } from "@/components/Surface";
import {
  formatMagnification,
  formatPreciseDecimal,
} from "@/features/mandelbrot/format";
import { detectWebGpuAvailability } from "@/features/mandelbrot/gpu";
import {
  createViewportHistory,
  pushViewport,
  redoViewport,
  replaceViewport,
  undoViewport,
  ViewportHistory,
} from "@/features/mandelbrot/history";
import { PALETTE_OPTIONS } from "@/features/mandelbrot/palettes";
import {
  ColoringMode,
  ComplexPoint,
  DragMode,
  MandelbrotSettings,
  PixelSize,
  PreciseViewport,
  RenderBackendPreference,
} from "@/features/mandelbrot/types";
import {
  parseSettingsFromQuery,
  parseViewportFromQuery,
} from "@/features/mandelbrot/urlState";
import {
  createDefaultViewport,
  magnificationFromViewport,
  resizeViewport,
  zoomViewportAtPoint,
} from "@/features/mandelbrot/viewport";
import { trackExperimentInteraction } from "@/lib/analytics";

import { MandelbrotCanvas } from "./MandelbrotCanvas";

const DEFAULT_CANVAS_SIZE: PixelSize = {
  width: 960,
  height: 600,
};

const DEFAULT_GPU_SETTINGS: MandelbrotSettings = {
  maxIterations: 2000,
  paletteId: "oceanic",
  coloringMode: "smooth",
  resolutionScale: 1,
  renderBackendPreference: "auto",
};

const DEFAULT_CPU_SETTINGS: MandelbrotSettings = {
  maxIterations: 180,
  paletteId: "oceanic",
  coloringMode: "smooth",
  resolutionScale: 0.5,
  renderBackendPreference: "auto",
};

const QUALITY_OPTIONS: ReadonlyArray<{
  value: number;
  label: string;
}> = [
  { value: 0.5, label: "50%" },
  { value: 0.75, label: "75%" },
  { value: 1, label: "100%" },
];

const BACKEND_OPTIONS: ReadonlyArray<{
  value: RenderBackendPreference;
  label: string;
}> = [
  { value: "auto", label: "Auto" },
  { value: "webgpu", label: "WebGPU" },
  { value: "cpu", label: "CPU" },
];
const COLORING_MODE_OPTIONS: ReadonlyArray<{
  value: ColoringMode;
  label: string;
}> = [
  { value: "smooth", label: "Smooth escape" },
  { value: "bands", label: "Banding" },
];

const sectionTitleClass = "text-heading-sm text-white";
const metaValueClass = "break-all text-sm text-cyan-100";
const toolbarButtonClass =
  "rounded-md border border-white/15 px-3 py-2 text-sm text-white transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40";
const EXPERIMENT_ID = "mandelbrot_explorer";

function isRenderBackendPreference(
  value: string
): value is RenderBackendPreference {
  return BACKEND_OPTIONS.some((option) => option.value === value);
}

function isPaletteId(value: string): value is MandelbrotSettings["paletteId"] {
  return PALETTE_OPTIONS.some((option) => option.id === value);
}

function isColoringMode(value: string): value is ColoringMode {
  return COLORING_MODE_OPTIONS.some((option) => option.value === value);
}

export function MandelbrotExplorer() {
  const [history, setHistory] = useState<ViewportHistory>(() =>
    createViewportHistory(createDefaultViewport(DEFAULT_CANVAS_SIZE))
  );
  const [previewViewport, setPreviewViewport] =
    useState<PreciseViewport | null>(null);
  const [canvasSize, setCanvasSize] = useState(DEFAULT_CANVAS_SIZE);
  const [dragMode, setDragMode] = useState<DragMode>("pan");
  const [hoverPoint, setHoverPoint] = useState<ComplexPoint | null>(null);
  const [settings, setSettings] = useState(DEFAULT_CPU_SETTINGS);

  const activeViewport = previewViewport ?? history.present;
  const defaultViewport = createDefaultViewport(canvasSize);
  const magnification = magnificationFromViewport(activeViewport);

  useEffect(() => {
    let isMounted = true;

    async function initializeExplorerState() {
      const currentSearchParams = Object.fromEntries(
        new URLSearchParams(window.location.search).entries()
      );
      const parsedViewport = parseViewportFromQuery(
        currentSearchParams,
        DEFAULT_CANVAS_SIZE
      );
      let defaultSettings = DEFAULT_CPU_SETTINGS;

      try {
        const gpuAvailability = await detectWebGpuAvailability();

        defaultSettings = gpuAvailability.isAvailable
          ? DEFAULT_GPU_SETTINGS
          : DEFAULT_CPU_SETTINGS;
      } catch {
        defaultSettings = DEFAULT_CPU_SETTINGS;
      }

      if (!isMounted) {
        return;
      }

      setSettings(parseSettingsFromQuery(currentSearchParams, defaultSettings));

      if (parsedViewport) {
        setHistory(createViewportHistory(parsedViewport));
        setPreviewViewport(null);
      }
    }

    void initializeExplorerState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setHistory((currentHistory) => ({
      ...replaceViewport(
        currentHistory,
        resizeViewport(currentHistory.present, canvasSize)
      ),
      past: currentHistory.past.map((viewport) =>
        resizeViewport(viewport, canvasSize)
      ),
      future: currentHistory.future.map((viewport) =>
        resizeViewport(viewport, canvasSize)
      ),
    }));
    setPreviewViewport((currentPreview) =>
      currentPreview ? resizeViewport(currentPreview, canvasSize) : null
    );
  }, [canvasSize.height, canvasSize.width]);

  function commitViewport(nextViewport: PreciseViewport) {
    setPreviewViewport(null);
    setHistory((currentHistory) => pushViewport(currentHistory, nextViewport));
  }

  function zoomAroundCenter(multiplier: number) {
    commitViewport(
      zoomViewportAtPoint(
        activeViewport,
        canvasSize,
        {
          x: canvasSize.width / 2,
          y: canvasSize.height / 2,
        },
        multiplier
      )
    );
  }

  function trackMandelbrotInteraction(
    action: string,
    params: Record<string, string | number> = {}
  ) {
    trackExperimentInteraction(EXPERIMENT_ID, action, params);
  }

  function handleZoom(multiplier: number, source: string) {
    trackMandelbrotInteraction(multiplier < 1 ? "zoom_in" : "zoom_out", {
      source,
    });
    zoomAroundCenter(multiplier);
  }

  function handleReset(source: string) {
    trackMandelbrotInteraction("reset_view", { source });
    commitViewport(defaultViewport);
  }

  function handleIterationsChange(value: string) {
    const nextIterations = Number.parseInt(value, 10);

    if (!Number.isFinite(nextIterations)) {
      return;
    }

    setSettings((currentSettings) => ({
      ...currentSettings,
      maxIterations: Math.min(Math.max(nextIterations, 25), 4000),
    }));
  }

  function handleResolutionScaleChange(value: string) {
    const nextScale = Number.parseFloat(value);

    if (!Number.isFinite(nextScale)) {
      return;
    }

    setSettings((currentSettings) => ({
      ...currentSettings,
      resolutionScale: nextScale,
    }));
  }

  return (
    <ResponsiveContainer
      element="section"
      variant="wide"
      className="space-y-6 px-5 py-8"
    >
      <div className="mx-auto max-w-4xl" data-testid="experiment-intro">
        <p className="text-body text-gray-300 md:text-center">
          This explorer keeps viewport coordinates in arbitrary-precision
          decimals, then renders the escape-time field asynchronously so we can
          zoom past ordinary floating-point precision without losing the exact
          center or scale state.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <MandelbrotCanvas
            viewport={activeViewport}
            settings={settings}
            dragMode={dragMode}
            onCanvasSizeChange={setCanvasSize}
            onPreviewViewport={setPreviewViewport}
            onCommitViewport={commitViewport}
            onHoverPointChange={setHoverPoint}
            onZoomIn={() => handleZoom(0.5, "canvas")}
            onZoomOut={() => handleZoom(2, "canvas")}
            onReset={() => handleReset("canvas")}
          />

          <Surface padding="md" className="grid gap-4 md:grid-cols-2">
            <div>
              <h2 className={sectionTitleClass}>Navigation</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${toolbarButtonClass} ${
                    dragMode === "pan"
                      ? "border-cyan-300 bg-cyan-400/10 text-cyan-100"
                      : ""
                  }`}
                  onClick={() => {
                    trackMandelbrotInteraction("change_drag_mode", {
                      drag_mode: "pan",
                    });
                    setDragMode("pan");
                  }}
                >
                  Pan mode
                </button>
                <button
                  type="button"
                  className={`${toolbarButtonClass} ${
                    dragMode === "box-zoom"
                      ? "border-cyan-300 bg-cyan-400/10 text-cyan-100"
                      : ""
                  }`}
                  onClick={() => {
                    trackMandelbrotInteraction("change_drag_mode", {
                      drag_mode: "box_zoom",
                    });
                    setDragMode("box-zoom");
                  }}
                >
                  Box zoom mode
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={toolbarButtonClass}
                  onClick={() => handleZoom(0.5, "toolbar")}
                >
                  Zoom in
                </button>
                <button
                  type="button"
                  className={toolbarButtonClass}
                  onClick={() => handleZoom(2, "toolbar")}
                >
                  Zoom out
                </button>
                <button
                  type="button"
                  className={toolbarButtonClass}
                  onClick={() => handleReset("toolbar")}
                >
                  Reset view
                </button>
                <button
                  type="button"
                  className={toolbarButtonClass}
                  onClick={() => {
                    trackMandelbrotInteraction("undo_view");
                    setPreviewViewport(null);
                    setHistory((currentHistory) =>
                      undoViewport(currentHistory)
                    );
                  }}
                  disabled={history.past.length === 0}
                >
                  Undo
                </button>
                <button
                  type="button"
                  className={toolbarButtonClass}
                  onClick={() => {
                    trackMandelbrotInteraction("redo_view");
                    setPreviewViewport(null);
                    setHistory((currentHistory) =>
                      redoViewport(currentHistory)
                    );
                  }}
                  disabled={history.future.length === 0}
                >
                  Redo
                </button>
              </div>
            </div>

            <div>
              <h2 className={sectionTitleClass}>Render settings</h2>
              <div className="mt-3 grid gap-3">
                <label className="text-sm text-gray-200">
                  <span>Render backend</span>
                  <select
                    value={settings.renderBackendPreference}
                    onChange={(event) => {
                      const renderBackendPreference = event.target.value;

                      if (!isRenderBackendPreference(renderBackendPreference)) {
                        return;
                      }

                      trackMandelbrotInteraction("change_render_backend", {
                        render_backend: renderBackendPreference,
                      });
                      setSettings((currentSettings) => ({
                        ...currentSettings,
                        renderBackendPreference,
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
                  >
                    {BACKEND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-200">
                  <span>Max iterations</span>
                  <input
                    type="number"
                    min={25}
                    max={4000}
                    step={25}
                    value={settings.maxIterations}
                    onChange={(event) => {
                      trackMandelbrotInteraction("change_max_iterations");
                      handleIterationsChange(event.target.value);
                    }}
                    className="mt-1 w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-200">
                  <span>Color palette</span>
                  <select
                    value={settings.paletteId}
                    onChange={(event) => {
                      const paletteId = event.target.value;

                      if (!isPaletteId(paletteId)) {
                        return;
                      }

                      trackMandelbrotInteraction("change_palette", {
                        palette_id: paletteId,
                      });
                      setSettings((currentSettings) => ({
                        ...currentSettings,
                        paletteId,
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
                  >
                    {PALETTE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-200">
                  <span>Coloring mode</span>
                  <select
                    value={settings.coloringMode}
                    onChange={(event) => {
                      const coloringMode = event.target.value;

                      if (!isColoringMode(coloringMode)) {
                        return;
                      }

                      trackMandelbrotInteraction("change_coloring_mode", {
                        coloring_mode: coloringMode,
                      });
                      setSettings((currentSettings) => ({
                        ...currentSettings,
                        coloringMode,
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
                  >
                    {COLORING_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-200">
                  <span>Render quality</span>
                  <select
                    value={settings.resolutionScale}
                    onChange={(event) => {
                      trackMandelbrotInteraction("change_render_quality");
                      handleResolutionScaleChange(event.target.value);
                    }}
                    className="mt-1 w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
                  >
                    {QUALITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface padding="md">
            <h2 className={sectionTitleClass}>View state</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Center X
                </dt>
                <dd
                  className={metaValueClass}
                  data-testid="mandelbrot-center-x"
                  title={activeViewport.centerX.toString()}
                >
                  {formatPreciseDecimal(activeViewport.centerX, 30)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Center Y
                </dt>
                <dd
                  className={metaValueClass}
                  data-testid="mandelbrot-center-y"
                  title={activeViewport.centerY.toString()}
                >
                  {formatPreciseDecimal(activeViewport.centerY, 30)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  View width
                </dt>
                <dd
                  className={metaValueClass}
                  data-testid="mandelbrot-width"
                  title={activeViewport.width.toString()}
                >
                  {formatPreciseDecimal(activeViewport.width, 30)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  View height
                </dt>
                <dd
                  className={metaValueClass}
                  title={activeViewport.height.toString()}
                >
                  {formatPreciseDecimal(activeViewport.height, 30)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Magnification
                </dt>
                <dd
                  className={metaValueClass}
                  data-testid="mandelbrot-magnification"
                >
                  {formatMagnification(magnification)}
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface padding="md">
            <h2 className={sectionTitleClass}>Hover inspector</h2>
            {hoverPoint ? (
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Cursor real
                  </dt>
                  <dd
                    className={metaValueClass}
                    title={hoverPoint.real.toString()}
                  >
                    {formatPreciseDecimal(hoverPoint.real, 26)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Cursor imaginary
                  </dt>
                  <dd
                    className={metaValueClass}
                    title={hoverPoint.imaginary.toString()}
                  >
                    {formatPreciseDecimal(hoverPoint.imaginary, 26)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-gray-300">
                Move over the plot to inspect the current coordinate under the
                cursor.
              </p>
            )}
          </Surface>

          <Surface padding="md">
            <h2 className={sectionTitleClass}>Implementation notes</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li>
                Viewport math uses <code>decimal.js</code> so center and scale
                updates do not rely on standard floating-point arithmetic.
              </li>
              <li>
                Rendering runs asynchronously in row chunks and cancels stale
                frames whenever the view changes.
              </li>
              <li>
                Query parameters can seed the initial center, width, backend,
                palette, quality, and iteration budget.
              </li>
            </ul>
          </Surface>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
