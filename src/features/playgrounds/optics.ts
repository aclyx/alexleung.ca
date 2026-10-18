type Vec3 = [number, number, number];
export type RenderSettings = {
  lightX: number;
  lightZ: number;
  lightSize: number;
  bounces: number;
  polished: boolean;
  glass: boolean;
  coloredWalls: boolean;
};
export const DEFAULT_RENDER: RenderSettings = {
  lightX: -0.5,
  lightZ: 0.2,
  lightSize: 0.85,
  bounces: 6,
  polished: true,
  glass: true,
  coloredWalls: true,
};
export const RENDER_WIDTH = 320,
  RENDER_HEIGHT = 240;
type Material = "diffuse" | "mirror" | "glass" | "light";
type Hit = {
  point: Vec3;
  normal: Vec3;
  outward: Vec3;
  t: number;
  material: Material;
  color: Vec3;
  name: string;
  front: boolean;
};
type PathSegment = {
  from: Vec3;
  to: Vec3;
  name: string;
  kind: "path" | "light" | "blocked";
};
const CAMERA: Vec3 = [0, 1.65, 6.7];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, n: number): Vec3 => [a[0] * n, a[1] * n, a[2] * n];
const product = (a: Vec3, b: Vec3): Vec3 => [
  a[0] * b[0],
  a[1] * b[1],
  a[2] * b[2],
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: Vec3) => mul(a, 1 / Math.sqrt(dot(a, a)));
const FORWARD = unit(sub([0, 1.35, 0], CAMERA)),
  RIGHT = unit(cross(FORWARD, [0, 1, 0])),
  UP = cross(RIGHT, FORWARD);
const SCALE = Math.tan((39 * Math.PI) / 360);
export function projectPoint(point: Vec3) {
  const delta = sub(point, CAMERA),
    depth = dot(delta, FORWARD);
  return {
    x:
      (0.5 +
        dot(delta, RIGHT) /
          ((2 * depth * SCALE * RENDER_WIDTH) / RENDER_HEIGHT)) *
      RENDER_WIDTH,
    y: (0.5 - dot(delta, UP) / (2 * depth * SCALE)) * RENDER_HEIGHT,
  };
}
export function reflect(direction: Vec3, normal: Vec3) {
  return sub(direction, mul(normal, 2 * dot(direction, normal)));
}
export function glassDirection(
  direction: Vec3,
  normal: Vec3,
  eta: number,
  random: number
) {
  const cosine = Math.min(1, -dot(direction, normal));
  const sineSquared = eta * eta * (1 - cosine * cosine);
  const r0 = ((1 - eta) / (1 + eta)) ** 2;
  const fresnel = r0 + (1 - r0) * (1 - cosine) ** 5;
  if (sineSquared > 1 || random < fresnel)
    return { direction: reflect(direction, normal), reflected: true };
  return {
    direction: add(
      mul(direction, eta),
      mul(normal, eta * cosine - Math.sqrt(1 - sineSquared))
    ),
    reflected: false,
  };
}
export function intersectScene(
  origin: Vec3,
  direction: Vec3,
  settings: RenderSettings
): Hit | null {
  let closest: Hit | null = null;
  function accept(
    t: number,
    outward: Vec3,
    material: Material,
    color: Vec3,
    name: string
  ) {
    if (t < 0.0001 || (closest && t >= closest.t)) return;
    const front = dot(direction, outward) < 0;
    closest = {
      t,
      point: add(origin, mul(direction, t)),
      outward,
      normal: front ? outward : mul(outward, -1),
      front,
      material,
      color,
      name,
    };
  }
  function sphere(
    center: Vec3,
    radius: number,
    material: Material,
    color: Vec3,
    name: string
  ) {
    const relative = sub(origin, center),
      b = dot(relative, direction),
      discriminant = b * b - dot(relative, relative) + radius * radius;
    if (discriminant < 0) return;
    const root = Math.sqrt(discriminant);
    let t = -b - root;
    if (t < 0.0001) t = -b + root;
    const p = add(origin, mul(direction, t));
    accept(t, mul(sub(p, center), 1 / radius), material, color, name);
  }
  sphere(
    [-0.82, 0.68, -0.25],
    0.68,
    settings.polished ? "mirror" : "diffuse",
    settings.polished ? [0.96, 0.96, 0.96] : [0.75, 0.72, 0.65],
    settings.polished ? "Mirror sphere" : "Matte sphere"
  );
  if (settings.glass)
    sphere([0.75, 0.76, 0.45], 0.76, "glass", [1, 1, 1], "Glass sphere");
  const walls: Array<[number, number, Vec3, string, Vec3]> = [
    [1, 0, [0, 1, 0], "Floor", [0.72, 0.7, 0.63]],
    [1, 3, [0, -1, 0], "Ceiling", [0.72, 0.72, 0.68]],
    [
      0,
      -2,
      [1, 0, 0],
      "Left wall",
      settings.coloredWalls ? [0.67, 0.16, 0.1] : [0.72, 0.72, 0.68],
    ],
    [
      0,
      2,
      [-1, 0, 0],
      "Right wall",
      settings.coloredWalls ? [0.12, 0.4, 0.48] : [0.72, 0.72, 0.68],
    ],
    [2, -2, [0, 0, 1], "Back wall", [0.72, 0.72, 0.68]],
  ];
  for (const [axis, value, normal, name, color] of walls) {
    if (Math.abs(direction[axis]) < 1e-9) continue;
    const t = (value - origin[axis]) / direction[axis];
    const p = add(origin, mul(direction, t));
    if (
      p[0] < -2.0001 ||
      p[0] > 2.0001 ||
      p[1] < -0.0001 ||
      p[1] > 3.0001 ||
      p[2] < -2.0001 ||
      p[2] > 2.0001
    )
      continue;
    accept(t, normal, "diffuse", color, name);
  }
  if (Math.abs(direction[1]) > 1e-9) {
    const t = (2.96 - origin[1]) / direction[1],
      p = add(origin, mul(direction, t));
    if (
      Math.abs(p[0] - settings.lightX) <= settings.lightSize / 2 &&
      Math.abs(p[2] - settings.lightZ) <= settings.lightSize / 2
    )
      accept(t, [0, -1, 0], "light", [12, 11.5, 10.5], "Area light");
  }
  return closest;
}
function hemisphere(normal: Vec3, random: () => number) {
  const radius = Math.sqrt(random()),
    angle = 2 * Math.PI * random();
  const tangent = unit(
    cross(Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], normal)
  );
  return add(
    add(
      mul(tangent, radius * Math.cos(angle)),
      mul(cross(normal, tangent), radius * Math.sin(angle))
    ),
    mul(normal, Math.sqrt(1 - radius * radius))
  );
}
export function traceSample(
  x: number,
  y: number,
  sample: number,
  settings: RenderSettings,
  record = false
) {
  let seed =
    ((x + y * RENDER_WIDTH + 1) ^ Math.imul(sample + 1, 0x9e3779b9)) >>> 0;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  let origin = CAMERA;
  let direction = unit(
    add(
      FORWARD,
      add(
        mul(
          RIGHT,
          ((((x + random()) / RENDER_WIDTH) * 2 - 1) * SCALE * RENDER_WIDTH) /
            RENDER_HEIGHT
        ),
        mul(UP, (1 - ((y + random()) / RENDER_HEIGHT) * 2) * SCALE)
      )
    )
  );
  let throughput: Vec3 = [1, 1, 1],
    color: Vec3 = [0, 0, 0],
    specular = true;
  const segments: PathSegment[] = [];
  const events: string[] = [];
  for (let bounce = 0; bounce <= settings.bounces; bounce++) {
    const hit = intersectScene(origin, direction, settings);
    if (!hit) {
      if (record) {
        segments.push({
          from: origin,
          to: add(origin, mul(direction, 5)),
          name: "Leaves the room",
          kind: "path",
        });
        events.push("Leaves the room");
      }
      break;
    }
    if (record) {
      segments.push({
        from: origin,
        to: hit.point,
        name: hit.name,
        kind: "path",
      });
      events.push(hit.name);
    }
    if (hit.material === "light") {
      if (specular && hit.front)
        color = add(color, product(throughput, hit.color));
      break;
    }
    if (bounce === settings.bounces) {
      if (record) events.push("Bounce limit");
      break;
    }
    if (hit.material === "diffuse") {
      const light: Vec3 = [
        settings.lightX + (random() - 0.5) * settings.lightSize,
        2.96,
        settings.lightZ + (random() - 0.5) * settings.lightSize,
      ];
      const toward = sub(light, hit.point),
        distanceSquared = dot(toward, toward),
        wi = unit(toward);
      const cosine = Math.max(0, dot(hit.normal, wi)),
        lightCosine = Math.max(0, wi[1]);
      const shadow = intersectScene(
        add(hit.point, mul(hit.normal, 0.0005)),
        wi,
        settings
      );
      const visible = shadow?.material === "light";
      if (visible && cosine > 0) {
        const weight =
          (cosine * lightCosine * settings.lightSize ** 2) /
          (Math.PI * distanceSquared);
        color = add(
          color,
          mul(product(product(throughput, hit.color), [12, 11.5, 10.5]), weight)
        );
      }
      if (record)
        segments.push({
          from: hit.point,
          to: visible ? light : (shadow?.point ?? light),
          name: visible ? "Direct light sample" : "Light sample blocked",
          kind: visible ? "light" : "blocked",
        });
      direction = hemisphere(hit.normal, random);
      throughput = product(throughput, hit.color);
      specular = false;
    } else if (hit.material === "mirror") {
      direction = reflect(direction, hit.normal);
      throughput = product(throughput, hit.color);
      specular = true;
    } else {
      const eta = hit.front ? 1 / 1.5 : 1.5;
      const glass = glassDirection(direction, hit.normal, eta, random());
      direction = glass.direction;
      if (!glass.reflected) throughput = mul(throughput, eta * eta);
      if (record)
        events[events.length - 1] += glass.reflected
          ? " · reflection"
          : " · refraction";
      specular = true;
    }
    origin = add(hit.point, mul(direction, 0.0005));
  }
  return { color, segments, events };
}
export function displayChannel(linear: number) {
  const mapped = Math.max(0, linear) / (1 + Math.max(0, linear));
  return Math.round(
    255 *
      (mapped <= 0.0031308
        ? mapped * 12.92
        : 1.055 * mapped ** (1 / 2.4) - 0.055)
  );
}
