# GRAD 695 source baseline

Snapshot date: September 15, 2026. This folder contains the existing cryptocurrency dashboard as the starting point for the CISC 699 extension.

## Origin and contents

- Original local repository: `/Users/ajink/crypto-dashboard`.
- Copied source: [`crypto-dashboard/`](crypto-dashboard/).
- Latest source commit: `0530de151635367f2087733fd38d99bfc9c60ac6`, dated August 5, 2025, “First push”.
- The copy preserves the **current working tree**, including modified and untracked source and documentation. It is not a clean checkout of that commit or proof of which files were submitted for GRAD 695. The observed status is saved in [BASELINE_SOURCE_STATUS.txt](BASELINE_SOURCE_STATUS.txt).
- Included: **99 regular files, 1,755,754 bytes**: root README and ignore file; React/TypeScript frontend, assets and tests; Node/Express backend and tests; SQL schema; package manifests and lockfiles; legacy deployment configuration and documentation.
- [BASELINE_SHA256SUMS.txt](BASELINE_SHA256SUMS.txt) records each copied file. Paths in the manifest are relative to this folder. All 99 copied files were compared byte for byte with their source on the snapshot date. No source application files were edited.

The student states that they built the GRAD 695 dashboard from scratch, later used AI coding assistance, and wrote the tests. This source was reused, not generated for CISC 699. The separate new `../src/crypto_eval` configuration validator was generated during CISC 699 preparation; current assistance is documented in [AI_USAGE_LOG.md](../../AI_USAGE_LOG.md).

## Exclusions and limitations

The copy excludes Git history, AI-tool settings, environment files, installed dependencies, coverage/build output, caches, logs and database/runtime data. Only the selected regular project files are included; symlinks were not followed. Dependencies must be installed separately for frontend and backend; see [the project README](../README.md).

Legacy deployment files and examples retain their original local default credentials. They are examples requiring configuration review, not production-ready settings. The production Compose paths also require review. Historical design documents and test reports are preserved as history; their performance or coverage statements have not been reproduced. Some legacy READMEs mention a `test:coverage` command that is absent from the package scripts. Use the current setup notes in [ENVIRONMENT.md](../docs/ENVIRONMENT.md).

The existing MACD signal-line defect is preserved so later corrections can be traced. See [the reuse audit](../../supporting_materials/BASELINE_AND_REUSE.md) for the finding and information-boundary risks. No historical replay engine or evaluation result is introduced by this copy.

## Verification on September 15

Recorded in [baseline-checks-2026-09-15.txt](../evidence/baseline-checks-2026-09-15.txt): JavaScript syntax checks passed for 18 files; seven JSON manifests/configuration files parsed; the new validator's help and example-validation commands exited successfully. These checks do not type-check TypeScript or establish a working dashboard build, passing application tests, database readiness or market-data access. No application services, data downloads or live trades were run.

## How to extend it

Keep this baseline and its hashes as the comparison point. Before changing the app, record a working development copy or a version-control baseline. Extract and numerically verify indicator rules, then implement and evaluate chronological replay in the new module. Record each reused component and each correction in the engineering log. Baseline UI, authentication, portfolio features and existing indicators are prior work; the reproducible historical evaluation is the proposed new contribution.
