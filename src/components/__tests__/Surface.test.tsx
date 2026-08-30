import { render } from "@testing-library/react";

import { Surface, surfaceClassNames } from "../Surface";

describe("Surface", () => {
  it("supports standard responsive padding", () => {
    const { container } = render(
      <Surface padding="responsive">Content</Surface>
    );

    expect(container.firstElementChild).toHaveClass("p-5", "sm:p-6", "md:p-8");
  });

  it("returns interactive treatment from its class helper", () => {
    expect(surfaceClassNames({ interactive: true })).toContain(
      "surface-interactive"
    );
  });
});
