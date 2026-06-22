import { calculateViewportFramePlacement } from "@/features/mandelbrot/framePreview";
import {
  createViewport,
  zoomViewportAtPoint,
} from "@/features/mandelbrot/viewport";

const size = { width: 800, height: 400 };

function viewport(centerX: string, centerY: string, width: string) {
  return createViewport({
    centerX,
    centerY,
    width,
    size,
  });
}

describe("calculateViewportFramePlacement", () => {
  it("expands a completed frame around the target canvas for a centered zoom-in preview", () => {
    const placement = calculateViewportFramePlacement({
      sourceSize: size,
      sourceViewport: viewport("0", "0", "4"),
      targetSize: size,
      targetViewport: viewport("0", "0", "2"),
    });

    expect(placement).toEqual({
      x: -400,
      y: -200,
      width: 1600,
      height: 800,
    });
  });

  it("shrinks a completed frame into the target canvas for a zoom-out preview", () => {
    const placement = calculateViewportFramePlacement({
      sourceSize: size,
      sourceViewport: viewport("0", "0", "2"),
      targetSize: size,
      targetViewport: viewport("0", "0", "4"),
    });

    expect(placement).toEqual({
      x: 200,
      y: 100,
      width: 400,
      height: 200,
    });
  });

  it("keeps a cursor-anchored zoom preview pinned under the cursor", () => {
    const sourceViewport = viewport("-0.75", "0", "3.5");
    const cursor = { x: 600, y: 100 };
    const targetViewport = zoomViewportAtPoint(
      sourceViewport,
      size,
      cursor,
      0.5
    );
    const placement = calculateViewportFramePlacement({
      sourceSize: size,
      sourceViewport,
      targetSize: size,
      targetViewport,
    });

    expect(placement).not.toBeNull();

    if (!placement) {
      return;
    }

    expect(placement.x + (cursor.x / size.width) * placement.width).toBeCloseTo(
      cursor.x
    );
    expect(
      placement.y + (cursor.y / size.height) * placement.height
    ).toBeCloseTo(cursor.y);
  });

  it("skips previews that would over-scale a distant completed frame", () => {
    expect(
      calculateViewportFramePlacement({
        sourceSize: size,
        sourceViewport: viewport("-0.75", "0", "3.5"),
        targetSize: size,
        targetViewport: viewport("-0.75", "0", "1e-8"),
      })
    ).toBeNull();
  });

  it("skips previews that do not overlap the target viewport", () => {
    expect(
      calculateViewportFramePlacement({
        sourceSize: size,
        sourceViewport: viewport("10", "0", "1"),
        targetSize: size,
        targetViewport: viewport("0", "0", "1"),
      })
    ).toBeNull();
  });
});
