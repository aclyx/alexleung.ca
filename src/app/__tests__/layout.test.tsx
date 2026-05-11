import { render, screen } from "@testing-library/react";

import RootLayout from "../layout";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

describe("RootLayout", () => {
  // Suppress React hydration warnings when testing layout components
  // These warnings are expected when rendering <html>/<body> tags in tests
  beforeAll(() => {
    const originalError = console.error;
    jest.spyOn(console, "error").mockImplementation((...args) => {
      const errorMessage = args[0];
      if (
        typeof errorMessage === "string" &&
        errorMessage.includes("cannot be a child of")
      ) {
        return; // Suppress hydration warnings
      }
      originalError.call(console, ...args);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should render children within layout structure", () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(container.querySelector("main")).toBeInTheDocument();
  });

  describe("JSON-LD Schema", () => {
    it("should include valid Person schema with required fields", () => {
      const { container } = render(
        <RootLayout>
          <div>Content</div>
        </RootLayout>
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]'
      );
      const schema = JSON.parse(script?.textContent || "{}");

      // Verify schema structure
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Person");
      expect(schema["@id"]).toBe("https://alexleung.ca/#person");
      expect(schema.name).toBe("Alex Leung");
      expect(schema.url).toBe("https://alexleung.ca");
    });

    it("should include professional credentials", () => {
      const { container } = render(
        <RootLayout>
          <div>Content</div>
        </RootLayout>
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]'
      );
      const schema = JSON.parse(script?.textContent || "{}");

      expect(schema.hasCredential).toBeDefined();
      expect(schema.hasCredential.length).toBe(3);

      const pEngCredential = schema.hasCredential.find((c: { name: string }) =>
        c.name.includes("P.Eng")
      );
      expect(pEngCredential).toBeDefined();
      expect(pEngCredential.recognizedBy.name).toBe(
        "Professional Engineers Ontario"
      );
    });

    it("should include education and expertise information", () => {
      const { container } = render(
        <RootLayout>
          <div>Content</div>
        </RootLayout>
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]'
      );
      const schema = JSON.parse(script?.textContent || "{}");

      expect(schema.alumniOf).toBeDefined();
      expect(schema.alumniOf.length).toBe(2);
      expect(schema.worksFor).toMatchObject({
        "@type": "Organization",
        name: "OpenAI",
        url: "https://openai.com/",
      });
      expect(schema.knowsAbout).toEqual(
        expect.arrayContaining([
          "AI-Assisted Software Workflows",
          "Distributed Systems",
        ])
      );
    });

    it("should include social profile links", () => {
      const { container } = render(
        <RootLayout>
          <div>Content</div>
        </RootLayout>
      );

      const script = container.querySelector(
        'script[type="application/ld+json"]'
      );
      const schema = JSON.parse(script?.textContent || "{}");

      expect(schema.sameAs).toBeDefined();
      expect(schema.sameAs.length).toBeGreaterThan(0);
      expect(schema.sameAs).toContain("https://www.linkedin.com/in/aclyx");
      expect(schema.sameAs).toContain("https://github.com/aclyx");
    });
  });
});
