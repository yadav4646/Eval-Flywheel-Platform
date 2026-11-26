#!/usr/bin/env tsx
// One entry point for the whole flywheel:
//
//   eval       run k trials per case, write results/<runId>.json + reports/latest.md
//   label      hand-label answers for judge calibration
//   calibrate  measure judge-vs-human agreement (kappa)

import "dotenv/config";
import { parseArgs } from "node:util";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config";
import { isMock } from "./models";
import { REPORTS_DIR } from "./paths";
import { renderRun } from "./report";
import { latestRunPath, saveRun } from "./results";
import type { Kind, Suite, Status } from "../evals/dataset";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    mock: { type: "boolean" },
    k: { type: "string" },
    ci: { type: "boolean" },
    suite: { type: "string" },
    status: { type: "string" },
    kind: { type: "string", multiple: true },
    ids: { type: "string" },
    limit: { type: "string" },
    "no-judge": { type: "boolean" },
    "no-send": { type: "boolean" },
    label: { type: "string" },
    out: { type: "string" },
    run: { type: "string" },
    n: { type: "string" },
    labeler: { type: "string" },
  },
});

const cmd = positionals[0];
const mock = isMock(values.mock);
const k = Number(values.k ?? (values.ci ? config.eval.trials.ci : config.eval.trials.local));

function filter() {
  return {
    suite: values.suite as Suite | undefined,
    status: values.status as Status | undefined,
    kinds: values.kind as Kind[] | undefined,
    ids: values.ids?.split(",").map((s) => s.trim()),
    limit: values.limit ? Number(values.limit) : undefined,
  };
}

async function main() {
  switch (cmd) {
    case "eval": {
      const { runEval } = await import("./run");
      const run = await runEval({ mock, k, filter: filter(), judge: !values["no-judge"], label: values.label, sendLogs: values["no-send"] ? false : undefined });
      const path = saveRun(run, values.out);
      const md = renderRun(run);
      mkdirSync(REPORTS_DIR, { recursive: true });
      writeFileSync(join(REPORTS_DIR, "latest.md"), md + "\n");
      console.log(md);
      console.log(`\nResults: ${path}`);
      break;
    }
    case "label": {
      const { labelCli } = await import("./label/cli");
      await labelCli({ runPath: values.run ?? latestRunPath(), n: Number(values.n ?? 20), labeler: values.labeler });
      break;
    }
    case "calibrate": {
      const { calibrate, renderCalibration } = await import("./judge/calibrate");
      const cal = await calibrate({ mock });
      const md = renderCalibration(cal);
      writeFileSync(join(REPORTS_DIR, "judge-calibration.md"), md + "\n");
      console.log(md);
      break;
    }
    default:
      console.log(`Usage: tsx flywheel/cli.ts <eval|label|calibrate> [--mock] [--k N] ...
See README.md for every flag.`);
      process.exit(cmd ? 1 : 0);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? (process.env.DEBUG ? e.stack : e.message) : e);
  process.exit(1);
});
