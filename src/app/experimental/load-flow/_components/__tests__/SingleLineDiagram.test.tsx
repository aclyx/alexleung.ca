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
  selectedElementId: null,
  selectedElementType: null,
  onBusSelect: jest.fn(),
  onBusMove,
  onBranchSelect: jest.fn(),
  busSolutionsById: new Map(),
  branchFlowsById: new Map([["line", flow]]),
};

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
  rerender(<SingleLineDiagram {...props} mode="p" animate={false} />);
  expect(container.querySelector('[data-component="q"]')).toBeNull();
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
