import { fireEvent, render, screen } from "@testing-library/react";

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
