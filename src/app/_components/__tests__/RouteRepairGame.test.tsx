import { fireEvent, render, screen } from "@testing-library/react";

import {
  createRouteRepairPuzzle,
  DEFAULT_ROUTE_REPAIR_SEED,
  Direction,
  solveRouteRepairPuzzle,
} from "@/features/route-repair/routeRepair";

import { RouteRepairGame } from "../RouteRepairGame";

const directionKeys: Record<Direction, string> = {
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
};

describe("RouteRepairGame", () => {
  it("renders the playable board with 404 recovery actions", () => {
    const puzzle = createRouteRepairPuzzle(DEFAULT_ROUTE_REPAIR_SEED);
    render(<RouteRepairGame randomizeOnMount={false} />);

    expect(
      screen.getByRole("heading", { name: "Route Repair" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Route Repair board" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("button", { name: "Restart" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "New puzzle" })).toBeEnabled();
    expect(screen.getByText(`Seed ${puzzle.seed}`)).toBeVisible();
  });

  it("supports keyboard movement and advances to the next packet", () => {
    const puzzle = createRouteRepairPuzzle(DEFAULT_ROUTE_REPAIR_SEED);
    render(<RouteRepairGame randomizeOnMount={false} />);

    const board = screen.getByRole("group", { name: "Route Repair board" });
    const firstPacketPuzzle = {
      ...puzzle,
      packets: [puzzle.packets[0]],
    };
    const firstPacketSolution = solveRouteRepairPuzzle(firstPacketPuzzle);

    if (!firstPacketSolution) {
      throw new Error("Expected first packet to be solvable");
    }

    board.focus();

    firstPacketSolution.forEach((direction) => {
      fireEvent.keyDown(board, { key: directionKeys[direction] });
    });

    expect(screen.getByText(/Active path/)).toHaveTextContent("/blog/");
    expect(screen.getByText("1/4")).toBeInTheDocument();
  });

  it("restarts after pointer movement changes the move budget", () => {
    const puzzle = createRouteRepairPuzzle(DEFAULT_ROUTE_REPAIR_SEED);
    render(<RouteRepairGame randomizeOnMount={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Move right" }));
    expect(screen.getByText(String(puzzle.moveLimit - 1))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    expect(
      screen.getAllByText(String(puzzle.moveLimit))[0]
    ).toBeInTheDocument();
    expect(screen.getByText("0/4")).toBeInTheDocument();
  });

  it("generates a new puzzle on request", () => {
    const initialPuzzle = createRouteRepairPuzzle(DEFAULT_ROUTE_REPAIR_SEED);
    const nextPuzzle = createRouteRepairPuzzle(initialPuzzle.seed + 1);
    render(<RouteRepairGame randomizeOnMount={false} />);

    fireEvent.click(screen.getByRole("button", { name: "New puzzle" }));

    expect(screen.getByText(`Seed ${nextPuzzle.seed}`)).toBeVisible();
    expect(screen.getByText("0/4")).toBeInTheDocument();
  });
});
