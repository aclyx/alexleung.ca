import {
  actionClassNames,
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
