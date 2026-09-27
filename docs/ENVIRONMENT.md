# Environment inventory

Machine and installed application versions were observed on September 14, 2026. Dependency scopes were updated September 15 for the copied GRAD 695 application. A copied package manifest is not evidence that its dependencies are installed or its app works on the recorded machine.

| Item | Observed value | Role |
| --- | --- | --- |
| Operating system | macOS 27.0, build 26A428 | Verified with `sw_vers` |
| Architecture | arm64 | Local machine architecture |
| Installed physical memory | 25,769,803,776 bytes, or 24 GiB | Verified with `sysctl -n hw.memsize` |
| Node.js | v24.4.1 | Runs the starter CLI |
| Git | 2.50.1 Apple Git 155 | Local version control |
| New validator runtime packages | None | Root package uses the Node standard library only |
| New validator development packages | None | Root starter needs no test framework or bundler |
| Installed editor | Visual Studio Code 1.137.0 | Application `Info.plist` version; project use and IDE build not verified |
| Installed document application | Microsoft Word 16.112.4 | Application `Info.plist` version; not a project runtime dependency |
| Copied app database definition | PostgreSQL schema in `baseline/crypto-dashboard/database/` | Schema presence does not establish a running database or existing data |
| External credentials for the validator | None | CLI validates a local JSON file; copied app configuration is a separate scope |

The recorded Node version is pinned in the root `.nvmrc` for the new validator. Its package engine range records the selected major version; cross-version compatibility has not been tested. No compiler is required for this JavaScript starter. This Node setting does not establish compatibility of the copied frontend/backend or their container images.

The installed editor and Word versions were read from their application `Contents/Info.plist` files in `/Applications`. These observations establish installed versions, not a successful build or test of the project. The September 14 `evidence/readiness.txt` records the new validator's command-line checks only. It does not validate the copied dashboard or a historical evaluation. Student verification of the environment description remains pending.

## Dependency scopes

| Directory | Scope | Current boundary |
| --- | --- | --- |
| `project/` | New CISC 699 validator | Root `package.json`; no third-party dependencies or install step |
| `baseline/crypto-dashboard/frontend/` | Existing frontend | Independent `package.json`, `package-lock.json`, source, build configuration and tests |
| `baseline/crypto-dashboard/backend/` | Existing backend | Independent `package.json`, `package-lock.json`, source and tests |
| `baseline/crypto-dashboard/database/` | Existing database schema | SQL definitions retained; service availability and data are unverified |
| `baseline/crypto-dashboard/deployment/` | Existing deployment configuration | Container and web-server configuration retained; no deployment is implied |

The baseline keeps source and dependency specifications separate from installed packages and generated output. Both copied applications have package version `1.0.0`, lockfile version 3 and no declared Node `engines` field. Consult `baseline/BASELINE_PROVENANCE.md` for the actual filter and verification record. Do not infer working services, imported historical data, test coverage or passing suites from the copied files.

## Copied application manifests

| Scope | Main declared packages | Declared verification scripts |
| --- | --- | --- |
| Frontend | React and React DOM `^18.2.0`, `react-scripts` `5.0.1`, TypeScript `^4.9.0`, Recharts `^2.8.0` | `build`: `react-scripts build`; `test`: `react-scripts test --coverage --watchAll=false` |
| Backend | Express `^4.18.2`, PostgreSQL client `pg` `^8.11.3`, dotenv `^16.3.1`, WebSocket `ws` `^8.14.2`, node-cron `^3.0.2`, bcryptjs `^2.4.3`, jsonwebtoken `^9.0.2` | `test`: `NODE_ENV=test jest --coverage`; no build script declared |

These are manifest declarations, not installed-version or execution claims. Run later frontend/backend verification from each application's own directory using its package scripts after dependencies and runtime compatibility are established. The inherited README's `test:coverage` command is not declared in either manifest.

The frontend declares direct Jest `^30.0.3`, ts-jest `^29.4.0` and Jest type definitions `^27.5.2`, alongside Create React App's test runner. Its separate Jest configuration also has legacy project paths that need review. Do not assume direct Jest invocation is equivalent to the package's `test` script. Backend tests use Jest `^29.7.0` and Supertest `^6.3.3`.

Legacy deployment files specify Node 18 Alpine and PostgreSQL 15 Alpine images and contain unaudited local/default configuration. Those files are preserved source, not deployment-ready settings or verification of compatibility with the local Node 24 runtime. Review configuration and dependency compatibility before starting services.

## September 15 verification boundary

`evidence/baseline-checks-2026-09-15.txt` records successful syntax checks for 18 JavaScript files, successful parsing of seven JSON files, and successful validator help and valid-example commands. The JavaScript set comprises 15 copied backend source files, the frontend Jest configuration and two new validator files. TypeScript was not type-checked. No frontend/backend build or test suite, dependency installation, server, database or external market-data request was run.

For new evaluation dependencies, record the selected version and lockfile when a package is introduced. Keep those changes outside the preserved baseline until the reuse boundary and modification history are explicit.
