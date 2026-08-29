import { readFileSync } from "node:fs";
import { join } from "node:path";

function readPublicFile(path: string) {
  return readFileSync(join(process.cwd(), "public", path), "utf8");
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
        path: "experimental/mandelbrot/index.html",
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

  it("points the text site map at the consolidated profile", () => {
    const llmsText = readPublicFile("llms.txt");

    expect(llmsText).toContain("[Home](https://alexleung.ca/)");
    expect(llmsText).toContain("[Writing](https://alexleung.ca/blog/)");
    expect(llmsText).not.toContain("/about/");
    expect(llmsText).not.toContain("/experimental/");
  });
});
