# Eval-Flywheel-Platform

A **data flywheel** for an LLM agent, built as a real system:

**production traces → auto-curated golden dataset → k-trial evals (pass@k / pass^k) → LLM judge calibrated against human labels → regression attribution → CI gate**

The system under test is a text-to-SQL analyst agent over a seeded SQLite shop database. Correctness can be *executed* (the agent's result set is compared to a gold query's), which gives exact pass/fail and makes run-to-run variance visible.

## Build phases

This repo is built in 10 phases, one commit each:

| Phase | What it adds |
|---|---|
| ✅ 1 | Project scaffold + deterministic shop database |
| ✅ 2 | The text-to-SQL analyst agent (read-only SQL tools + agent loop) |
| ✅ 3 | Golden dataset + code scorers + LLM judge |
| ✅ 4 | Config + deterministic mock models (keyless mode) |
| ✅ 5 | k-trial eval runner: pass@k, pass^k, flaky cases, run fingerprints |
| 6 | Human labeling + LLM judge calibration (weighted Cohen's κ) |
| 7 | Production tracing (Braintrust), feedback API, web UI, traffic simulator |
| 8 | Auto-curation: production traces → golden dataset |
| 9 | Regression attribution + CI gate logic |
| 10 | GitHub Actions (CI gate + nightly curation), baseline, full docs |

## Quick start (so far)

Requires Node ≥ 22.13 (uses built-in `node:sqlite`); `nvm use` picks it up from `.nvmrc`.

**Keyless mode:** without `OPENAI_API_KEY` (or with `MOCK=1`), deterministic mock models stand in for OpenAI, so everything runs offline and reproducibly. The mocks are a test double, not a benchmark of real model quality.

```bash
npm install
```

```bash
npm run db:seed
```

```bash
npm test
```

Run the eval (every case 5 times, keyless):

```bash
npm run eval -- --mock --k 5
```
