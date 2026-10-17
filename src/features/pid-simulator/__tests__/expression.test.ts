import { compileEquation } from "../expression";

const variables = { y: 2, v: 3, u: 4, t: 5 };
describe("plant equation parser", () => {
  it.each([
    ["u - 0.6*v - y", 0.2],
    ["-2^2 + 2^3^2", 508],
    ["2^-2", 0.25],
    [" 1e-2 + .5 + (y + u)/2 ", 3.51],
    ["sin(pi/2) + cos(0) + log(e) + exp(0)", 4],
    ["sqrt(abs(-4)) + min(y, u) + max(v, t)", 9],
  ])("evaluates %s", (source, expected) => {
    expect(compileEquation(source)(variables)).toBeCloseTo(expected, 10);
  });
  it.each([
    "",
    "2y",
    "y ** 2",
    "u +",
    "(y",
    "sqrt(y, u)",
    "max(y)",
    "constructor(u)",
    "globalThis.alert(1)",
    "u; alert(1)",
    "y[0]",
    "1e999",
    "y ? u : v",
    "u = 1",
  ])("rejects malformed or unsupported input: %s", (source) => {
    expect(() => compileEquation(source)).toThrow();
  });
  it("bounds input length, token count, and nesting", () => {
    for (const source of [
      "1".repeat(301),
      Array(70).fill("y").join("+"),
      "(".repeat(30) + "u" + ")".repeat(30),
    ]) {
      expect(() => compileEquation(source)).toThrow();
    }
  });
});
