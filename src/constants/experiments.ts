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
    "Small browser tools for exploring systems, control loops, numerical methods, and runtime behavior.",
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
    id: "event-loop",
    kind: "Runtime",
    pageTitle: "Event Loop Visualizer",
    title: "Event Loop Visualizer | Alex Leung",
    description:
      "A small event loop visualizer for call stack, microtasks, tasks, timers, and execution order.",
    path: "/experimental/event-loop/",
    thumbnail: {
      src: "/assets/experimental/event-loop.webp",
      alt: "Abstract event loop queues and execution paths",
    },
    lastModified: EXPERIMENT_LAST_MODIFIED_ISO,
  },
  {
    id: "learning-dynamics",
    kind: "Optimization",
    pageTitle: "Learning Dynamics Lab",
    title: "Learning Dynamics Lab | Alex Leung",
    description:
      "A client-side optimizer visualizer for comparing SGD, Momentum, RMSProp, and Adam on simple 2D loss surfaces.",
    path: "/experimental/learning-dynamics/",
    thumbnail: {
      src: "/assets/experimental/learning-dynamics.webp",
      alt: "Optimizer paths converging across a contour surface",
    },
    lastModified: EXPERIMENT_LAST_MODIFIED_ISO,
  },
  {
    id: "load-flow",
    kind: "Power Systems",
    pageTitle: "Load Flow",
    title: "Load Flow | Alex Leung",
    description:
      "A browser AC load flow workspace for editing one-line models and solving bus voltages and branch flows.",
    path: "/experimental/load-flow/",
    thumbnail: {
      src: "/assets/experimental/load-flow.webp",
      alt: "Abstract power grid one-line diagram with flow traces",
    },
    lastModified: EXPERIMENT_LAST_MODIFIED_ISO,
  },
  {
    id: "mandelbrot",
    kind: "Fractals",
    pageTitle: "Mandelbrot Explorer",
    title: "Mandelbrot Explorer | Alex Leung",
    description:
      "An in-browser Mandelbrot explorer with arbitrary-precision viewport math, progressive rendering, and shareable zoom state.",
    path: "/experimental/mandelbrot/",
    thumbnail: {
      src: "/assets/experimental/mandelbrot.webp",
      alt: "Fractal zoom detail with a highlighted viewport",
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
      alt: "Control loop and damped response curves",
    },
    lastModified: EXPERIMENT_LAST_MODIFIED_ISO,
  },
];
