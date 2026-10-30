type BrowserTool = {
  id: string;
  href: string;
  title: string;
  field: string;
  description: string;
  image: {
    src: string;
    width: number;
    height: number;
  };
  featured?: boolean;
};

export const BROWSER_TOOLS: readonly BrowserTool[] = [
  {
    id: "load-flow",
    href: "/experimental/load-flow/",
    title: "Load flow analysis",
    field: "Power systems",
    description:
      "Change the load. See where power flows and how voltages respond on a single-line diagram.",
    image: { src: "/assets/tools/load-flow.webp", width: 1056, height: 521 },
    featured: true,
  },
  {
    id: "pid-controller",
    href: "/experimental/pid-controller/",
    title: "PID controller simulator",
    field: "Control systems",
    description: "Choose a plant, tune the gains, and watch it respond.",
    image: {
      src: "/assets/tools/pid-controller.webp",
      width: 640,
      height: 320,
    },
  },
  {
    id: "mandelbrot",
    href: "/experimental/mandelbrot/",
    title: "Mandelbrot explorer",
    field: "Numerical precision",
    description: "Deep zoom that keeps precise coordinates at every level.",
    image: { src: "/assets/tools/mandelbrot.webp", width: 640, height: 320 },
  },
  {
    id: "ray-tracing",
    href: "/experimental/ray-tracing/",
    title: "Ray-tracing room",
    field: "Rendering",
    description:
      "Move the light. Inspect the paths behind reflections and shadows.",
    image: { src: "/assets/tools/ray-tracing.webp", width: 640, height: 320 },
  },
  {
    id: "seam-carving",
    href: "/experimental/seam-carving/",
    title: "Content-aware resizing",
    field: "Image processing",
    description: "Compare three ways to narrow a photograph.",
    image: { src: "/assets/tools/seam-carving.webp", width: 640, height: 320 },
  },
];
