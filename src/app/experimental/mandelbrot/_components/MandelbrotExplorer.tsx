"use client";

import { useEffect, useState } from "react";

import { LinkText } from "@/components/LinkText";
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
  replaceViewport,
  undoViewport,
  ViewportHistory,
} from "@/features/mandelbrot/history";
import { PALETTE_OPTIONS } from "@/features/mandelbrot/palettes";
import {
  MandelbrotSettings,
  PixelSize,
  PreciseViewport,
} from "@/features/mandelbrot/types";
import {
  parseSettingsFromQuery,
  parseViewportFromQuery,
} from "@/features/mandelbrot/urlState";
import {
  createDefaultViewport,
  magnificationFromViewport,
  panViewport,
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
  paletteId: "ember",
  resolutionScale: 1,
  renderBackendPreference: "auto",
};

const DEFAULT_CPU_SETTINGS: MandelbrotSettings = {
  maxIterations: 180,
  paletteId: "ember",
  resolutionScale: 0.5,
  renderBackendPreference: "auto",
};

const metaValueClass = "break-all text-sm text-ink";
const settingsControlClass =
  "mt-1 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-accent-link focus:outline-none focus:ring-1 focus:ring-accent-link";
const moveButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-accent-link/50 hover:bg-accent-secondary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-link";
const disclosureSummaryClass =
  "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-secondary-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-link [&::-webkit-details-marker]:hidden";
const EXPERIMENT_ID = "mandelbrot_explorer";

function isPaletteId(value: string): value is MandelbrotSettings["paletteId"] {
  return PALETTE_OPTIONS.some((option) => option.id === value);
}

function DisclosureIndicator() {
  return (
    <span
      aria-hidden="true"
      className="text-lg font-normal leading-none text-muted transition-transform group-open:rotate-90"
    >
      ›
    </span>
  );
}

export function MandelbrotExplorer() {
  const [history, setHistory] = useState<ViewportHistory>(() =>
    createViewportHistory(createDefaultViewport(DEFAULT_CANVAS_SIZE))
  );
  const [previewViewport, setPreviewViewport] =
    useState<PreciseViewport | null>(null);
  const [canvasSize, setCanvasSize] = useState(DEFAULT_CANVAS_SIZE);
  const [settings, setSettings] = useState(DEFAULT_CPU_SETTINGS);

  const activeViewport = previewViewport ?? history.present;
  const defaultViewport = createDefaultViewport(canvasSize);
  const magnificationLabel = formatMagnification(
    magnificationFromViewport(activeViewport)
  );

  useEffect(() => {
    let isMounted = true;

    const currentSearchParams = Object.fromEntries(
      new URLSearchParams(window.location.search).entries()
    );
    const parsedViewport = parseViewportFromQuery(
      currentSearchParams,
      DEFAULT_CANVAS_SIZE
    );

    setSettings(
      parseSettingsFromQuery(currentSearchParams, DEFAULT_CPU_SETTINGS)
    );

    if (parsedViewport) {
      setHistory(createViewportHistory(parsedViewport));
    }

    void detectWebGpuAvailability()
      .then((gpuAvailability) => {
        if (!isMounted) {
          return;
        }

        setSettings(
          parseSettingsFromQuery(
            currentSearchParams,
            gpuAvailability.isAvailable
              ? DEFAULT_GPU_SETTINGS
              : DEFAULT_CPU_SETTINGS
          )
        );
      })
      .catch(() => {
        // The CPU defaults are already active.
      });

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

  function handleZoom(multiplier: number) {
    trackMandelbrotInteraction(multiplier < 1 ? "zoom_in" : "zoom_out", {
      source: "canvas_toolbar",
    });
    zoomAroundCenter(multiplier);
  }

  function handleReset() {
    trackMandelbrotInteraction("reset_view", { source: "canvas_toolbar" });
    commitViewport(defaultViewport);
  }

  function handleBack() {
    trackMandelbrotInteraction("back_view", { source: "canvas_toolbar" });
    setPreviewViewport(null);
    setHistory((currentHistory) => undoViewport(currentHistory));
  }

  function handlePaletteChange(paletteId: MandelbrotSettings["paletteId"]) {
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
  }

  function handlePan(direction: "left" | "right" | "up" | "down") {
    const step = 0.12;
    const delta = {
      left: { x: canvasSize.width * step, y: 0 },
      right: { x: -canvasSize.width * step, y: 0 },
      up: { x: 0, y: canvasSize.height * step },
      down: { x: 0, y: -canvasSize.height * step },
    }[direction];

    trackMandelbrotInteraction("pan_view", {
      direction,
      source: "pan_controls",
    });
    commitViewport(panViewport(activeViewport, canvasSize, delta));
  }

  function handleIterationsChange(value: string) {
    const nextIterations = Number(value);

    if (!Number.isSafeInteger(nextIterations)) {
      return;
    }

    setSettings((currentSettings) => ({
      ...currentSettings,
      maxIterations: Math.min(Math.max(nextIterations, 25), 4000),
    }));
  }

  return (
    <ResponsiveContainer element="section" variant="wide" className="space-y-6">
      <div className="max-w-3xl" data-testid="experiment-intro">
        <p className="text-body-lg leading-relaxed text-muted">
          Explore the Mandelbrot set in your browser. It keeps precise
          coordinates at every zoom level.{" "}
          <LinkText href="/blog/small-interactive-tools-with-a-coding-agent/">
            A short build note
          </LinkText>
          {" explains how it works."}
        </p>
      </div>

      <div className="space-y-4">
        <MandelbrotCanvas
          viewport={activeViewport}
          settings={settings}
          canGoBack={history.past.length > 0}
          magnificationLabel={magnificationLabel}
          onCanvasSizeChange={setCanvasSize}
          onPreviewViewport={setPreviewViewport}
          onCommitViewport={commitViewport}
          onBack={handleBack}
          onZoomIn={() => handleZoom(0.5)}
          onZoomOut={() => handleZoom(2)}
          onReset={handleReset}
        />

        <div className="grid gap-3 md:grid-cols-2 md:items-start">
          <Surface
            element="details"
            padding="none"
            className="group overflow-hidden"
          >
            <summary className={disclosureSummaryClass}>
              <span>Render settings</span>
              <DisclosureIndicator />
            </summary>
            <div className="grid gap-3 border-t border-line p-4">
              <label className="text-sm font-medium text-ink">
                Palette
                <select
                  className={settingsControlClass}
                  aria-label="Color palette"
                  value={settings.paletteId}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (!isPaletteId(value)) {
                      return;
                    }

                    handlePaletteChange(value);
                  }}
                >
                  {PALETTE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Maximum iterations
                <input
                  type="number"
                  min={25}
                  max={4000}
                  step={25}
                  className={settingsControlClass}
                  value={settings.maxIterations}
                  onChange={(event) =>
                    handleIterationsChange(event.target.value)
                  }
                />
              </label>
            </div>
          </Surface>

          <Surface
            element="details"
            padding="none"
            className="group overflow-hidden"
          >
            <summary className={disclosureSummaryClass}>
              <span>Coordinates</span>
              <DisclosureIndicator />
            </summary>
            <div className="grid gap-4 border-t border-line p-4">
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Move view
                </legend>
                <div className="mt-2 grid w-fit grid-cols-3 gap-2">
                  <button
                    type="button"
                    aria-label="Pan up"
                    className={`${moveButtonClass} col-start-2`}
                    onClick={() => handlePan("up")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Pan left"
                    className={`${moveButtonClass} row-start-2`}
                    onClick={() => handlePan("left")}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Pan right"
                    className={`${moveButtonClass} col-start-3 row-start-2`}
                    onClick={() => handlePan("right")}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    aria-label="Pan down"
                    className={`${moveButtonClass} col-start-2 row-start-3`}
                    onClick={() => handlePan("down")}
                  >
                    ↓
                  </button>
                </div>
              </fieldset>

              <dl className="grid gap-3 border-t border-line pt-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Center X
                  </dt>
                  <dd
                    data-testid="viewport-center-x"
                    className={metaValueClass}
                  >
                    {formatPreciseDecimal(activeViewport.centerX, 18)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Center Y
                  </dt>
                  <dd
                    data-testid="viewport-center-y"
                    className={metaValueClass}
                  >
                    {formatPreciseDecimal(activeViewport.centerY, 18)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    View width
                  </dt>
                  <dd data-testid="viewport-width" className={metaValueClass}>
                    {formatPreciseDecimal(activeViewport.width, 18)}
                  </dd>
                </div>
              </dl>
            </div>
          </Surface>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
