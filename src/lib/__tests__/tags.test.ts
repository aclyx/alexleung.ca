import { sortTagsByPopularity } from "../tags";

describe("sortTagsByPopularity", () => {
  it("orders tags by count descending and name ascending", () => {
    const tags = [
      { name: "Review", count: 2 },
      { name: "AI", count: 4 },
      { name: "Book Notes", count: 3 },
      { name: "Architecture", count: 2 },
    ];

    expect(sortTagsByPopularity(tags)).toEqual([
      { name: "AI", count: 4 },
      { name: "Book Notes", count: 3 },
      { name: "Architecture", count: 2 },
      { name: "Review", count: 2 },
    ]);
    expect(tags[0]).toEqual({ name: "Review", count: 2 });
  });
});
