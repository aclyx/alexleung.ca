import {
  ColoringMode,
  PaletteId,
  RenderRequest,
} from "@/features/mandelbrot/types";

type WebGpu = {
  getPreferredCanvasFormat?: () => string;
  requestAdapter: () => Promise<WebGpuAdapter | null>;
};

type WebGpuAdapter = {
  requestDevice: () => Promise<WebGpuDevice>;
};

type WebGpuDevice = {
  createBindGroup: (descriptor: WebGpuBindGroupDescriptor) => WebGpuBindGroup;
  createBindGroupLayout: (
    descriptor: WebGpuBindGroupLayoutDescriptor
  ) => WebGpuBindGroupLayout;
  createBuffer: (descriptor: WebGpuBufferDescriptor) => WebGpuBuffer;
  createCommandEncoder: () => WebGpuCommandEncoder;
  createComputePipeline: (
    descriptor: WebGpuComputePipelineDescriptor
  ) => WebGpuComputePipeline;
  createPipelineLayout: (
    descriptor: WebGpuPipelineLayoutDescriptor
  ) => WebGpuPipelineLayout;
  createRenderPipeline: (
    descriptor: WebGpuRenderPipelineDescriptor
  ) => WebGpuRenderPipeline;
  createShaderModule: (
    descriptor: WebGpuShaderModuleDescriptor
  ) => WebGpuShaderModule;
  queue: WebGpuQueue;
};

type WebGpuQueue = {
  submit: (commandBuffers: unknown[]) => void;
  writeBuffer: (
    buffer: WebGpuBuffer,
    bufferOffset: number,
    data: ArrayBufferLike | ArrayBufferView
  ) => void;
};

type WebGpuBuffer = {
  destroy: () => void;
  getMappedRange: () => ArrayBufferLike;
  mapAsync: (mode: number) => Promise<void>;
  unmap: () => void;
};

type WebGpuCommandEncoder = {
  beginComputePass: () => WebGpuComputePassEncoder;
  beginRenderPass: (
    descriptor: WebGpuRenderPassDescriptor
  ) => WebGpuRenderPassEncoder;
  copyBufferToBuffer: (
    source: WebGpuBuffer,
    sourceOffset: number,
    destination: WebGpuBuffer,
    destinationOffset: number,
    size: number
  ) => void;
  finish: () => unknown;
};

type WebGpuComputePassEncoder = {
  dispatchWorkgroups: (
    workgroupCountX: number,
    workgroupCountY?: number,
    workgroupCountZ?: number
  ) => void;
  end: () => void;
  setBindGroup: (index: number, bindGroup: WebGpuBindGroup) => void;
  setPipeline: (pipeline: WebGpuComputePipeline) => void;
};

type WebGpuRenderPassEncoder = {
  draw: (vertexCount: number, instanceCount?: number) => void;
  end: () => void;
  setBindGroup: (index: number, bindGroup: WebGpuBindGroup) => void;
  setPipeline: (pipeline: WebGpuRenderPipeline) => void;
};

type WebGpuCanvasContext = {
  configure: (descriptor: WebGpuCanvasConfiguration) => void;
  getCurrentTexture: () => WebGpuTexture;
};

type WebGpuShaderModule = object;
type WebGpuComputePipeline = object;
type WebGpuRenderPipeline = object;
type WebGpuBindGroupLayout = object;
type WebGpuBindGroup = object;
type WebGpuPipelineLayout = object;
type WebGpuTextureView = object;

type WebGpuTexture = {
  createView: () => WebGpuTextureView;
  destroy?: () => void;
};

type WebGpuBufferDescriptor = {
  mappedAtCreation?: boolean;
  size: number;
  usage: number;
};

type WebGpuShaderModuleDescriptor = {
  code: string;
};

type WebGpuBindGroupLayoutDescriptor = {
  entries: ReadonlyArray<WebGpuBindGroupLayoutEntry>;
};

type WebGpuBindGroupLayoutEntry = {
  binding: number;
  buffer: {
    type: "read-only-storage" | "storage";
  };
  visibility: number;
};

type WebGpuPipelineLayoutDescriptor = {
  bindGroupLayouts: ReadonlyArray<WebGpuBindGroupLayout>;
};

type WebGpuComputePipelineDescriptor = {
  compute: {
    entryPoint: string;
    module: WebGpuShaderModule;
  };
  layout: WebGpuPipelineLayout;
};

type WebGpuRenderPipelineDescriptor = {
  fragment: {
    entryPoint: string;
    module: WebGpuShaderModule;
    targets: ReadonlyArray<{
      format: string;
    }>;
  };
  layout: WebGpuPipelineLayout;
  primitive: {
    topology: "triangle-list";
  };
  vertex: {
    entryPoint: string;
    module: WebGpuShaderModule;
  };
};

type WebGpuBindGroupDescriptor = {
  entries: ReadonlyArray<WebGpuBindGroupEntry>;
  layout: WebGpuBindGroupLayout;
};

type WebGpuBindGroupEntry = {
  binding: number;
  resource: {
    buffer: WebGpuBuffer;
  };
};

type WebGpuCanvasConfiguration = {
  alphaMode: "opaque" | "premultiplied";
  device: WebGpuDevice;
  format: string;
};

type WebGpuRenderPassDescriptor = {
  colorAttachments: ReadonlyArray<{
    clearValue: {
      a: number;
      b: number;
      g: number;
      r: number;
    };
    loadOp: "clear" | "load";
    storeOp: "store";
    view: WebGpuTextureView;
  }>;
};

type WebGpuAvailability = {
  isAvailable: boolean;
  reason?: string;
};

const WEBGPU_DETECTION_TIMEOUT_MS = 1500;

type WebGpuRenderResult = {
  completed: boolean;
  rendered: boolean;
  fallbackReason?: string;
};

type WebGpuRendererState = {
  canvasFormat: string;
  bindGroupLayout: WebGpuBindGroupLayout;
  device: WebGpuDevice;
  pipeline: WebGpuComputePipeline;
  presentationBindGroupLayout: WebGpuBindGroupLayout;
  presentationPipeline: WebGpuRenderPipeline;
};

const GPU_BUFFER_USAGE_MAP_READ = 0x0001;
const GPU_BUFFER_USAGE_COPY_SRC = 0x0004;
const GPU_BUFFER_USAGE_COPY_DST = 0x0008;
const GPU_BUFFER_USAGE_STORAGE = 0x0080;
const GPU_SHADER_STAGE_COMPUTE = 0x0004;
const GPU_MAP_MODE_READ = 0x0001;
const WORKGROUP_SIZE = 8;
const GPU_ROWS_PER_CHUNK = 24;
const GPU_SHADER_STAGE_FRAGMENT = 0x0002;
const DEFAULT_WEBGPU_CANVAS_FORMAT = "bgra8unorm";
const FLOAT32_SIGNIFICAND_BITS = 23;
const FLOAT32_MIN_SUBNORMAL = 2 ** -149;
const AUTO_WEBGPU_ULP_CUSHION = 0.25;

const PALETTE_IDS: Readonly<Record<PaletteId, number>> = {
  oceanic: 0,
  ember: 1,
  glacier: 2,
};

const COLORING_MODE_IDS: Readonly<Record<ColoringMode, number>> = {
  smooth: 0,
  bands: 1,
};

function estimateFloat32Ulp(value: number): number {
  const magnitude = Math.abs(value);

  if (!Number.isFinite(magnitude)) {
    return Number.POSITIVE_INFINITY;
  }

  if (magnitude === 0) {
    return FLOAT32_MIN_SUBNORMAL;
  }

  return 2 ** (Math.floor(Math.log2(magnitude)) - FLOAT32_SIGNIFICAND_BITS);
}

export function canRenderViewportWithWebGpu(
  viewport: RenderRequest["viewport"],
  size: RenderRequest["size"]
): boolean {
  const safeWidth = Math.max(1, Math.round(size.width));
  const safeHeight = Math.max(1, Math.round(size.height));
  const left = viewport.centerX.sub(viewport.width.div(2)).toNumber();
  const right = viewport.centerX.add(viewport.width.div(2)).toNumber();
  const top = viewport.centerY.add(viewport.height.div(2)).toNumber();
  const bottom = viewport.centerY.sub(viewport.height.div(2)).toNumber();
  const stepX = viewport.width.div(safeWidth).abs().toNumber();
  const stepY = viewport.height.div(safeHeight).abs().toNumber();

  if (
    !Number.isFinite(left) ||
    !Number.isFinite(right) ||
    !Number.isFinite(top) ||
    !Number.isFinite(bottom) ||
    !Number.isFinite(stepX) ||
    !Number.isFinite(stepY) ||
    stepX <= 0 ||
    stepY <= 0
  ) {
    return false;
  }

  // Clamp the coordinate scale to at least 1 so auto mode does not stay on
  // WebGPU too aggressively when the view is numerically close to the origin.
  const coordinateMagnitude = Math.max(
    1,
    Math.abs(left),
    Math.abs(right),
    Math.abs(top),
    Math.abs(bottom)
  );
  const float32Ulp = estimateFloat32Ulp(coordinateMagnitude);
  const smallestPixelStep = Math.min(stepX, stepY);

  return smallestPixelStep >= float32Ulp * AUTO_WEBGPU_ULP_CUSHION;
}

const SHADER_CODE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> settings: array<u32>;
@group(0) @binding(1) var<storage, read> viewport: array<f32>;
@group(0) @binding(2) var<storage, read_write> pixels: array<u32>;

const ESCAPE_RADIUS_SQUARED: f32 = 4.0;
const LOG_2: f32 = 0.6931471805599453;

fn interiorColor() -> vec3<u32> {
  return vec3<u32>(4u, 8u, 22u);
}

fn paletteColorAt(paletteIndex: u32, value: f32) -> vec3<u32> {
  let oceanic = array<vec3<f32>, 6>(
    vec3<f32>(7.0, 12.0, 28.0),
    vec3<f32>(15.0, 44.0, 78.0),
    vec3<f32>(24.0, 88.0, 138.0),
    vec3<f32>(53.0, 136.0, 186.0),
    vec3<f32>(155.0, 209.0, 229.0),
    vec3<f32>(246.0, 246.0, 210.0)
  );
  let ember = array<vec3<f32>, 6>(
    vec3<f32>(24.0, 7.0, 30.0),
    vec3<f32>(76.0, 15.0, 56.0),
    vec3<f32>(145.0, 36.0, 49.0),
    vec3<f32>(212.0, 86.0, 38.0),
    vec3<f32>(247.0, 157.0, 61.0),
    vec3<f32>(255.0, 233.0, 148.0)
  );
  let glacier = array<vec3<f32>, 6>(
    vec3<f32>(7.0, 14.0, 28.0),
    vec3<f32>(23.0, 54.0, 87.0),
    vec3<f32>(45.0, 105.0, 134.0),
    vec3<f32>(92.0, 165.0, 168.0),
    vec3<f32>(170.0, 219.0, 202.0),
    vec3<f32>(243.0, 250.0, 244.0)
  );

  let clamped = clamp(value, 0.0, 1.0);
  let scaled = clamped * 5.0;
  let leftIndex = min(u32(floor(scaled)), 5u);
  let rightIndex = min(leftIndex + 1u, 5u);
  let amount = scaled - f32(leftIndex);

  var left = oceanic[leftIndex];
  var right = oceanic[rightIndex];

  if (paletteIndex == 1u) {
    left = ember[leftIndex];
    right = ember[rightIndex];
  } else if (paletteIndex == 2u) {
    left = glacier[leftIndex];
    right = glacier[rightIndex];
  }

  let color = left + (right - left) * amount;

  return vec3<u32>(
    u32(round(color.x)),
    u32(round(color.y)),
    u32(round(color.z))
  );
}

fn packColor(color: vec3<u32>) -> u32 {
  return color.x | (color.y << 8u) | (color.z << 16u) | (255u << 24u);
}

@compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE}, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let width = settings[0];
  let height = settings[1];

  if (gid.x >= width || gid.y >= height) {
    return;
  }

  let maxIterations = settings[2];
  let paletteIndex = settings[3];
  let coloringMode = settings[4];
  let left = viewport[0];
  let top = viewport[1];
  let stepX = viewport[2];
  let stepY = viewport[3];
  let cx = left + stepX * (f32(gid.x) + 0.5);
  let cy = top - stepY * (f32(gid.y) + 0.5);
  let index = gid.y * width + gid.x;

  var zx = 0.0;
  var zy = 0.0;
  var magnitudeSquared = 0.0;
  var escaped = false;
  var escapedIterations = maxIterations;
  var smoothIteration = f32(maxIterations);

  for (var iteration = 0u; iteration < maxIterations; iteration = iteration + 1u) {
    let zxSquared = zx * zx;
    let zySquared = zy * zy;
    let nextZy = 2.0 * zx * zy + cy;
    let nextZx = zxSquared - zySquared + cx;

    zx = nextZx;
    zy = nextZy;
    magnitudeSquared = zx * zx + zy * zy;

    if (magnitudeSquared > ESCAPE_RADIUS_SQUARED) {
      escaped = true;
      escapedIterations = iteration + 1u;

      if (magnitudeSquared > 1.0) {
        smoothIteration =
          f32(escapedIterations) +
          1.0 -
          log(log(sqrt(magnitudeSquared))) / LOG_2;
      } else {
        smoothIteration = f32(escapedIterations);
      }

      break;
    }
  }

  if (!escaped) {
    pixels[index] = packColor(interiorColor());
    return;
  }

  var normalizedValue = smoothIteration / f32(maxIterations);

  if (coloringMode == 1u) {
    normalizedValue = f32(escapedIterations) / f32(maxIterations);
  }

  pixels[index] = packColor(paletteColorAt(paletteIndex, normalizedValue));
}
`;

const PRESENTATION_SHADER_CODE = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@group(0) @binding(0) var<storage, read> settings: array<u32>;
@group(0) @binding(1) var<storage, read> pixels: array<u32>;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(1.0, -1.0)
  );
  let uvs = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0)
  );

  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  output.uv = uvs[vertexIndex];
  return output;
}

fn unpackColor(value: u32) -> vec4<f32> {
  let red = f32(value & 255u) / 255.0;
  let green = f32((value >> 8u) & 255u) / 255.0;
  let blue = f32((value >> 16u) & 255u) / 255.0;
  let alpha = f32((value >> 24u) & 255u) / 255.0;

  return vec4<f32>(red, green, blue, alpha);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let width = settings[0];
  let height = settings[1];
  let x = min(u32(clamp(input.uv.x, 0.0, 0.999999) * f32(width)), width - 1u);
  let y = min(u32(clamp(input.uv.y, 0.0, 0.999999) * f32(height)), height - 1u);
  let color = pixels[y * width + x];

  return unpackColor(color);
}
`;

let rendererStatePromise: Promise<WebGpuRendererState> | null = null;

type WebGpuNavigator = Navigator & {
  gpu?: WebGpu;
};

function hasNavigatorGpu(value: Navigator): value is WebGpuNavigator {
  return "gpu" in value;
}

function isWebGpuCanvasContext(value: unknown): value is WebGpuCanvasContext {
  return (
    value !== null &&
    typeof value === "object" &&
    "configure" in value &&
    "getCurrentTexture" in value
  );
}

function getNavigatorGpu(): WebGpu | null {
  if (typeof navigator === "undefined" || !hasNavigatorGpu(navigator)) {
    return null;
  }

  return navigator.gpu ?? null;
}

function getCanvasWebGpuContext(
  canvas: HTMLCanvasElement
): WebGpuCanvasContext | null {
  const context = canvas.getContext("webgpu");
  return isWebGpuCanvasContext(context) ? context : null;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });
}

async function createRendererState(): Promise<WebGpuRendererState> {
  const gpu = getNavigatorGpu();

  if (!gpu) {
    throw new Error("WebGPU API is unavailable in this browser.");
  }

  const adapter = await gpu.requestAdapter();

  if (!adapter) {
    throw new Error("No compatible WebGPU adapter was found.");
  }

  const device = await adapter.requestDevice();
  const computeShaderModule = device.createShaderModule({
    code: SHADER_CODE,
  });
  const presentationShaderModule = device.createShaderModule({
    code: PRESENTATION_SHADER_CODE,
  });
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPU_SHADER_STAGE_COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        binding: 1,
        visibility: GPU_SHADER_STAGE_COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        binding: 2,
        visibility: GPU_SHADER_STAGE_COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });
  const pipeline = device.createComputePipeline({
    layout: pipelineLayout,
    compute: {
      module: computeShaderModule,
      entryPoint: "main",
    },
  });
  const presentationBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPU_SHADER_STAGE_FRAGMENT,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        binding: 1,
        visibility: GPU_SHADER_STAGE_FRAGMENT,
        buffer: {
          type: "read-only-storage",
        },
      },
    ],
  });
  const presentationPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [presentationBindGroupLayout],
  });
  const canvasFormat =
    gpu.getPreferredCanvasFormat?.() ?? DEFAULT_WEBGPU_CANVAS_FORMAT;
  const presentationPipeline = device.createRenderPipeline({
    layout: presentationPipelineLayout,
    vertex: {
      module: presentationShaderModule,
      entryPoint: "vertexMain",
    },
    fragment: {
      module: presentationShaderModule,
      entryPoint: "fragmentMain",
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  return {
    canvasFormat,
    bindGroupLayout,
    device,
    pipeline,
    presentationBindGroupLayout,
    presentationPipeline,
  };
}

async function getRendererState(): Promise<WebGpuRendererState> {
  if (!rendererStatePromise) {
    rendererStatePromise = createRendererState().catch((error) => {
      rendererStatePromise = null;
      throw error;
    });
  }

  return rendererStatePromise;
}

function unpackPixels(packedPixels: Uint32Array): Uint8ClampedArray {
  const unpackedPixels = new Uint8ClampedArray(packedPixels.length * 4);

  for (let index = 0; index < packedPixels.length; index += 1) {
    const value = packedPixels[index];
    const outputIndex = index * 4;

    unpackedPixels[outputIndex] = value & 0xff;
    unpackedPixels[outputIndex + 1] = (value >>> 8) & 0xff;
    unpackedPixels[outputIndex + 2] = (value >>> 16) & 0xff;
    unpackedPixels[outputIndex + 3] = (value >>> 24) & 0xff;
  }

  return unpackedPixels;
}

function presentPixelsToCanvas(
  device: WebGpuDevice,
  commandEncoder: WebGpuCommandEncoder,
  canvas: HTMLCanvasElement,
  canvasFormat: string,
  presentationBindGroupLayout: WebGpuBindGroupLayout,
  presentationPipeline: WebGpuRenderPipeline,
  settingsBuffer: WebGpuBuffer,
  outputBuffer: WebGpuBuffer
): boolean {
  const context = getCanvasWebGpuContext(canvas);

  if (!context) {
    return false;
  }

  context.configure({
    device,
    format: canvasFormat,
    alphaMode: "opaque",
  });

  const presentationBindGroup = device.createBindGroup({
    layout: presentationBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: settingsBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: outputBuffer,
        },
      },
    ],
  });
  const currentTextureView = context.getCurrentTexture().createView();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: currentTextureView,
        clearValue: {
          r: 0.011764705882352941,
          g: 0.027450980392156862,
          b: 0.07058823529411765,
          a: 1,
        },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  renderPass.setPipeline(presentationPipeline);
  renderPass.setBindGroup(0, presentationBindGroup);
  renderPass.draw(6);
  renderPass.end();

  return true;
}

export async function detectWebGpuAvailability(): Promise<WebGpuAvailability> {
  if (typeof navigator === "undefined") {
    return {
      isAvailable: false,
      reason: "Navigator is unavailable in this environment.",
    };
  }

  const gpu = getNavigatorGpu();

  if (!gpu) {
    return {
      isAvailable: false,
      reason: "WebGPU API is unavailable in this browser.",
    };
  }

  let timedOut = false;
  const adapter = await Promise.race([
    gpu.requestAdapter(),
    new Promise<null>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve(null);
      }, WEBGPU_DETECTION_TIMEOUT_MS);
    }),
  ]);

  if (!adapter) {
    return {
      isAvailable: false,
      reason: timedOut
        ? "WebGPU adapter detection timed out."
        : "No compatible WebGPU adapter was found.",
    };
  }

  return {
    isAvailable: true,
  };
}

export async function renderMandelbrotWithWebGpu(
  renderRequest: RenderRequest
): Promise<WebGpuRenderResult> {
  if (renderRequest.signal?.aborted) {
    return {
      completed: false,
      rendered: true,
    };
  }

  try {
    const {
      canvasFormat,
      device,
      bindGroupLayout,
      pipeline,
      presentationBindGroupLayout,
      presentationPipeline,
    } = await getRendererState();

    if (renderRequest.signal?.aborted) {
      return {
        completed: false,
        rendered: true,
      };
    }

    const safeWidth = Math.max(1, Math.round(renderRequest.size.width));
    const safeHeight = Math.max(1, Math.round(renderRequest.size.height));
    const left = renderRequest.viewport.centerX
      .sub(renderRequest.viewport.width.div(2))
      .toNumber();
    const top = renderRequest.viewport.centerY
      .add(renderRequest.viewport.height.div(2))
      .toNumber();
    const stepX = renderRequest.viewport.width.div(safeWidth).toNumber();
    const stepY = renderRequest.viewport.height.div(safeHeight).toNumber();
    const settingsData = new Uint32Array([
      safeWidth,
      safeHeight,
      renderRequest.settings.maxIterations,
      PALETTE_IDS[renderRequest.settings.paletteId],
      COLORING_MODE_IDS[renderRequest.settings.coloringMode],
    ]);
    const viewportData = new Float32Array([left, top, stepX, stepY]);
    const outputBytes = safeWidth * safeHeight * Uint32Array.BYTES_PER_ELEMENT;
    const settingsBuffer = device.createBuffer({
      size: settingsData.byteLength,
      usage: GPU_BUFFER_USAGE_STORAGE | GPU_BUFFER_USAGE_COPY_DST,
    });
    const viewportBuffer = device.createBuffer({
      size: viewportData.byteLength,
      usage: GPU_BUFFER_USAGE_STORAGE | GPU_BUFFER_USAGE_COPY_DST,
    });
    const outputBuffer = device.createBuffer({
      size: outputBytes,
      usage: GPU_BUFFER_USAGE_STORAGE | GPU_BUFFER_USAGE_COPY_SRC,
    });
    const readbackBuffer = device.createBuffer({
      size: outputBytes,
      usage: GPU_BUFFER_USAGE_COPY_DST | GPU_BUFFER_USAGE_MAP_READ,
    });

    try {
      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: settingsBuffer,
            },
          },
          {
            binding: 1,
            resource: {
              buffer: viewportBuffer,
            },
          },
          {
            binding: 2,
            resource: {
              buffer: outputBuffer,
            },
          },
        ],
      });

      device.queue.writeBuffer(settingsBuffer, 0, settingsData);
      device.queue.writeBuffer(viewportBuffer, 0, viewportData);
      renderRequest.onProgress?.(0.15);

      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();

      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(
        Math.ceil(safeWidth / WORKGROUP_SIZE),
        Math.ceil(safeHeight / WORKGROUP_SIZE)
      );
      passEncoder.end();
      const presentedDirectly =
        renderRequest.gpuTargetCanvas &&
        presentPixelsToCanvas(
          device,
          commandEncoder,
          renderRequest.gpuTargetCanvas,
          canvasFormat,
          presentationBindGroupLayout,
          presentationPipeline,
          settingsBuffer,
          outputBuffer
        );

      if (presentedDirectly) {
        device.queue.submit([commandEncoder.finish()]);
        renderRequest.onProgress?.(1);

        return {
          completed: true,
          rendered: true,
        };
      }

      commandEncoder.copyBufferToBuffer(
        outputBuffer,
        0,
        readbackBuffer,
        0,
        outputBytes
      );
      device.queue.submit([commandEncoder.finish()]);
      renderRequest.onProgress?.(0.45);

      await readbackBuffer.mapAsync(GPU_MAP_MODE_READ);

      if (renderRequest.signal?.aborted) {
        return {
          completed: false,
          rendered: true,
        };
      }

      const mappedRange = readbackBuffer.getMappedRange();
      const packedPixels = new Uint32Array(mappedRange.slice(0));
      const pixels = unpackPixels(packedPixels);

      readbackBuffer.unmap();
      renderRequest.onProgress?.(0.75);

      for (
        let startRow = 0;
        startRow < safeHeight;
        startRow += GPU_ROWS_PER_CHUNK
      ) {
        if (renderRequest.signal?.aborted) {
          return {
            completed: false,
            rendered: true,
          };
        }

        const rowCount = Math.min(GPU_ROWS_PER_CHUNK, safeHeight - startRow);
        const pixelStart = startRow * safeWidth * 4;
        const pixelEnd = pixelStart + safeWidth * rowCount * 4;

        renderRequest.onChunk({
          startRow,
          rowCount,
          pixels: pixels.slice(pixelStart, pixelEnd),
        });
        renderRequest.onProgress?.(
          0.75 + ((startRow + rowCount) / safeHeight) * 0.25
        );

        await nextFrame();
      }

      return {
        completed: true,
        rendered: true,
      };
    } finally {
      settingsBuffer.destroy();
      viewportBuffer.destroy();
      outputBuffer.destroy();

      try {
        readbackBuffer.unmap();
      } catch {
        // Ignore redundant unmap calls when the buffer was never mapped.
      }

      readbackBuffer.destroy();
    }
  } catch (error) {
    return {
      completed: false,
      rendered: false,
      fallbackReason:
        error instanceof Error
          ? error.message
          : "WebGPU rendering failed unexpectedly.",
    };
  }
}
