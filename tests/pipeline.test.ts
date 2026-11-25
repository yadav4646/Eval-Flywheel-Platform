// End-to-end in mock mode: the real agent loop, tools, SQL, scorers and
// metrics, with deterministic mock models.

import { describe, expect, it } from "vitest";
import { loadGolden } from "../evals/dataset";
import { runEval } from "../flywheel/run";

const ids = ["filter-de-customers", "rev-total-2024", "rev-q4-2024", "rev-monthly-2025", "rev-aov", "agg-return-rate", "unans-conversion-rate", "rev-by-top-category"];
const cases = loadGolden().filter((c) => ids.includes(c.id));
const quiet = { mock: true, cases, judge: false, sendLogs: false, quiet: true } as const;

describe("k-trial runner", () => {
  it("is deterministic in mock mode and reports pass@k >= pass^k", async () => {
    const a = await runEval({ ...quiet, k: 5 });
    const b = await runEval({ ...quiet, k: 5 });
    expect(a.cases.map((c) => c.trials.map((t) => t.pass))).toEqual(b.cases.map((c) => c.trials.map((t) => t.pass)));
    const s = a.summary.overall;
    expect(s.trialsPerCase).toBe(5);
    expect(s.passAt[5]).toBeGreaterThanOrEqual(s.passAt[1]);
    expect(s.passHat[5]).toBeLessThanOrEqual(s.passAt[1]);
    expect(a.cases.every((c) => c.trials.length === 5)).toBe(true);
  });
});
