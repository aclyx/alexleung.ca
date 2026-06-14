import {
  createInitialRouteRepairState,
  createRouteRepairPuzzle,
  DEFAULT_ROUTE_REPAIR_SEED,
  Direction,
  moveRouteRepairSignal,
  solveRouteRepairPuzzle,
} from "../routeRepair";

const defaultPuzzle = createRouteRepairPuzzle(DEFAULT_ROUTE_REPAIR_SEED);

function playDirections(directions: Direction[]) {
  return directions.reduce(
    moveRouteRepairSignal,
    createInitialRouteRepairState(defaultPuzzle)
  );
}

describe("route repair game model", () => {
  it("generates deterministic puzzles from a seed", () => {
    expect(createRouteRepairPuzzle(1234)).toEqual(
      createRouteRepairPuzzle(1234)
    );
    expect(createRouteRepairPuzzle(1234)).not.toEqual(
      createRouteRepairPuzzle(1235)
    );
  });

  it("generates solvable puzzles within the move budget", () => {
    for (const seed of [404, 405, 512, 1337, 20260614]) {
      const puzzle = createRouteRepairPuzzle(seed);
      const solution = solveRouteRepairPuzzle(puzzle);

      expect(solution).toBeDefined();
      expect(solution?.length).toBeLessThanOrEqual(puzzle.moveLimit);
    }
  });

  it("starts with the first packet active and a full generated move budget", () => {
    const state = createInitialRouteRepairState(defaultPuzzle);

    expect(state.status).toBe("playing");
    expect(state.activePacketIndex).toBe(0);
    expect(state.movesRemaining).toBe(defaultPuzzle.moveLimit);
    expect(state.currentPath).toEqual([defaultPuzzle.packets[0]?.start]);
  });

  it("ignores blocked cells without spending moves", () => {
    const blockedPuzzle = {
      ...defaultPuzzle,
      blockedCells: [{ column: 1, row: defaultPuzzle.packets[0].start.row }],
    };
    const state = createInitialRouteRepairState(blockedPuzzle, 3);
    const afterBlockedMove = moveRouteRepairSignal(state, "right");

    expect(afterBlockedMove.movesRemaining).toBe(3);
    expect(afterBlockedMove.lastMessage).toContain("blocked");
  });

  it("delivers a packet when the active signal reaches its port", () => {
    const firstPacketTarget = defaultPuzzle.packets[0]?.target;
    const firstPacketSolution = solveRouteRepairPuzzle({
      ...defaultPuzzle,
      packets: [defaultPuzzle.packets[0]],
    });

    if (!firstPacketSolution) {
      throw new Error("Expected first packet to be solvable");
    }

    const state = playDirections(firstPacketSolution);

    expect(state.deliveredRoutes).toHaveLength(1);
    expect(state.deliveredRoutes[0]?.packetId).toBe("about");
    expect(state.activePacketIndex).toBe(1);
    expect(state.deliveredRoutes[0]?.path.at(-1)).toEqual(firstPacketTarget);
  });

  it("wins after all generated packet routes are delivered", () => {
    const solution = solveRouteRepairPuzzle(defaultPuzzle);

    if (!solution) {
      throw new Error("Expected default puzzle to be solvable");
    }

    const state = playDirections(solution);

    expect(state.status).toBe("won");
    expect(state.deliveredRoutes.map((route) => route.packetId)).toEqual([
      "about",
      "blog",
      "now",
      "contact",
    ]);
  });

  it("can lose when the move budget runs out", () => {
    const state = moveRouteRepairSignal(
      createInitialRouteRepairState(defaultPuzzle, 1),
      "right"
    );

    expect(state.status).toBe("lost");
    expect(state.movesRemaining).toBe(0);
  });
});
