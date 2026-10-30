"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  actionClassNames,
  controlLabelClassNames,
  fieldClassNames,
} from "@/components/controlStyles";
import {
  DisclosureIndicator,
  disclosureSummaryClassNames,
} from "@/components/Disclosure";
import {
  energyMap,
  lowestSeam,
  paintProtection,
  Raster,
  sampleImage,
} from "@/features/playgrounds/seams";

const button = actionClassNames({ variant: "secondary", size: "sm" });
const PHOTOS = [
  {
    id: "portrait",
    name: "Portrait",
    src: "/assets/alex_mountain.webp",
    note: "Alex in the mountains. Compare the subject’s width with the background.",
  },
  {
    id: "trailer",
    name: "Trailer · straight edges",
    src: "/assets/blog/trip-to-southern-utah/ofland-airstream-content.webp",
    note: "Straight edges expose distortion. Protection can help, but it cannot preserve everything.",
  },
  {
    id: "pattern",
    name: "Repeating windows",
    src: "",
    note: "Low gradient energy does not always mean unimportant.",
  },
];

function put(
  canvas: HTMLCanvasElement | null,
  image: Raster,
  inspect = false,
  cursor?: { x: number; y: number }
) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const data = ctx.createImageData(image.width, image.height);
  data.data.set(image.pixels);
  const energy = inspect ? energyMap(image) : null;
  let maximum = 1;
  if (energy)
    for (const value of energy)
      if (Number.isFinite(value)) maximum = Math.max(maximum, value);
  for (let i = 0; i < image.width * image.height; i++) {
    if (energy)
      data.data.fill(
        Math.round(Math.min(1, energy[i] / maximum) * 255),
        i * 4,
        i * 4 + 3
      );
    if (cursor && image.protected[i]) {
      data.data[i * 4] *= 0.4;
      data.data[i * 4 + 1] = 150 + data.data[i * 4 + 1] * 0.4;
      data.data[i * 4 + 2] *= 0.4;
    }
  }
  ctx.putImageData(data, 0, 0);
  if (inspect && energy) {
    const seam = lowestSeam(energy, image.width, image.height);
    if (seam) {
      ctx.strokeStyle = "#f2458a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      seam.forEach((x, y) => (y ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
  }
  if (cursor) {
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "#203c38";
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }
}

function RasterView({
  image,
  label,
  inspect = false,
}: {
  image: Raster;
  label: string;
  inspect?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => put(canvas.current, image, inspect), [image, inspect]);
  return (
    <canvas
      ref={canvas}
      width={image.width}
      height={image.height}
      className="block w-full"
      role="img"
      aria-label={label}
    />
  );
}
function Comparison({
  original,
  width,
  crop,
}: {
  original: Raster;
  width: number;
  crop: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const source = document.createElement("canvas");
    source.width = original.width;
    source.height = original.height;
    put(source, original);
    if (crop)
      ctx.drawImage(
        source,
        (original.width - width) / 2,
        0,
        width,
        original.height,
        0,
        0,
        width,
        original.height
      );
    else ctx.drawImage(source, 0, 0, width, original.height);
  }, [original, width, crop]);
  return (
    <canvas
      ref={canvas}
      width={width}
      height={original.height}
      className="block w-full"
      role="img"
      aria-label={
        crop
          ? "Center crop at the same output size"
          : "Ordinary scaling at the same output size"
      }
    />
  );
}

export function SeamCarver() {
  const [original, setOriginal] = useState<Raster | null>(null);
  const [result, setResult] = useState<Raster | null>(null);
  const [example, setExample] = useState("portrait");
  const [percent, setPercent] = useState(72);
  const [protecting, setProtecting] = useState(false);
  const [useProtection, setUseProtection] = useState(true);
  const [erase, setErase] = useState(false);
  const [painting, setPainting] = useState(false);
  const [cursor, setCursor] = useState({ x: 320, y: 210 });
  const [inspect, setInspect] = useState(false);
  const [comparison, setComparison] = useState("carve");
  const [busy, setBusy] = useState(true);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("Opening photograph…");
  const sourceCanvas = useRef<HTMLCanvasElement>(null);
  const version = useRef(0);
  const worker = useRef<Worker | null>(null);
  const target = original
    ? Math.max(2, Math.round((original.width * percent) / 100))
    : 0;
  const maskCount = useMemo(
    () => original?.protected.reduce((sum, value) => sum + value, 0) ?? 0,
    [original]
  );

  async function openImage(url: string, name: string, revoke = false) {
    const request = ++version.current;
    worker.current?.terminate();
    setBusy(true);
    setPaused(true);
    setMessage("Opening image…");
    try {
      const decoded = new Image();
      decoded.src = url;
      await decoded.decode();
      if (request !== version.current) return;
      if (decoded.naturalWidth * decoded.naturalHeight > 40_000_000)
        throw new Error("Use an image under 40 megapixels.");
      const scale = Math.min(
        1,
        640 / decoded.naturalWidth,
        420 / decoded.naturalHeight
      );
      const width = Math.max(2, Math.round(decoded.naturalWidth * scale)),
        height = Math.max(2, Math.round(decoded.naturalHeight * scale));
      const surface = document.createElement("canvas");
      surface.width = width;
      surface.height = height;
      const ctx = surface.getContext("2d");
      if (!ctx) throw new Error("Image processing is unavailable.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(decoded, 0, 0, width, height);
      const image = {
        width,
        height,
        pixels: ctx.getImageData(0, 0, width, height).data,
        protected: new Uint8Array(width * height),
      };
      setOriginal(image);
      setResult(image);
      setCursor({ x: Math.floor(width / 2), y: Math.floor(height / 2) });
      setExample(name);
      setPercent(width <= 4 ? 100 : 72);
      setPaused(false);
      setMessage("");
    } catch (error) {
      if (request === version.current) {
        setBusy(false);
        setMessage(
          error instanceof Error ? error.message : "Could not open that image."
        );
      }
    } finally {
      if (revoke) URL.revokeObjectURL(url);
    }
  }

  useEffect(() => {
    void openImage(PHOTOS[0].src, PHOTOS[0].id);
    return () => {
      version.current++;
      worker.current?.terminate();
    };
  }, []);
  useEffect(() => {
    if (!original || paused || painting) return;
    setBusy(true);
    let next: Worker | null = null;
    let active = true;
    const timer = setTimeout(() => {
      next = new Worker(
        new URL(
          "../../../../features/playgrounds/seams.worker.ts",
          import.meta.url
        )
      );
      worker.current = next;
      next.onmessage = (
        event: MessageEvent<{ image: Raster; done: boolean; blocked: boolean }>
      ) => {
        if (!active) return;
        setResult(event.data.image);
        setBusy(!event.data.done);
        setMessage(
          event.data.blocked
            ? "Protection blocks every remaining seam. Erase some protection or choose a wider result."
            : ""
        );
        if (event.data.done) next?.terminate();
      };
      next.onerror = next.onmessageerror = () => {
        if (active) {
          setBusy(false);
          setMessage("Image processing stopped. Try another image or reset.");
          next?.terminate();
        }
      };
      next.postMessage({
        image: useProtection
          ? original
          : {
              ...original,
              protected: new Uint8Array(original.width * original.height),
            },
        width: target,
      });
    }, 100);
    return () => {
      active = false;
      clearTimeout(timer);
      next?.terminate();
    };
  }, [original, target, paused, painting, useProtection]);
  useEffect(() => {
    if (original) put(sourceCanvas.current, original, false, cursor);
  }, [original, cursor, protecting]);

  function selectExample(value: string) {
    setProtecting(false);
    setPainting(false);
    if (value === "pattern") {
      version.current++;
      worker.current?.terminate();
      const image = sampleImage(true);
      setOriginal(image);
      setResult(image);
      setExample(value);
      setCursor({ x: image.width / 2, y: image.height / 2 });
      setPercent(72);
      setPaused(false);
      setMessage("");
      return;
    }
    const photo = PHOTOS.find((item) => item.id === value);
    if (photo) void openImage(photo.src, photo.id);
  }
  function paint(x: number, y: number) {
    setCursor({ x, y });
    setUseProtection(true);
    setOriginal((image) =>
      image ? paintProtection(image, x, y, 18, !erase) : image
    );
    setPaused(false);
  }
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          (original?.width ?? 1) - 1,
          Math.floor(
            ((event.clientX - rect.left) / rect.width) * (original?.width ?? 1)
          )
        )
      ),
      y: Math.max(
        0,
        Math.min(
          (original?.height ?? 1) - 1,
          Math.floor(
            ((event.clientY - rect.top) / rect.height) * (original?.height ?? 1)
          )
        )
      ),
    };
  }
  return (
    <section aria-label="Seam carving playground">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className={controlLabelClassNames({ className: "text-sm" })}>
          Image
          <select
            className={fieldClassNames({ kind: "select" })}
            value={example}
            onChange={(e) => selectExample(e.target.value)}
          >
            {PHOTOS.map((photo) => (
              <option key={photo.id} value={photo.id}>
                {photo.name}
              </option>
            ))}
            {example === "uploaded" && (
              <option value="uploaded">Your image</option>
            )}
          </select>
        </label>
        <label
          className={controlLabelClassNames({
            className: "max-w-full text-sm",
          })}
        >
          Open image
          <input
            className="min-h-11 w-full max-w-64 rounded border border-control-border p-2"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              version.current++;
              worker.current?.terminate();
              setBusy(false);
              setPaused(true);
              if (
                !["image/png", "image/jpeg", "image/webp"].includes(
                  file.type
                ) ||
                file.size > 8 * 1024 * 1024
              ) {
                setMessage("Choose a PNG, JPEG, or WebP under 8 MB.");
                return;
              }
              void openImage(URL.createObjectURL(file), "uploaded", true);
            }}
          />
        </label>
        <button
          className={button}
          aria-expanded={protecting}
          aria-controls="protection-editor"
          disabled={!original}
          onClick={() => setProtecting(!protecting)}
        >
          Paint protection
        </button>
        <button
          className={button}
          disabled={!original}
          onClick={() => {
            version.current++;
            worker.current?.terminate();
            setPaused(false);
            setPercent(100);
            setPainting(false);
            setUseProtection(true);
            setMessage("");
            setOriginal((image) =>
              image
                ? {
                    ...image,
                    protected: new Uint8Array(image.width * image.height),
                  }
                : image
            );
          }}
        >
          Reset
        </button>
      </div>
      {maskCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-5 text-body-sm">
          <label className={controlLabelClassNames({ layout: "inline" })}>
            <input
              type="checkbox"
              checked={useProtection}
              onChange={(e) => {
                setUseProtection(e.target.checked);
                setPaused(false);
              }}
            />
            Use painted protection
          </label>
          <p data-testid="protected-pixels">
            {maskCount.toLocaleString("en-US")} painted pixels ·{" "}
            {useProtection ? "protection on" : "protection off"}
          </p>
          <p className="text-muted">
            Switch off to compare without clearing the mask.
          </p>
        </div>
      )}
      <div className="mb-6 grid gap-3 border-y border-line py-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <label
          className={controlLabelClassNames({ className: "text-body-sm" })}
        >
          <span className="flex justify-between gap-3">
            <span>Output width</span>
            <span className="font-mono text-sm">
              {percent}% · {target || "—"} px
            </span>
          </span>
          <input
            aria-label="Output width"
            className={fieldClassNames({ kind: "range" })}
            type="range"
            min="50"
            max="100"
            value={percent}
            disabled={!original}
            onChange={(e) => {
              setPercent(Number(e.target.value));
              setPaused(false);
            }}
          />
        </label>
        <button
          className={button}
          disabled={!original || (!busy && !paused)}
          onClick={() => {
            if (!paused) {
              worker.current?.terminate();
              setBusy(false);
            }
            setPaused(!paused);
          }}
        >
          {paused ? "Resume resizing" : "Pause resizing"}
        </button>
      </div>
      {protecting && original && (
        <div
          id="protection-editor"
          className="mb-6 grid gap-4 md:grid-cols-[minmax(0,2fr)_1fr]"
        >
          <canvas
            ref={sourceCanvas}
            width={original.width}
            height={original.height}
            className="order-2 block w-full touch-none rounded border border-control-border focus-visible:outline-2 focus-visible:outline-accent-link md:order-1"
            role="img"
            tabIndex={0}
            aria-label="Paint protection on the original image. Arrow keys move the brush; Enter paints."
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.focus();
              setPainting(true);
              const p = point(e);
              paint(p.x, p.y);
            }}
            onPointerMove={(e) => {
              if (painting) {
                const p = point(e);
                paint(p.x, p.y);
              }
            }}
            onPointerUp={() => setPainting(false)}
            onPointerCancel={() => setPainting(false)}
            onKeyDown={(e) => {
              const moves: Record<string, [number, number]> = {
                ArrowLeft: [-8, 0],
                ArrowRight: [8, 0],
                ArrowUp: [0, -8],
                ArrowDown: [0, 8],
              };
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                paint(cursor.x, cursor.y);
              } else if (moves[e.key]) {
                e.preventDefault();
                setCursor({
                  x: Math.max(
                    0,
                    Math.min(original.width - 1, cursor.x + moves[e.key][0])
                  ),
                  y: Math.max(
                    0,
                    Math.min(original.height - 1, cursor.y + moves[e.key][1])
                  ),
                });
              }
            }}
          />
          <div className="order-1 space-y-3 text-body-sm md:order-2">
            <h2 className="text-heading-sm">Paint what should stay</h2>
            <p>
              Brush over the subject in the original image. Green pixels cannot
              be removed while protection is on. Release to recalculate.
            </p>
            <p className="text-muted">
              There is no automatic subject selection. Painting may leave the
              result unchanged if the seams already avoid that area.
            </p>
            <label className={controlLabelClassNames({ layout: "inline" })}>
              <input
                type="checkbox"
                checked={erase}
                onChange={(e) => setErase(e.target.checked)}
              />{" "}
              Erase protection
            </label>
            <button
              className={button}
              disabled={maskCount === 0}
              onClick={() => {
                setOriginal({
                  ...original,
                  protected: new Uint8Array(original.width * original.height),
                });
                setPaused(false);
              }}
            >
              Clear protection
            </button>
            {maskCount === 0 && <p>Nothing painted yet.</p>}
          </div>
        </div>
      )}
      <p className="mb-4 min-h-6 text-body-sm" role="status">
        {message ||
          (busy ? "Resizing… " : paused ? "Paused. " : "Ready. ") +
            (result ? result.width + " × " + result.height + " px" : "")}
      </p>
      {original && result ? (
        <>
          <div
            className="mb-4 flex gap-2 md:hidden"
            aria-label="Comparison view"
          >
            {[
              ["carve", "Carve"],
              ["scale", "Scale"],
              ["crop", "Crop"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={
                  button +
                  (comparison === id
                    ? " border-accent-link bg-accent-secondary-soft"
                    : "")
                }
                aria-pressed={comparison === id}
                onClick={() => setComparison(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid items-start gap-5 md:grid-cols-3">
            <figure className={comparison === "carve" ? "" : "hidden md:block"}>
              <figcaption className="mb-2 flex justify-between gap-2 text-heading-sm">
                <span>Seam carving</span>
                <span
                  className="font-mono text-xs leading-7"
                  data-testid="carved-size"
                >
                  {result.width} × {result.height}
                </span>
              </figcaption>
              <div className="overflow-hidden rounded border border-line">
                <RasterView
                  image={result}
                  label="Content-aware resized photograph"
                />
              </div>
              <p className="mt-2 text-sm text-muted">
                Removes paths through the image.
              </p>
            </figure>
            <figure className={comparison === "scale" ? "" : "hidden md:block"}>
              <figcaption className="mb-2 text-heading-sm">
                Ordinary scaling
              </figcaption>
              <div className="overflow-hidden rounded border border-line">
                <Comparison
                  original={original}
                  width={result.width}
                  crop={false}
                />
              </div>
              <p className="mt-2 text-sm text-muted">
                Squeezes everything equally.
              </p>
            </figure>
            <figure className={comparison === "crop" ? "" : "hidden md:block"}>
              <figcaption className="mb-2 text-heading-sm">
                Center crop
              </figcaption>
              <div className="overflow-hidden rounded border border-line">
                <Comparison original={original} width={result.width} crop />
              </div>
              <p className="mt-2 text-sm text-muted">
                Keeps shapes; loses the edges.
              </p>
            </figure>
          </div>
          <p className="mt-4 text-body-sm text-muted">
            {PHOTOS.find((photo) => photo.id === example)?.note ??
              "Your image stays in this browser."}{" "}
            All three outputs have the same dimensions
            {busy ? " as resizing progresses" : ""}.
          </p>
          <details
            className="mt-6 border-t border-line pt-3"
            onToggle={(e) => setInspect(e.currentTarget.open)}
          >
            <summary className={disclosureSummaryClassNames()}>
              <DisclosureIndicator /> Inspect the seams
            </summary>
            {inspect && (
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <figure>
                  <figcaption className="mb-2 text-body-sm">
                    Gradient energy · pink is the next seam
                  </figcaption>
                  <RasterView
                    image={result}
                    label="Gradient energy and next minimum-energy seam"
                    inspect
                  />
                </figure>
                <div className="space-y-3 text-body-sm text-muted">
                  <p>
                    Each step removes a connected top-to-bottom path with the
                    lowest total RGB-gradient energy, then recalculates. Low
                    energy is not the same as low importance: faces, lines, and
                    repeated patterns can still bend.
                  </p>
                  <p>
                    Protected pixels have infinite cost. Vertical removal stops
                    at half width or when no unprotected path remains.
                  </p>
                  <p>
                    Processing runs in a worker at up to 640 × 420 pixels. PNG,
                    JPEG, and WebP files stay local; no image is uploaded.
                  </p>
                  <a
                    className="text-accent-link underline"
                    href="https://www.merl.com/publications/TR2007-087"
                  >
                    Seam-carving paper
                  </a>
                </div>
              </div>
            )}
          </details>
        </>
      ) : (
        <div className="flex aspect-[3/1] items-center justify-center rounded border border-line text-muted">
          Opening the comparison…
        </div>
      )}
    </section>
  );
}
