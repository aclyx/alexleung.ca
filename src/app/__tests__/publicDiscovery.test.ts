import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readPublicFile(path: string) {
  return readFileSync(join(process.cwd(), "public", path), "utf8");
}

function readPublicBuffer(path: string) {
  return readFileSync(join(process.cwd(), "public", path));
}

describe("public discovery files", () => {
  it("keeps the retired about URL as a static redirect bridge", () => {
    const html = readPublicFile("about/index.html");

    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=/" />');
    expect(html).toContain(
      '<link rel="canonical" href="https://alexleung.ca/" />'
    );
    expect(html).toContain('<a href="/">alexleung.ca</a>');
  });

  it("keeps retired experiment URLs as no-index redirect bridges", () => {
    const redirects = [
      { path: "experimental/index.html", destination: "/blog/" },
      {
        path: "experimental/load-flow/index.html",
        destination: "/blog/small-interactive-tools-with-a-coding-agent/",
      },
      {
        path: "experimental/pid-controller/index.html",
        destination: "/blog/",
      },
    ];

    for (const redirect of redirects) {
      const html = readPublicFile(redirect.path);

      expect(html).toContain(
        '<meta name="robots" content="noindex, follow" />'
      );
      expect(html).toContain(`content="0; url=${redirect.destination}"`);
      expect(html).toContain(`href="${redirect.destination}"`);
    }
  });

  it("does not shadow the active Mandelbrot route with a redirect bridge", () => {
    expect(
      existsSync(
        join(process.cwd(), "public", "experimental/mandelbrot/index.html")
      )
    ).toBe(false);
  });

  it("keeps only writing and now shortcuts in the web manifest", () => {
    const manifest: {
      background_color: string;
      shortcuts: Array<{ url: string }>;
      theme_color: string;
    } = JSON.parse(readPublicFile("manifest.json"));

    expect(manifest.shortcuts.map((shortcut) => shortcut.url)).toEqual([
      "/blog/",
      "/now/",
    ]);
    expect(JSON.stringify(manifest)).not.toContain("/experimental/");
    expect(manifest).toMatchObject({
      theme_color: "#f4f1e9",
      background_color: "#f4f1e9",
    });
  });

  it("keeps the install screenshot metadata aligned with its file", () => {
    const manifest: {
      screenshots: Array<{ sizes: string; src: string; type: string }>;
    } = JSON.parse(readPublicFile("manifest.json"));

    expect(manifest.screenshots).toEqual([
      expect.objectContaining({
        src: "/assets/screenshot.webp",
        sizes: "1440x900",
        type: "image/webp",
      }),
    ]);

    const screenshot = readPublicBuffer("assets/screenshot.webp");
    expect(screenshot.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(screenshot.subarray(8, 12).toString("ascii")).toBe("WEBP");
  });

  it("points the text site map at the consolidated profile", () => {
    const llmsText = readPublicFile("llms.txt");

    expect(llmsText).toContain("[Home](https://alexleung.ca/)");
    expect(llmsText).toContain("[Writing](https://alexleung.ca/blog/)");
    expect(llmsText).toContain(
      "[Mandelbrot Explorer](https://alexleung.ca/experimental/mandelbrot/)"
    );
    expect(llmsText).not.toContain("/about/");
    expect(llmsText).not.toContain("[Experiments]");
  });
});
