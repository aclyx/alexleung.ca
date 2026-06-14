import { render, waitFor } from "@testing-library/react";

import { GoogleAnalytics } from "../GoogleAnalytics";

describe("GoogleAnalytics", () => {
  beforeEach(() => {
    document.getElementById("google-analytics-gtag")?.remove();
    delete window.dataLayer;
    delete window.gtag;
  });

  afterEach(() => {
    document.getElementById("google-analytics-gtag")?.remove();
    delete window.dataLayer;
    delete window.gtag;
  });

  it("creates the gtag queue and script", async () => {
    render(<GoogleAnalytics measurementId="G-TEST123" />);

    await waitFor(() => {
      expect(document.getElementById("google-analytics-gtag")).not.toBeNull();
    });

    const script = document.getElementById("google-analytics-gtag");

    if (!(script instanceof HTMLScriptElement)) {
      throw new Error("Expected Google Analytics script to be present");
    }

    expect(script.async).toBe(true);
    expect(script.src).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-TEST123"
    );
    expect(window.dataLayer?.[0]).toEqual(["js", expect.any(Date)]);
    expect(window.dataLayer?.[1]).toEqual(["config", "G-TEST123"]);
  });
});
