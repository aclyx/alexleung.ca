"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { actionClassNames, fieldClassNames } from "@/components/controlStyles";
import {
  DisclosureIndicator,
  disclosureSummaryClassNames,
} from "@/components/Disclosure";
import {
  DEFAULT_RENDER,
  projectPoint,
  RENDER_HEIGHT,
  RENDER_WIDTH,
  RenderSettings,
  traceSample,
} from "@/features/playgrounds/optics";

const button = actionClassNames({ variant: "secondary", size: "sm" });
const SCENES = [
  { name: "Glass and mirror", settings: DEFAULT_RENDER },
  {
    name: "Color bleeding",
    settings: {
      ...DEFAULT_RENDER,
      polished: false,
      glass: false,
      lightX: -1.1,
    },
  },
  {
    name: "Soft shadows",
    settings: {
      ...DEFAULT_RENDER,
      polished: false,
      coloredWalls: false,
      lightX: 0.9,
      lightSize: 1.3,
    },
  },
];
export function RayWorkbench() {
  const [settings, setSettings] = useState<RenderSettings>({
    ...DEFAULT_RENDER,
  });
  const [example, setExample] = useState(0);
  const [samples, setSamples] = useState(0);
  const [limit, setLimit] = useState(32);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("");
  const [inspect, setInspect] = useState(false);
  const [pixel, setPixel] = useState({ x: 105, y: 150 });
  const [sample, setSample] = useState(0);
  const worker = useRef<Worker | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    lightX: number;
    lightZ: number;
  } | null>(null);
  const path = useMemo(
    () => traceSample(pixel.x, pixel.y, sample, settings, true),
    [pixel, sample, settings]
  );
  const light = projectPoint([settings.lightX, 2.96, settings.lightZ]);
  const complete = samples >= limit;
  useEffect(() => {
    let active = true;
    setSamples(0);
    setSample(0);
    setLimit(32);
    setPaused(false);
    setMessage("");
    let next: Worker | null = null;
    const timer = setTimeout(() => {
      next = new Worker(
        new URL(
          "../../../../features/playgrounds/optics.worker.ts",
          import.meta.url
        )
      );
      worker.current = next;
      next.onmessage = (
        event: MessageEvent<{
          pixels: Uint8ClampedArray;
          samples: number;
          done: boolean;
        }>
      ) => {
        if (!active) return;
        const ctx = canvas.current?.getContext("2d");
        if (ctx) {
          const image = ctx.createImageData(RENDER_WIDTH, RENDER_HEIGHT);
          image.data.set(event.data.pixels);
          ctx.putImageData(image, 0, 0);
        }
        setSamples(event.data.samples);
      };
      next.onerror = next.onmessageerror = () => {
        if (active) {
          setMessage("Rendering stopped. Reset the scene to try again.");
          setPaused(true);
          next?.terminate();
        }
      };
      next.postMessage({ type: "start", settings });
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
      next?.terminate();
      worker.current = null;
    };
  }, [settings]);
  function patch(change: Partial<RenderSettings>) {
    setSettings((current) => ({ ...current, ...change }));
  }
  function reset(index = example) {
    setExample(index);
    setSettings({ ...SCENES[index].settings });
    setSample(0);
  }
  function selectPixel(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPixel({
      x: Math.max(
        0,
        Math.min(
          RENDER_WIDTH - 1,
          Math.floor(((event.clientX - rect.left) / rect.width) * RENDER_WIDTH)
        )
      ),
      y: Math.max(
        0,
        Math.min(
          RENDER_HEIGHT - 1,
          Math.floor(((event.clientY - rect.top) / rect.height) * RENDER_HEIGHT)
        )
      ),
    });
    setSample(0);
  }
  return (
    <section aria-label="Ray tracing playground">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          Scene
          <select
            className={fieldClassNames({ kind: "select" })}
            value={example}
            onChange={(e) => reset(Number(e.target.value))}
          >
            {SCENES.map((scene, i) => (
              <option key={scene.name} value={i}>
                {scene.name}
              </option>
            ))}
          </select>
        </label>
        <button className={button} onClick={() => reset()}>
          Reset
        </button>
        <button
          className={button}
          disabled={complete || samples === 0}
          onClick={() => {
            worker.current?.postMessage({ type: paused ? "resume" : "pause" });
            setPaused(!paused);
          }}
        >
          {paused ? "Resume rendering" : "Pause rendering"}
        </button>
        <button
          className={button}
          disabled={!complete || limit === 128}
          onClick={() => {
            setLimit(128);
            setPaused(false);
            worker.current?.postMessage({ type: "refine" });
          }}
        >
          Refine to 128 samples
        </button>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div>
          <div
            ref={frame}
            className="relative overflow-hidden rounded-lg border border-line bg-canvas"
          >
            <canvas
              ref={canvas}
              width={RENDER_WIDTH}
              height={RENDER_HEIGHT}
              role="img"
              aria-label="Path-traced room. In inspect mode, select a pixel or use arrow keys."
              tabIndex={inspect ? 0 : -1}
              className={
                "block w-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-paper " +
                (inspect ? "cursor-crosshair touch-none" : "")
              }
              onPointerDown={(e) => {
                if (inspect) {
                  e.currentTarget.focus();
                  selectPixel(e);
                }
              }}
              onKeyDown={(e) => {
                if (!inspect) return;
                const delta = {
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                  ArrowUp: [0, -1],
                  ArrowDown: [0, 1],
                }[e.key];
                if (delta) {
                  e.preventDefault();
                  setPixel({
                    x: Math.max(
                      0,
                      Math.min(RENDER_WIDTH - 1, pixel.x + delta[0])
                    ),
                    y: Math.max(
                      0,
                      Math.min(RENDER_HEIGHT - 1, pixel.y + delta[1])
                    ),
                  });
                }
              }}
            />
            {!inspect && (
              <button
                aria-label="Move light: drag or use arrow keys"
                className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full border border-white/70 bg-black/30 text-white shadow-sm focus-visible:outline-2 focus-visible:outline-paper"
                style={{
                  left: (light.x / RENDER_WIDTH) * 100 + "%",
                  top: (light.y / RENDER_HEIGHT) * 100 + "%",
                }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = {
                    x: e.clientX,
                    y: e.clientY,
                    lightX: settings.lightX,
                    lightZ: settings.lightZ,
                  };
                }}
                onPointerMove={(e) => {
                  if (!drag.current) return;
                  const width =
                    frame.current?.getBoundingClientRect().width ?? 640;
                  patch({
                    lightX: Math.max(
                      -1.2,
                      Math.min(
                        1.2,
                        drag.current.lightX +
                          ((e.clientX - drag.current.x) / width) * 5
                      )
                    ),
                    lightZ: Math.max(
                      -1.2,
                      Math.min(
                        1.2,
                        drag.current.lightZ +
                          ((e.clientY - drag.current.y) / width) * 8
                      )
                    ),
                  });
                }}
                onPointerUp={() => {
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
                onKeyDown={(e) => {
                  const movement = {
                    ArrowLeft: [-0.1, 0],
                    ArrowRight: [0.1, 0],
                    ArrowUp: [0, -0.1],
                    ArrowDown: [0, 0.1],
                  }[e.key];
                  if (movement) {
                    e.preventDefault();
                    patch({
                      lightX: Math.max(
                        -1.2,
                        Math.min(1.2, settings.lightX + movement[0])
                      ),
                      lightZ: Math.max(
                        -1.2,
                        Math.min(1.2, settings.lightZ + movement[1])
                      ),
                    });
                  }
                }}
              >
                <span aria-hidden="true">↔</span>
              </button>
            )}
            {inspect && (
              <span
                className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-300 shadow-[0_0_0_1px_black]"
                style={{
                  left: ((pixel.x + 0.5) / RENDER_WIDTH) * 100 + "%",
                  top: ((pixel.y + 0.5) / RENDER_HEIGHT) * 100 + "%",
                }}
              />
            )}
            {samples === 0 && (
              <span className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/60 px-3 py-2 text-sm text-white">
                Rendering the scene…
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-muted">
            <span role="status">
              {message ||
                (complete
                  ? "Render complete"
                  : paused
                    ? "Paused"
                    : "Rendering") +
                  " · " +
                  samples +
                  " / " +
                  limit +
                  " samples per pixel"}
            </span>
            <span>320 × 240 · sampled light transport</span>
          </div>
          <p className="mt-3 text-body-sm text-muted">
            {inspect
              ? "Select a pixel to inspect one of its sampled paths."
              : "Drag the light handle. Watch the shadows and reflections move."}{" "}
            Grain decreases as samples accumulate.
          </p>
        </div>
        <div className="space-y-4">
          <label className="grid gap-1 text-sm">
            Surface interactions
            <select
              aria-label="Surface interactions"
              className={fieldClassNames({ kind: "select" })}
              value={settings.bounces}
              onChange={(e) => patch({ bounces: Number(e.target.value) })}
            >
              <option value="1">1 · direct lighting</option>
              <option value="3">3 · short paths</option>
              <option value="6">6 · indirect lighting</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Left sphere
            <select
              className={fieldClassNames({ kind: "select" })}
              value={settings.polished ? "mirror" : "matte"}
              onChange={(e) => patch({ polished: e.target.value === "mirror" })}
            >
              <option value="mirror">Polished mirror</option>
              <option value="matte">Matte surface</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.glass}
              onChange={(e) => patch({ glass: e.target.checked })}
            />{" "}
            Glass sphere
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.coloredWalls}
              onChange={(e) => patch({ coloredWalls: e.target.checked })}
            />{" "}
            Colored walls
          </label>
          <label className="grid gap-1 text-sm">
            <span>Light width · {settings.lightSize.toFixed(2)}</span>
            <input
              aria-label="Light width"
              className="min-h-11 w-full accent-accent-link"
              type="range"
              min="0.25"
              max="1.4"
              step="0.05"
              value={settings.lightSize}
              onChange={(e) => patch({ lightSize: Number(e.target.value) })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Light left / right</span>
            <input
              aria-label="Light horizontal position"
              className="min-h-11 w-full accent-accent-link"
              type="range"
              min="-1.2"
              max="1.2"
              step="0.1"
              value={settings.lightX}
              onChange={(e) => patch({ lightX: Number(e.target.value) })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Light back / front</span>
            <input
              aria-label="Light depth"
              className="min-h-11 w-full accent-accent-link"
              type="range"
              min="-1.2"
              max="1.2"
              step="0.1"
              value={settings.lightZ}
              onChange={(e) => patch({ lightZ: Number(e.target.value) })}
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 border-t border-line pt-3 text-sm">
            <input
              type="checkbox"
              checked={inspect}
              onChange={(e) => setInspect(e.target.checked)}
            />{" "}
            Inspect a pixel
          </label>
        </div>
      </div>
      {inspect && (
        <div className="mt-6 grid items-start gap-5 border-t border-line pt-5 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-heading-sm">
              One sampled path · plan view
            </h2>
            <svg
              viewBox="0 0 360 340"
              role="img"
              aria-label="Selected sample path viewed from above; heights are flattened"
              className="w-full rounded border border-line bg-surface"
            >
              <defs>
                <marker
                  id="ray-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0L10 5L0 10Z" fill="currentColor" />
                </marker>
              </defs>
              <rect
                x="60"
                y="30"
                width="240"
                height="240"
                fill="#f0eee4"
                stroke="#858c95"
              />
              <path d="M60 30V270" stroke="#b87862" strokeWidth="6" />
              <path d="M300 30V270" stroke="#719da7" strokeWidth="6" />
              <circle
                cx={180 - 0.82 * 60}
                cy={150 - 0.25 * 60}
                r={0.68 * 60}
                fill="#d4d6d3"
                stroke="#737a7a"
              />
              {settings.glass && (
                <circle
                  cx={180 + 0.75 * 60}
                  cy={150 + 0.45 * 60}
                  r={0.76 * 60}
                  fill="#bed6db"
                  fillOpacity=".5"
                  stroke="#769ba2"
                />
              )}
              <rect
                x={180 + (settings.lightX - settings.lightSize / 2) * 60}
                y={150 + (settings.lightZ - settings.lightSize / 2) * 60}
                width={settings.lightSize * 60}
                height={settings.lightSize * 60}
                fill="#ecd691"
                stroke="#bca05d"
              />
              {path.segments.map((segment, i) => (
                <g
                  key={i}
                  style={{
                    color:
                      segment.kind === "path"
                        ? "#285296"
                        : segment.kind === "light"
                          ? "#aa7720"
                          : "#858c95",
                  }}
                >
                  <line
                    x1={180 + segment.from[0] * 60}
                    y1={Math.min(320, 150 + segment.from[2] * 60)}
                    x2={180 + segment.to[0] * 60}
                    y2={Math.min(320, 150 + segment.to[2] * 60)}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeDasharray={
                      segment.kind === "path" ? undefined : "4 3"
                    }
                    markerEnd="url(#ray-arrow)"
                  />
                  <circle
                    cx={180 + segment.to[0] * 60}
                    cy={Math.min(320, 150 + segment.to[2] * 60)}
                    r="3"
                    fill="currentColor"
                  />
                </g>
              ))}
              <text
                x="180"
                y="335"
                textAnchor="middle"
                fontSize="12"
                fill="#58616d"
              >
                Camera · height is flattened in this view
              </text>
            </svg>
          </div>
          <div className="space-y-3 text-body-sm">
            <p className="font-mono text-sm">
              Pixel {pixel.x}, {pixel.y} · sample {sample + 1}
            </p>
            <button
              className={button}
              disabled={sample + 1 >= samples}
              onClick={() => setSample((value) => value + 1)}
            >
              Next sampled path
            </button>
            <ol className="space-y-2">
              {path.events.map((event, i) => (
                <li key={i}>
                  {i + 1}. {event}
                </li>
              ))}
            </ol>
            <p className="text-muted">
              Blue follows the camera path. Dashed gold tests a direct
              connection to the light; gray means it is blocked. This is one
              actual sample used by the renderer, not the whole pixel average.
              Some samples contribute no light.
            </p>
          </div>
        </div>
      )}
      <details className="group mt-5 border-t border-line">
        <summary className={disclosureSummaryClassNames()}>
          Rendering model
          <DisclosureIndicator />
        </summary>
        <div className="max-w-3xl space-y-3 px-4 py-3 text-body-sm text-muted">
          <p>
            A pinhole camera samples paths through a 3D room. Matte surfaces use
            cosine-weighted diffuse scattering and explicit area-light sampling.
            The mirror is ideal; glass uses Snell refraction, total internal
            reflection, and a Schlick Fresnel approximation at index 1.5.
          </p>
          <p>
            Paths stop at the selected interaction limit. Shadows treat glass as
            an occluder for direct-light samples, so focused glass caustics are
            poorly sampled here. No spectral dispersion, participating media, or
            denoising. Brightness uses a fixed display tone map.
          </p>
          <p>
            The light’s emitted radiance stays fixed as its size changes: a
            larger source is softer and also emits more total power. Rendering
            is bounded to 32 samples, or 128 on request, in a cancellable
            worker.
          </p>
          <a
            className="text-accent-link underline"
            href="https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer"
          >
            Path tracing and light sampling
          </a>
        </div>
      </details>
    </section>
  );
}
