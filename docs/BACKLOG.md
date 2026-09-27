# Project backlog

Created September 14, 2026; updated September 15 for the GRAD 695 baseline copy. This local Markdown backlog serves as the issue tracker. All implementation items remain open unless explicitly marked complete. Dates below are the course hard stops; acceptance of the overdue proposal is pending instructor guidance.

September 14 planning note: the student planned A01 submission that day. No receipt or scope approval is established by this note. A02 status is unchanged.

| ID | Work item | Completion evidence | Status | Dependency |
| --- | --- | --- | --- | --- |
| SETUP01 | Create an isolated starter workspace | Local Git repository, README, CLI, configuration, and actual readiness output | Complete | None |
| PLAN01 | Student completes proposal and launch packet | Student-authored explanations, source annotations, and AI disclosure | Open | None |
| PLAN02 | Confirm supervisor and late submission conditions | Actual written response recorded without inference | Open | PLAN01 |
| BASE01 | Inventory existing dashboard rules and reuse boundaries | Source references and checksums; GRAD 695 versus CISC 699 comparison | Open | None |
| BASE02 | Preserve a filtered copy of the existing app | 99 files byte-matched to source; provenance, source-status record and checksum manifest in `baseline/` | Complete September 15 | None |
| BASE03 | Establish copied-app readiness separately from the validator | Frontend/backend build and test results, dependency compatibility and service limitations; syntax/JSON/validator checks are already recorded separately | Open | BASE02 |
| DATA01 | Verify one permitted historical source | Access result, license notes, coverage report, sample schema | Open | PLAN02 |
| RULE01 | Specify indicator and strategy definitions | Versioned formulas, parameters, warm-up and missing-data rules | Open | BASE01 |
| RULE02 | Check indicator values independently | Hand-worked fixtures and independent numerical comparisons | Open | RULE01 |
| DATA02 | Implement import and data validation | Ordered immutable candles, gap report, provenance manifest | Open | DATA01 |
| SIM01 | Implement causal historical replay | Prefix-invariance checks and next-bar execution evidence | Open | DATA02, RULE02 |
| SIM02 | Implement ledger and costs | Hand-calculated accounting fixtures including fees and final liquidation | Open | SIM01 |
| EVAL01 | Implement the three fixed comparisons | Common-period and common-cost comparison output | Open | SIM02 |
| EVAL02 | Freeze evaluation protocol before held-out runs | Dated configuration and chronological split manifest | Open | EVAL01 |
| EVAL03 | Run experiments and cost sensitivity | Actual results, uncertainty and limitations, no selected-only reporting | Open | EVAL02 |
| REPRO01 | Make runs repeatable | Documented command and matching result hashes on repeated input | Open | EVAL01 |
| UI01 | Add local results view or report | Ledger, metric summary, provenance and simulation labels | Open | EVAL01 |
| REPORT01 | Write final analysis and limitations | Student-authored report traceable to actual outputs | Open | EVAL03, REPRO01 |
| DEFEND01 | Prepare and rehearse defense | Student presentation and recorded rehearsal | Open | REPORT01 |

## Seven hard stops

| Hard stop | Course date | Planned evidence |
| --- | --- | --- |
| 1 Proposal approval | September 13, 2026 | Proposal, approval brief, launch foundations, AI log and student walkthrough; overdue, acceptance pending |
| 2 Design baseline | September 27, 2026 | Approved scope, access evidence, rule definitions, architecture and experiment protocol draft |
| 3 Early implementation | October 11, 2026 | Validated import, indicator fixtures, first causal replay and ledger examples |
| 4 Midpoint evidence | October 25, 2026 | Working comparisons, midpoint demo, defect list and initial evaluation evidence |
| 5 Reproducibility | November 8, 2026 | Frozen inputs, reproducible commands, result hashes and environment inventory |
| 6 Final testing and report | November 22, 2026 | Completed checks, final experiment tables, report and defense deck |
| 7 Final delivery | December 6, 2026 | Final artifact, report, presentation, source inventory and known limitations |

## Weekly planning outline

September 14 to 20: complete overdue foundations and supervisor communication, inspect sources, confirm feasible data access. September 21 to 27: freeze scope and design. September 28 to October 4: validate candles and indicator calculations. October 5 to 11: implement replay and accounting. October 12 to 18: integrate comparisons and prepare midpoint demo. October 19 to 25: collect midpoint evidence and correct defects. October 26 to November 1: execute the frozen evaluation protocol and analyze limits. November 2 to 8: verify reproducibility. November 9 to 15: write the report draft. November 16 to 22: complete testing and report/deck revisions. November 23 to 29: rehearse. November 30 to December 6: deliver final materials.

The syllabus planning baseline is 8 to 10 hours per week. On September 14, 2026, the student updated their confirmed commitment to **8 to 10 hours per week**, matching that expectation. Use this commitment for the schedule while domain choices, data access and supervisor approval remain pending. Prioritize one pair, one interval, three strategies and reliable accounting; defer additional assets, machine learning and live integration.
