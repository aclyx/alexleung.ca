type ExperimentEntry = {
  description: string;
  id: string;
  kind: string;
  lastModified: string;
  pageTitle: string;
  path: string;
  thumbnail: {
    alt: string;
    src: string;
  };
  title: string;
};

const EXPERIMENT_LAST_MODIFIED_ISO = "2026-04-20";
const EXPERIMENT_THUMBNAIL_WIDTH = 960;
const EXPERIMENT_THUMBNAIL_HEIGHT = 540;

type ExperimentsHub = Pick<
  ExperimentEntry,
  "description" | "lastModified" | "pageTitle" | "path" | "title"
>;

export const EXPERIMENTS_HUB: ExperimentsHub = {
  description:
    "Open experiments for exploring power systems, fractals, and control loops.",
  path: "/experimental/",
  title: "Experiments | Alex Leung",
  pageTitle: "Experiments",
  lastModified: EXPERIMENT_LAST_MODIFIED_ISO,
};

export function buildExperimentBreadcrumbItems(
  pageTitle: string,
  path: string
) {
  return [
    { name: "Home", item: "/" },
    { name: EXPERIMENTS_HUB.pageTitle, item: EXPERIMENTS_HUB.path },
    { name: pageTitle, item: path },
  ];
}

export function getExperimentById(id: string): ExperimentEntry {
  const experiment = EXPERIMENTS.find((entry) => entry.id === id);

  if (!experiment) {
    throw new Error(`Unknown experiment: ${id}`);
  }

  return experiment;
}

export function getExperimentMetadataImage(experiment: ExperimentEntry) {
  return {
    url: experiment.thumbnail.src,
    alt: experiment.thumbnail.alt,
    width: EXPERIMENT_THUMBNAIL_WIDTH,
    height: EXPERIMENT_THUMBNAIL_HEIGHT,
  };
}

export const EXPERIMENTS: readonly ExperimentEntry[] = [
  {
    id: "load-flow",
    kind: "Power Systems",
    pageTitle: "Load Flow",
    title: "Load Flow | Alex Leung",
    description:
      "An AC load flow workspace for editing one-line models and solving bus voltages and branch flows.",
    path: "/experimental/load-flow/",
    thumbnail: {
      src: "/assets/experimental/load-flow.webp",
      alt: "Screenshot of Load Flow reference scenarios and one-line diagram",
    },
    lastModified: EXPERIMENT_LAST_MODIFIED_ISO,
  },
  {
    id: "mandelbrot",
    kind: "Fractals",
    pageTitle: "Mandelbrot Explorer",
    title: "Mandelbrot Explorer | Alex Leung",
    description:
      "A Mandelbrot explorer with arbitrary-precision viewport math, progressive rendering, and shareable zoom state.",
    path: "/experimental/mandelbrot/",
    thumbnail: {
      src: "/assets/experimental/mandelbrot.webp",
      alt: "Screenshot of Mandelbrot Explorer plot controls and fractal view",
    },
    lastModified: EXPERIMENT_LAST_MODIFIED_ISO,
  },
  {
    id: "pid-controller",
    kind: "Control",
    pageTitle: "PID Controller Simulator",
    title: "PID Controller Simulator | Alex Leung",
    description:
      "Fixed-step PID simulation for trying gains and seeing rise time, overshoot, oscillation, and settling behavior.",
    path: "/experimental/pid-controller/",
    thumbnail: {
      src: "/assets/experimental/pid-controller.webp",
      alt: "Screenshot of PID Controller Simulator response curves",
    },
    lastModified: EXPERIMENT_LAST_MODIFIED_ISO,
  },
];
