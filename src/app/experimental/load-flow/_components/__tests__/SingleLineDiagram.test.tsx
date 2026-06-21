import { fireEvent, render, screen } from "@testing-library/react";

import { SingleLineDiagram } from "@/app/experimental/load-flow/_components/SingleLineDiagram";
import { BusNode, LineEdge } from "@/features/load-flow/state/loadFlowStore";

const buses: BusNode[] = [
  { id: "bus-1", name: "Bus 1", type: "SLACK", baseKV: 230, x: 100, y: 100 },
  { id: "bus-2", name: "Bus 2", type: "PQ", baseKV: 230, x: 300, y: 300 },
  { id: "bus-3", name: "Bus 3", type: "PQ", baseKV: 230, x: 50, y: 20 },
  { id: "bus-4", name: "Bus 4", type: "PQ", baseKV: 230, x: 250, y: 220 },
];

const branches: LineEdge[] = [
  {
    id: "line-1",
    fromBusId: "bus-1",
    toBusId: "bus-2",
    r: 0.01,
    x: 0.1,
    bHalf: 0,
    status: "IN_SERVICE",
  },
  {
    id: "line-2",
    fromBusId: "bus-3",
    toBusId: "bus-4",
    r: 0.01,
    x: 0.1,
    bHalf: 0,
    status: "IN_SERVICE",
  },
];

const reversedBranchOrder = [branches[1], branches[0]];
const horizontalBuses: BusNode[] = [
  { id: "bus-a", name: "Bus A", type: "SLACK", baseKV: 230, x: 100, y: 100 },
  { id: "bus-b", name: "Bus B", type: "PQ", baseKV: 230, x: 300, y: 100 },
];
const horizontalBranches: LineEdge[] = [
  {
    id: "line-horizontal",
    fromBusId: "bus-a",
    toBusId: "bus-b",
    r: 0.01,
    x: 0.1,
    bHalf: 0,
    status: "IN_SERVICE",
  },
];
const tightlySpacedVerticalBuses: BusNode[] = [
  { id: "bus-a", name: "Bus A", type: "SLACK", baseKV: 230, x: 100, y: 100 },
  { id: "bus-b", name: "Bus B", type: "PQ", baseKV: 230, x: 100, y: 170 },
];
const tightlySpacedVerticalBranches: LineEdge[] = [
  {
    id: "line-too-tight",
    fromBusId: "bus-a",
    toBusId: "bus-b",
    r: 0.01,
    x: 0.1,
    bHalf: 0,
    status: "IN_SERVICE",
  },
];
const denseBranches: LineEdge[] = Array.from({ length: 21 }, (_, index) => ({
  id: `dense-line-${index + 1}`,
  fromBusId: "bus-a",
  toBusId: "bus-b",
  r: 0.01,
  x: 0.1,
  bHalf: 0,
  status: "IN_SERVICE",
}));

describe("SingleLineDiagram", () => {
  const onBusSelect = jest.fn();
  const onBusMove = jest.fn();
  const onBranchSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("supports zoom controls and ctrl-wheel zooming", () => {
    const { container } = render(
      <SingleLineDiagram
        buses={buses}
        branches={branches}
        selectedElementId={null}
        selectedElementType={null}
        onBusSelect={onBusSelect}
        onBusMove={onBusMove}
        onBranchSelect={onBranchSelect}
      />
    );

    expect(screen.getByText("100% (Ctrl + wheel)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(screen.getByText("120% (Ctrl + wheel)")).toBeInTheDocument();

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    if (!svg) {
      return;
    }

    fireEvent.wheel(svg, { deltaY: -100 });
    expect(screen.getByText("120% (Ctrl + wheel)")).toBeInTheDocument();

    fireEvent.wheel(svg, { ctrlKey: true, deltaY: -100 });
    expect(screen.getByText("140% (Ctrl + wheel)")).toBeInTheDocument();
  });

  it("renders hop markers when two line segments cross", () => {
    const { container } = render(
      <SingleLineDiagram
        buses={buses}
        branches={branches}
        selectedElementId={null}
        selectedElementType={null}
        onBusSelect={onBusSelect}
        onBusMove={onBusMove}
        onBranchSelect={onBranchSelect}
      />
    );

    const hopPaths = container.querySelectorAll('path[d*="A 10 10"]');
    expect(hopPaths.length).toBeGreaterThan(0);
  });

  it("renders hop markers regardless of branch insertion order", () => {
    const { container } = render(
      <SingleLineDiagram
        buses={buses}
        branches={reversedBranchOrder}
        selectedElementId={null}
        selectedElementType={null}
        onBusSelect={onBusSelect}
        onBusMove={onBusMove}
        onBranchSelect={onBranchSelect}
      />
    );

    const hopPaths = container.querySelectorAll('path[d*="A 10 10"]');
    expect(hopPaths.length).toBeGreaterThan(0);
  });

  it("selects buses and branches when their labels are clicked", () => {
    render(
      <SingleLineDiagram
        buses={buses}
        branches={branches}
        selectedElementId={null}
        selectedElementType={null}
        onBusSelect={onBusSelect}
        onBusMove={onBusMove}
        onBranchSelect={onBranchSelect}
      />
    );

    fireEvent.click(screen.getByText("Bus 1"));
    expect(onBusSelect).toHaveBeenCalledWith("bus-1");

    fireEvent.click(screen.getByText("line-1"));
    expect(onBranchSelect).toHaveBeenCalledWith("line-1");
  });

  it("places straight branch labels between endpoint buses", () => {
    render(
      <SingleLineDiagram
        buses={horizontalBuses}
        branches={horizontalBranches}
        selectedElementId={null}
        selectedElementType={null}
        onBusSelect={onBusSelect}
        onBusMove={onBusMove}
        onBranchSelect={onBranchSelect}
      />
    );

    const branchLabel = screen.getByText("line-horizontal");

    expect(branchLabel).toHaveAttribute("x", "200");
    expect(branchLabel).toHaveAttribute("y", "90");
  });

  it("suppresses branch labels that would overlap bus boxes", () => {
    render(
      <SingleLineDiagram
        buses={tightlySpacedVerticalBuses}
        branches={tightlySpacedVerticalBranches}
        selectedElementId={null}
        selectedElementType={null}
        onBusSelect={onBusSelect}
        onBusMove={onBusMove}
        onBranchSelect={onBranchSelect}
      />
    );

    expect(screen.queryByText("line-too-tight")).not.toBeInTheDocument();
  });

  it("suppresses unselected branch labels in dense diagrams", () => {
    const { container } = render(
      <SingleLineDiagram
        buses={horizontalBuses}
        branches={denseBranches}
        selectedElementId={null}
        selectedElementType={null}
        onBusSelect={onBusSelect}
        onBusMove={onBusMove}
        onBranchSelect={onBranchSelect}
      />
    );

    expect(screen.queryByText("dense-line-1")).not.toBeInTheDocument();
    expect(
      container.querySelectorAll('polyline[stroke="transparent"]')
    ).toHaveLength(denseBranches.length);
  });

  it("shows a selected branch label in dense diagrams when it has room", () => {
    render(
      <SingleLineDiagram
        buses={horizontalBuses}
        branches={denseBranches}
        selectedElementId="dense-line-1"
        selectedElementType="BRANCH"
        onBusSelect={onBusSelect}
        onBusMove={onBusMove}
        onBranchSelect={onBranchSelect}
      />
    );

    expect(screen.getByText("dense-line-1")).toBeInTheDocument();
    expect(screen.queryByText("dense-line-2")).not.toBeInTheDocument();
  });
});
