import { MandelbrotSettings } from "@/features/mandelbrot/types";
import {
  parseSettingsFromQuery,
  parseViewportFromQuery,
} from "@/features/mandelbrot/urlState";

const size = { width: 800, height: 400 };
const fallbackSettings: MandelbrotSettings = {
  maxIterations: 180,
  paletteId: "ember",
  resolutionScale: 0.5,
  renderBackendPreference: "auto",
};

describe("parseViewportFromQuery", () => {
  it.each(["1e-40", "8"])(
    "accepts the supported viewport-width boundary %s",
    (width) => {
      const viewport = parseViewportFromQuery(
        {
          cx: "-0.743643887037151",
          cy: "0.13182590420533",
          w: width,
        },
        size
      );

      expect(viewport?.width.eq(width)).toBe(true);
    }
  );

  it.each(["0", "-1", "1e-41", "8.0000001", "1e100"])(
    "rejects the unsupported viewport width %s",
    (width) => {
      expect(
        parseViewportFromQuery(
          {
            cx: "-0.75",
            cy: "0",
            w: width,
          },
          size
        )
      ).toBeNull();
    }
  );

  it.each([
    { cx: "0 trailing", cy: "0", w: "3.5" },
    { cx: "0", cy: "0.1px", w: "3.5" },
    { cx: "0", cy: "0", w: "3.5junk" },
    { cx: ["0", "1"], cy: "0", w: "3.5" },
    { cx: "0".repeat(129), cy: "0", w: "3.5" },
  ])("rejects malformed or overlong decimal query values", (query) => {
    expect(parseViewportFromQuery(query, size)).toBeNull();
  });
});

describe("parseSettingsFromQuery", () => {
  it("parses a complete strict settings query", () => {
    expect(
      parseSettingsFromQuery(
        {
          iter: "4000",
          quality: ".75",
          palette: "glacier",
          mode: "bands",
          backend: "webgpu",
        },
        fallbackSettings
      )
    ).toEqual({
      maxIterations: 4000,
      resolutionScale: 0.75,
      paletteId: "glacier",
      renderBackendPreference: "webgpu",
    });
  });

  it("ignores the retired coloring-mode query without disturbing supported settings", () => {
    expect(
      parseSettingsFromQuery(
        {
          mode: "bands",
          palette: "glacier",
          quality: "0.75",
        },
        fallbackSettings
      )
    ).toEqual({
      ...fallbackSettings,
      paletteId: "glacier",
      resolutionScale: 0.75,
    });
  });

  it("clamps a strict integer iteration request to the public maximum", () => {
    expect(
      parseSettingsFromQuery({ iter: "999999" }, fallbackSettings).maxIterations
    ).toBe(4000);
  });

  it.each([
    { iter: "200px" },
    { iter: "200.0" },
    { iter: "-200" },
    { iter: "24" },
    { quality: "0.6" },
    { quality: "1.0junk" },
    { palette: "neon" },
    { backend: "force" },
  ])(
    "falls back for an invalid setting without disturbing the rest",
    (query) => {
      expect(parseSettingsFromQuery(query, fallbackSettings)).toEqual(
        fallbackSettings
      );
    }
  );
});
