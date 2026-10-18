import {
  getCoverVariant,
  getCoverVariantPath,
  getCoverVariantSourceSet,
} from "@/lib/coverVariants";

describe("coverVariants", () => {
  test("returns undefined when source is missing", () => {
    expect(getCoverVariantPath(undefined, "card")).toBeUndefined();
  });

  test("returns variant path when generated asset exists on disk", () => {
    expect(
      getCoverVariantPath(
        "/assets/blog/everyone-is-a-builder/cover.webp",
        "card"
      )
    ).toBe("/assets/blog/everyone-is-a-builder/cover-card.webp");
    expect(
      getCoverVariantPath(
        "/assets/blog/everyone-is-a-builder/cover.webp",
        "hero"
      )
    ).toBe("/assets/blog/everyone-is-a-builder/cover-hero.webp");
  });

  test("returns selected variant metadata when generated asset exists", () => {
    expect(
      getCoverVariant("/assets/blog/everyone-is-a-builder/cover.webp", "hero")
    ).toEqual({
      path: "/assets/blog/everyone-is-a-builder/cover-hero.webp",
      width: 1280,
      height: 854,
    });
  });

  test("returns responsive source set when multiple generated variants exist", () => {
    expect(
      getCoverVariantSourceSet(
        "/assets/blog/everyone-is-a-builder/cover.webp",
        "card"
      )
    ).toBe(
      "/assets/blog/everyone-is-a-builder/cover-card-sm.webp 480w, /assets/blog/everyone-is-a-builder/cover-card-md.webp 640w, /assets/blog/everyone-is-a-builder/cover-card.webp 768w"
    );
    expect(
      getCoverVariantSourceSet(
        "/assets/blog/everyone-is-a-builder/cover.webp",
        "hero"
      )
    ).toBe(
      "/assets/blog/everyone-is-a-builder/cover-hero-sm.webp 640w, /assets/blog/everyone-is-a-builder/cover-hero.webp 1280w"
    );
  });

  test("normalizes relative source paths", () => {
    expect(
      getCoverVariantPath(
        "assets/blog/everyone-is-a-builder/cover.webp",
        "card"
      )
    ).toBe("/assets/blog/everyone-is-a-builder/cover-card.webp");
  });

  test("returns undefined when generated asset does not exist", () => {
    expect(
      getCoverVariantPath("/assets/blog/not-a-real-post/cover.webp", "card")
    ).toBeUndefined();
    expect(
      getCoverVariantPath("/assets/blog/not-a-real-post/cover.jpg", "hero")
    ).toBeUndefined();
  });

  test("returns undefined for source set when enough variants are unavailable", () => {
    expect(
      getCoverVariantSourceSet(
        "/assets/blog/not-a-real-post/cover.webp",
        "card"
      )
    ).toBeUndefined();
  });

  test("returns undefined when source has no extension and generated file is missing", () => {
    expect(
      getCoverVariantPath("/assets/blog/not-a-real-post/cover", "card")
    ).toBeUndefined();
  });
});
