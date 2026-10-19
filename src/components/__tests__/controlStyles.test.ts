import {
  actionClassNames,
  controlLabelClassNames,
  fieldClassNames,
  type ActionVariant,
} from "../controlStyles";

const actionVariants: ReadonlyArray<{
  variant: ActionVariant;
  expectedClass: string;
}> = [
  { variant: "primary", expectedClass: "bg-accent-primary" },
  { variant: "secondary", expectedClass: "border-control-border" },
  { variant: "quiet", expectedClass: "bg-transparent" },
];

describe("control styles", () => {
  it.each(actionVariants)(
    "returns the $variant action treatment",
    ({ variant, expectedClass }) => {
      expect(actionClassNames({ variant })).toContain(expectedClass);
    }
  );

  it("supports compact actions and caller classes", () => {
    const className = actionClassNames({
      size: "sm",
      className: "w-full",
    });

    expect(className).toContain("min-h-11");
    expect(className).toContain("px-3");
    expect(className).toContain("w-full");
  });

  it("uses the semantic control border for fields", () => {
    expect(fieldClassNames()).toContain("border-control-border");
  });

  it("keeps range controls touch-sized with focus and disabled states", () => {
    const className = fieldClassNames({ kind: "range", className: "mt-1" });
    expect(className).toContain("min-h-11");
    expect(className).toContain("accent-accent-link");
    expect(className).toContain("focus-visible:ring-2");
    expect(className).toContain("disabled:opacity-60");
    expect(className).toContain("mt-1");
    expect(className).not.toContain("px-4");
    expect(className).not.toContain("border-control-border");
  });

  it("shares stacked and inline label layouts without fixing their typography", () => {
    expect(controlLabelClassNames()).toBe("grid gap-1");
    expect(
      controlLabelClassNames({ layout: "inline", className: "text-sm" })
    ).toBe("flex min-h-11 items-center gap-2 text-sm");
  });

  it("adds select-specific affordances", () => {
    const className = fieldClassNames({
      kind: "select",
      className: "mt-1",
    });

    expect(className).toContain("cursor-pointer");
    expect(className).toContain("pr-10");
    expect(className).toContain("mt-1");
  });
});
