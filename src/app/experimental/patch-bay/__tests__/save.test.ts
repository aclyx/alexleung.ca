import { benchTest, newProgress, type Progress } from "../campaign";
import { restoreCode, saveCode } from "../save";

const boards = Array.from({ length: 149 }, benchTest);
const sample: Progress = {
  current: 145,
  known: [1, 2, 3, 144, 145],
  best: { 1: 356, 2: 0, 144: 9971 },
};
it("preserves timed, zero-tick and unfinished levels in a full save", () => {
  expect(restoreCode(saveCode(sample, 149, true), boards)).toEqual(sample);
});
it("carries unlocks and clears in a short code without inventing best times", () => {
  const code = saveCode(sample, 149, false);
  expect(code.length).toBeLessThan(60);
  expect(restoreCode(code, boards)).toEqual({
    ...sample,
    best: { 1: null, 2: null, 144: null },
  });
});
it("rejects altered codes and a different campaign", () => {
  const code = saveCode(newProgress(), 1, true);
  expect(() => restoreCode(code, boards)).toThrow();
  expect(() =>
    restoreCode(code.slice(0, 6) + "AAAA" + code.slice(10), [benchTest()])
  ).toThrow();
  expect(restoreCode(code, [benchTest()])).toEqual(newProgress());
});
