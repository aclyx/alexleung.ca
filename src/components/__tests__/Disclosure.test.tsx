import { render, screen } from "@testing-library/react";

import {
  DisclosureIndicator,
  disclosureSummaryClassNames,
} from "@/components/Disclosure";

describe("Disclosure", () => {
  it("keeps the summary keyboard accessible and comfortably sized", () => {
    const className = disclosureSummaryClassNames({ className: "custom" });

    expect(className).toContain("min-h-11");
    expect(className).toContain("focus-visible:ring-2");
    expect(className).toContain("custom");
  });

  it("uses a short, state-driven indicator rotation", () => {
    render(<DisclosureIndicator />);

    const indicator = screen.getByText("›");
    expect(indicator).toHaveAttribute("aria-hidden", "true");
    expect(indicator).toHaveClass("transition-[rotate]");
    expect(indicator).toHaveClass("group-open:rotate-90");
  });
});
