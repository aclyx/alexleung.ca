import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { BranchFlowSolution } from "@/features/load-flow/solver/types";
import { BusNode, LineEdge } from "@/features/load-flow/state/loadFlowStore";

import { SingleLineDiagram } from "../SingleLineDiagram";

const buses: BusNode[] = [
  { id: "a", name: "A", type: "SLACK", baseKV: 230, x: 140, y: 200 },
  { id: "b", name: "B", type: "PQ", baseKV: 230, x: 640, y: 200 },
];
const branch: LineEdge = {
  id: "line",
  fromBusId: "a",
  toBusId: "b",
  r: 0.01,
  x: 0.1,
  bHalf: 0.02,
};
const flow: BranchFlowSolution = {
  branchId: "line",
  fromBusId: "a",
  toBusId: "b",
  pFromToMW: -10,
  pToFromMW: 10.1,
  qFromToMVar: -2,
  qToFromMVar: -2,
  pLossMW: 0.1,
  qLossMVar: -4,
};
const onBusMove = jest.fn();
const props = {
  buses,
  branches: [branch],
  generators: [],
  loads: [],
  baseMVA: 100,
  showAmounts: true,
  selectedElementId: null,
  selectedElementType: null,
  onBusSelect: jest.fn(),
  onBusMove,
  onBranchSelect: jest.fn(),
  busSolutionsById: new Map(),
  branchFlowsById: new Map([["line", flow]]),
};

test("shows connected devices, including generation and load on the same bus", () => {
  const { container, rerender } = render(
    <SingleLineDiagram
      {...props}
      generators={[
        {
          id: "gen",
          busId: "b",
          pSet: 20,
          vSet: 1,
          qMin: -10,
          qMax: 10,
          status: "ON",
        },
      ]}
      loads={[{ id: "load", busId: "b", p: 0, q: 0, status: "ON" }]}
      mode="both"
      animate={true}
    />
  );
  const bus = screen.getByRole("button", {
    name: /Bus B, PQ, Generator, Load/,
  });
  expect(bus.querySelector('[data-device="generator"]')).not.toBeNull();
  expect(bus.querySelector('[data-device="load"]')).not.toBeNull();
  expect(container.querySelectorAll('[data-device="grid"]')).toHaveLength(1);
  rerender(
    <SingleLineDiagram
      {...props}
      generators={[
        {
          id: "gen",
          busId: "b",
          pSet: 20,
          vSet: 1,
          qMin: -10,
          qMax: 10,
          status: "OFF",
        },
      ]}
      loads={[{ id: "load", busId: "b", p: 10, q: 5, status: "OFF" }]}
      mode="both"
      animate={true}
    />
  );
  expect(bus.querySelector("[data-device]")).toBeNull();
});

test("does not invent a load at an empty PQ bus or a second source at a slack generator", () => {
  const { container } = render(
    <SingleLineDiagram
      {...props}
      generators={[
        {
          id: "gen",
          busId: "a",
          pSet: 20,
          vSet: 1,
          qMin: -10,
          qMax: 10,
          status: "ON",
        },
      ]}
      mode="both"
      animate={false}
    />
  );
  expect(container.querySelectorAll('[data-device="generator"]')).toHaveLength(
    1
  );
  expect(container.querySelector('[data-device="grid"]')).toBeNull();
  expect(container.querySelector('[data-device="load"]')).toBeNull();
});

test("draws reverse P and Q leaving both ends without conflating directions", () => {
  const { container, rerender } = render(
    <SingleLineDiagram {...props} mode="both" animate={true} />
  );
  expect(
    container.querySelector('[data-component="p"] [data-terminal="from"]')
  ).toHaveAttribute("data-direction", "-1");
  expect(
    container.querySelector('[data-component="p"] [data-terminal="to"]')
  ).toHaveAttribute("data-direction", "-1");
  expect(
    container.querySelector('[data-component="q"] [data-terminal="from"]')
  ).toHaveAttribute("data-direction", "-1");
  expect(
    container.querySelector('[data-component="q"] [data-terminal="to"]')
  ).toHaveAttribute("data-direction", "1");
  expect(screen.getAllByTestId("flow-motion")).toHaveLength(4);
  expect(screen.getAllByTestId("flow-motion")[0]).toHaveStyle({
    animationDuration: "5.2s",
    animationDirection: "reverse",
  });
  rerender(<SingleLineDiagram {...props} mode="p" animate={false} />);
  expect(container.querySelector('[data-component="q"]')).toBeNull();
  expect(screen.queryByTestId("flow-motion")).toBeNull();
});

test("amounts can be hidden without hiding flow arrows", () => {
  const { container } = render(
    <SingleLineDiagram
      {...props}
      mode="both"
      animate={true}
      showAmounts={false}
    />
  );
  expect(screen.queryByTestId("line-amount")).toBeNull();
  expect(container.querySelector('[data-component="p"]')).not.toBeNull();
});

test("source amounts add local demand to solved injections, not generator setpoints", () => {
  const { rerender } = render(
    <SingleLineDiagram
      {...props}
      mode="both"
      animate={false}
      generators={[
        {
          id: "g",
          busId: "b",
          pSet: 50,
          vSet: 1,
          qMin: -100,
          qMax: 100,
          status: "ON",
        },
      ]}
      loads={[{ id: "l", busId: "b", p: 20, q: 10, status: "ON" }]}
      busSolutionsById={
        new Map([
          [
            "b",
            {
              busId: "b",
              voltageMagnitudePu: 1,
              voltageAngleDeg: 0,
              pInjectionPu: 0.3,
              qInjectionPu: -0.03,
            },
          ],
        ])
      }
    />
  );
  const bus = screen.getByRole("button", { name: /Bus B,/ });
  expect(bus).toHaveAttribute(
    "aria-description",
    "Generator: 50.0 MW, 7.0 MVAr; Load: 20.0 MW, 10.0 MVAr"
  );
  expect(bus.querySelector('[data-device="generator"]')).toHaveTextContent(
    "50.0 MW"
  );
  expect(bus.querySelector('[data-device="generator"]')).toHaveTextContent(
    "7.0 MVAr"
  );
  rerender(<SingleLineDiagram {...props} mode="both" animate={false} />);
  expect(screen.queryByTestId("device-amount")).toBeNull();
});

test("zero flows do not animate", () => {
  render(
    <SingleLineDiagram
      {...props}
      mode="both"
      animate={true}
      branchFlowsById={
        new Map([
          [
            "line",
            {
              ...flow,
              pFromToMW: 0,
              pToFromMW: 0,
              qFromToMVar: 0,
              qToFromMVar: 0,
            },
          ],
        ])
      }
    />
  );
  expect(screen.queryByTestId("flow-motion")).toBeNull();
});

test("never displays solved arrows for an out-of-service circuit", () => {
  const { container } = render(
    <SingleLineDiagram
      {...props}
      branches={[{ ...branch, status: "OUT_OF_SERVICE" }]}
      mode="both"
      animate={true}
    />
  );
  expect(container.querySelector("[data-component]")).toBeNull();
});

test("keeps the viewport fixed during keyboard moves, then fits on request", () => {
  const { rerender } = render(
    <SingleLineDiagram {...props} mode="both" animate={false} />
  );
  const diagram = screen.getByTestId("load-flow-diagram");
  const before = diagram.getAttribute("viewBox");
  fireEvent.keyDown(screen.getByRole("button", { name: /Bus A,/ }), {
    key: "ArrowLeft",
  });
  expect(onBusMove).toHaveBeenCalledWith("a", 130, 200);
  rerender(
    <SingleLineDiagram
      {...props}
      buses={[{ ...buses[0], x: -200 }, buses[1]]}
      mode="both"
      animate={false}
    />
  );
  expect(diagram).toHaveAttribute("viewBox", before);
  fireEvent.click(screen.getByRole("button", { name: "Fit diagram" }));
  expect(diagram).not.toHaveAttribute("viewBox", before);
});

function interactiveDiagram(width = 780, height = 520) {
  const result = render(
    <SingleLineDiagram {...props} mode="both" animate={false} />
  );
  const diagram = screen.getByTestId("load-flow-diagram");
  Object.defineProperties(diagram, {
    clientWidth: { value: width },
    clientHeight: { value: height },
    clientLeft: { value: 1 },
    clientTop: { value: 1 },
    getBoundingClientRect: {
      value: () => ({
        left: 10,
        top: 20,
        width: width + 2,
        height: height + 2,
      }),
    },
    setPointerCapture: { value: jest.fn() },
  });
  function view() {
    const [x, y, width, height] = diagram
      .getAttribute("viewBox")!
      .split(" ")
      .map(Number);
    return { x, y, width, height };
  }
  function worldAt(clientX: number, clientY: number) {
    const box = view();
    const scale = Math.max(box.width / width, box.height / height);
    return {
      x: box.x + box.width / 2 + (clientX - 11 - width / 2) * scale,
      y: box.y + box.height / 2 + (clientY - 21 - height / 2) * scale,
    };
  }
  return { ...result, diagram, view, worldAt };
}

function touch(
  target: Element,
  type:
    | "pointerDown"
    | "pointerMove"
    | "pointerUp"
    | "pointerCancel"
    | "lostPointerCapture",
  pointerId: number,
  clientX: number,
  clientY: number
) {
  const event = createEvent[type](target, {
    bubbles: true,
    cancelable: true,
    button: 0,
    pointerId,
    clientX,
    clientY,
  });
  // JSDOM's shared PointerEvent shim only supplies pointerId.
  Object.defineProperty(event, "pointerType", { value: "touch" });
  fireEvent(target, event);
}

test.each([
  { width: 1000, height: 520, metaKey: true, ctrlKey: false },
  { width: 340, height: 540, metaKey: false, ctrlKey: true },
])("modifier zoom stays anchored across a burst ($width px wide)", (size) => {
  const { diagram, view, worldAt } = interactiveDiagram(
    size.width,
    size.height
  );
  const before = worldAt(150, 190);
  act(() => {
    for (let step = 0; step < 10; step++) {
      const event = new WheelEvent("wheel", {
        cancelable: true,
        clientX: 150,
        clientY: 190,
        deltaY: -4,
        metaKey: size.metaKey,
        ctrlKey: size.ctrlKey,
      });
      diagram.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });
  expect(view().width).toBeCloseTo(
    780 / Math.exp(40 * (size.ctrlKey ? 0.01 : 0.002))
  );
  expect(worldAt(150, 190).x).toBeCloseTo(before.x);
  expect(worldAt(150, 190).y).toBeCloseTo(before.y);
});

test("ordinary scrolling is untouched, with normalized deltas and bounded zoom", () => {
  const { diagram, view } = interactiveDiagram();
  const original = view();
  const ordinary = createEvent.wheel(diagram, {
    deltaY: 100,
    cancelable: true,
  });
  fireEvent(diagram, ordinary);
  expect(ordinary.defaultPrevented).toBe(false);
  expect(view()).toEqual(original);
  fireEvent.wheel(diagram, { metaKey: true, deltaY: -2, deltaMode: 1 });
  expect(view().width).toBeCloseTo(780 / Math.exp(32 * 0.002));
  fireEvent.click(screen.getByRole("button", { name: "Fit diagram" }));
  fireEvent.wheel(diagram, { metaKey: true, deltaY: -1, deltaMode: 2 });
  expect(view().width).toBeCloseTo(780 / Math.exp(520 * 0.002));
  fireEvent.wheel(diagram, { metaKey: true, deltaY: -100000 });
  expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  expect(view().width).toBeCloseTo(780 / 8);
  fireEvent.wheel(diagram, { metaKey: true, deltaY: 100000 });
  expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
  expect(view().width).toBeCloseTo(780 / 0.5);
  fireEvent.click(screen.getByRole("button", { name: "Fit diagram" }));
  expect(view()).toEqual(original);
});

test("touch pinch zooms and pans without moving a bus or selecting a line on release", () => {
  const { diagram, view, worldAt } = interactiveDiagram();
  const bus = screen.getByRole("button", { name: /Bus A,/ });
  const line = screen.getByRole("button", { name: /Line line:/ });
  Object.defineProperty(bus, "setPointerCapture", { value: jest.fn() });
  Object.defineProperty(line, "setPointerCapture", { value: jest.fn() });
  const anchor = worldAt(300, 240);
  onBusMove.mockClear();
  props.onBranchSelect.mockClear();
  touch(bus, "pointerDown", 1, 200, 240);
  touch(line, "pointerDown", 2, 400, 240);
  touch(diagram, "pointerMove", 1, 100, 260);
  touch(diagram, "pointerMove", 2, 500, 260);
  expect(view().width).toBeCloseTo(390);
  expect(worldAt(300, 260).x).toBeCloseTo(anchor.x);
  expect(worldAt(300, 260).y).toBeCloseTo(anchor.y);
  const afterPinch = view();
  touch(diagram, "pointerUp", 2, 500, 260);
  touch(diagram, "pointerMove", 1, 110, 260);
  expect(view()).toEqual(afterPinch);
  touch(diagram, "pointerUp", 1, 110, 260);
  fireEvent.click(line, { detail: 1 });
  expect(props.onBranchSelect).not.toHaveBeenCalled();
  expect(onBusMove).not.toHaveBeenCalled();
  touch(line, "pointerDown", 3, 300, 260);
  touch(line, "pointerUp", 3, 300, 260);
  fireEvent.click(line, { detail: 1 });
  expect(props.onBranchSelect).toHaveBeenCalledWith("line");
});

const pointerEnds: Array<"pointerCancel" | "lostPointerCapture"> = [
  "pointerCancel",
  "lostPointerCapture",
];
test.each(pointerEnds)(
  "%s ends a touch gesture and a fresh drag still works",
  (end) => {
    const { diagram, view } = interactiveDiagram();
    touch(diagram, "pointerDown", 1, 200, 240);
    touch(diagram, "pointerDown", 2, 400, 240);
    touch(diagram, end, 1, 200, 240);
    touch(diagram, end, 2, 400, 240);
    const before = view();
    touch(diagram, "pointerMove", 1, 100, 240);
    expect(view()).toEqual(before);
    touch(diagram, "pointerDown", 3, 200, 240);
    touch(diagram, "pointerMove", 3, 230, 260);
    expect(view().x).toBeCloseTo(before.x - 30);
    expect(view().y).toBeCloseTo(before.y - 20);
  }
);

test("Safari gesture scaling is incremental, anchored, and not doubled by wheel events", () => {
  const { diagram, view, worldAt } = interactiveDiagram();
  const anchor = worldAt(180, 200);
  function gesture(type: string, scale: number) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { scale, clientX: 180, clientY: 200 });
    fireEvent(diagram, event);
    expect(event.defaultPrevented).toBe(true);
  }
  gesture("gesturestart", 1);
  gesture("gesturechange", 1.25);
  fireEvent.wheel(diagram, { ctrlKey: true, deltaY: -20 });
  gesture("gesturechange", 2);
  expect(view().width).toBeCloseTo(390);
  expect(worldAt(180, 200).x).toBeCloseTo(anchor.x);
  expect(worldAt(180, 200).y).toBeCloseTo(anchor.y);
  gesture("gestureend", 2);
  fireEvent.wheel(diagram, { metaKey: true, deltaY: -20 });
  expect(view().width).toBeLessThan(390);
});
