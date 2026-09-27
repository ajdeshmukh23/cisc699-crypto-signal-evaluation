# Engineering log

## September 14 2026

**Purpose.** Prepare a local CISC 699 starter workspace for the proposed historical evaluation extension of the existing GRAD 695 cryptocurrency dashboard.

**Actual work.** Created a separate workspace with a Node.js command-line entry point, proposal configuration validator, README, environment inventory, design outline, and local backlog. Initialized local Git without creating a remote or changing the original dashboard. The original backend package manifest was read to confirm the existing Node and Express stack. No original dashboard source was copied or edited.

**Verification.** Recorded the local runtime and operating-system architecture. Ran CLI help and validated the example configuration. Checked that a negative fee is rejected. See `../evidence/readiness.txt` for actual output and return codes. These checks cover only the starter's configuration behavior; no market strategy or experimental result has been tested.

**Decisions and assumptions.** Use JavaScript and Node for the starter to stay close to the existing backend. The proposed pilot is one-hour BTCUSD with three comparisons and next-bar simulated execution. The example costs are assumptions for later review, not verified exchange fees. Final data source, history period, parameter definitions, targets, supervisor and late-submission conditions remain unresolved.

**Assistance.** Codex generated this starter and documentation under the student's instruction. Student review and disclosure are pending. No code has been represented as independently student-written.

**Next actions.** Student reviews and completes the assignment explanations; obtain actual instructor guidance; verify baseline rule definitions and permitted historical data; implement and check the evaluation core only after the protocol is established.

## September 14 2026 inventory verification

Read-only system checks confirmed macOS 27.0 build 26A428, arm64 architecture, and 24 GiB of physical memory. Application metadata confirmed installed Visual Studio Code 1.137.0 and Microsoft Word 16.112.4. Updated `ENVIRONMENT.md` to distinguish installed software from verified project execution. The memory query initially encountered a sandbox restriction and succeeded on the authorized retry. No serial numbers, account details, or network configuration were collected.

No project code changed and no additional tests, commits, remotes, data downloads, or uploads were performed. The prior command-line validator checks remain the only execution evidence; student review of the environment description remains pending.

## September 15 2026 baseline copy

**Purpose and work.** Under the student's instruction, preserved a filtered copy of the current GRAD 695 working tree in `baseline/crypto-dashboard/`, separate from the new `src/crypto_eval/` validator. The copy contains 99 regular files totaling 1,755,754 bytes: frontend and backend source, database schema, tests, dependency manifests and lockfiles, deployment configuration and existing documentation. The original `/Users/ajink/crypto-dashboard` was preserved. Existing modified and untracked files are part of this current snapshot; it is not identified as the exact earlier submitted version.

**Provenance.** Every included file was byte-matched to the source, which remained unchanged. `baseline/BASELINE_PROVENANCE.md` describes the boundary; `BASELINE_SHA256SUMS.txt` records file identities and `BASELINE_SOURCE_STATUS.txt` records source working-tree status. The copy excludes original Git internals, `.env`, installed packages, coverage/build/dist output and `.claude` metadata. Legacy local/default deployment configuration and historical reports remain unaudited source material. The known MACD signal-line error is preserved for a separately documented correction.

**Checks performed.** The record in `../evidence/baseline-checks-2026-09-15.txt` reports 18 successful JavaScript syntax checks, seven successful JSON parses, and successful validator help and valid-example commands. The syntax set covers 15 copied backend source files, the frontend Jest configuration and the two new validator files. No TypeScript compilation, frontend/backend build or test suite, dependency installation, app startup, database access or market-data request was performed. No passing application-test count, coverage, backtest result or operational service is claimed.

**Documentation and next steps.** Updated the README, architecture, environment inventory, backlog and ignore rules to separate baseline dependencies from the new validator. The student's current commitment remains 8–10 hours weekly. Next work is to review the copied dependency/test configuration, verify the baseline's relevant behavior, define corrected indicators, establish permitted historical data and implement the evaluation module. Copying the existing application does not complete those tasks.

**Assistance.** Codex assisted the copy, local checks and documentation. Student review, independent verification and disclosure remain required.

**Assignment package alignment.** Synchronized both assignment packages with the same baseline, generated configuration validator, 8–10-hour commitment and unknown-supervisor status. Updated the shared README and requirements map and created a separate A02 completion checklist. A01's September 15 Word revision passed native review at nine pages. The revised A02 proposal and brief passed native Word Print Layout review at 100%, at seven pages and one page. Both ZIPs were refreshed and checked for integrity, manifest hashes and current-file identity; matching extracted folders were verified. Previous package snapshots are preserved under the root archive directory. The required student recording, independent content/source/code review and actual feedback remain open. This documentation update introduced no new application tests, runtime results, uploads or approval claims.

## September 27 2026 scope update and GitHub setup

**Scope.** Project direction updated from historical evaluation of rule-based signals only to a two-stage project: (1) fix indicators and replay rule-based signals with realistic costs; (2) compare ML signal models (logistic regression, LightGBM, LSTM stretch) under walk-forward evaluation. Scope set to BTC/USDT and ETH/USDT, 1-hour candles, 2020–2026. Success criteria: beats buy-and-hold and MA crossover on Sharpe after fees; drawdown ≥25% smaller than buy-and-hold; ≥53% directional accuracy; held-out Sharpe ≥½ development Sharpe, positive at 2× costs, reproducible.

**Work.** Added the Python `evaluation/` module (Binance archive downloader, data-quality report, 2 unit tests) in a Python 3.13 virtual environment (pyenv 3.12 install is broken). Downloaded and validated January 2024 BTCUSDT and ETHUSDT: 744 rows each, no gaps, duplicates or invalid OHLC rows (`evidence/python-starter-2026-09-27.txt`). Redrew the context diagram (`docs/diagrams/context.png`). First commit, pushed to public GitHub repo `ajdeshmukh23/cisc699-crypto-signal-evaluation`; created 10 issues by hard stop. Found a hardcoded JWT fallback secret in the baseline backend (issue #9).

**Assistance.** Claude (Claude Code) assisted with the Python starter, diagram, GitHub setup and documentation.
