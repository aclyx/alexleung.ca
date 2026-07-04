import { render, screen } from "@testing-library/react";

import ExperimentsPage from "../page";

function getJsonLdEntries(container: HTMLElement) {
  return [
    ...container.querySelectorAll('script[type="application/ld+json"]'),
  ].map((script) => JSON.parse(script.textContent || "{}"));
}

describe("ExperimentsPage", () => {
  it("renders the hub title and experiment links", () => {
    render(<ExperimentsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Experiments" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /event loop visualizer/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /pid controller simulator/i })
    ).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/experimental\/pid-controller\/?$/)
    );
  });

  it("emits collection page schema for the experiments hub", () => {
    const { container } = render(<ExperimentsPage />);
    const schemas = getJsonLdEntries(container);
    const pageSchema = schemas.find(
      (schema) => schema["@id"] === "https://alexleung.ca/experimental/"
    );

    expect(pageSchema).toMatchObject({
      "@type": "CollectionPage",
      "@id": "https://alexleung.ca/experimental/",
      url: "https://alexleung.ca/experimental/",
    });
  });
});
