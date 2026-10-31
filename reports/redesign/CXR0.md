STATUS: DONE

# CXR0 — redesign test harness (living draft)

31 October 2026. This is a living draft; the manifest and selectors can evolve as the UI is reviewed.

## 1. Mission pieces and acceptance

| Acceptance | Result | Evidence |
| --- | --- | --- |
| T1: audit unchanged current main at 1280×720 and 1600×900; list baseline findings | PASS | [Audit stdout](CXR0/checks/ui-audit.log), [structured findings](CXR0/audit/findings.json): all nine states at both sizes; **18 screens audited; 0 with findings**. Document scroll, horizontal overflow, element overlap, missing required elements, and console/page errors are empty on this demo fixture. Product sources exactly match base `d9299af90c653b0eae876b5fc67cf633d874a8cb`. |
| T2: live smoke skips with reason before the contract exists; same smoke passes a local contract stub at both sizes | PASS | [Focused output](CXR0/checks/shell-smoke.log), [results and exact skip annotations](CXR0/checks/shell-smoke-results.json). **4 passed, 2 skipped**: two independent-stub route smokes and two geometry regression probes pass; only the two live cases skip because `rail` is absent. |
| T3: comparison HTML generated from two screenshot folders | PASS | [Comparison HTML](CXR0/comparison.html), [browser preview](CXR0/comparison-preview.png), [generator output](CXR0/checks/compare.log), [unit tests](CXR0/checks/compare-test.log), [browser check](CXR0/checks/compare-browser.json). 29 relative names, 5 matched pairs, 34 image references loaded, zero broken images/page errors/viewport overflow. |
| T4: build and unchanged existing tests green | PASS | Production/classic builds, typecheck, lint, full unit rerun, and complete Playwright suite pass. **250 passed (2.4m), 2 authorized contract skips**. [Full browser output](CXR0/checks/e2e.log). |

Implementation:

- `apps/web/tools/ui-audit.mjs` consumes the manifest and defaults to **1280×720 and 1600×900**. `--mobile` optionally adds only 390×844 measurements; it is off by default. Every state prints document-scroll, horizontal-overflow and element-overlap arrays and writes `findings.json`. `--strict` exits nonzero on findings; the default preserves baseline reporting. `SCREENSHOTS=1` explicitly enables 14 desktop captures. Both rail navigation and the existing tab navigation are supported.
- `apps/web/e2e/ui/redesign-shell.spec.ts` visits all seven rail items and all nine manifest states at both desktop sizes. It checks exactly one `aria-current="page"`, all six HUD chips inside `hud`, visible required content under `screen`, no console/page errors, no page scroll, no horizontal overflow and no measured overlap. Only a missing rail allows the mission-authorized conditional skip; an existing partial rail fails. Startup console/page errors are checked before skipping. Readiness accepts the future contract as well as current main's shell.
- `apps/web/e2e/fixtures/redesign-shell.html` implements the contract independently without importing the manifest or assertion helper. Both the real app and stub call the same `smokeShell` function. Geometry probes introduce genuine overflow, document scroll and overlapping sibling buttons and verify detection while clean nested containers remain unflagged.
- `apps/web/tools/screen-manifest.json` lists Home, Bag, Map, Forge/Craft, Forge/Salvage, Forge/Relic, Market, Hero and Help. Each has `/` as the current app entry route, navigation/content test IDs, required key selectors, and legacy baseline mapping. Seven destinations plus the three Forge states is the provisional nine-screen interpretation; URL routing is not invented.
- `reports/redesign/compare.mjs` recursively matches relative image filenames, shows missing files on either side, escapes text/URLs, ignores symlinks and produces a standalone static page with relative image links. It uses no dependency. The example compares committed historical audit images with this mission's unchanged-main baseline; differences in the example are pre-existing main changes, **not UI changes made here**. There is no historical 1600×900 baseline in that folder; unmatched captures are explicitly labelled.
- `effects-test.mjs` now discovers installed Chromium on macOS/Linux, uses an owned in-process Vite server with `finally` cleanup, and gates PNG writes behind `SCREENSHOTS=1`. `--frames` opts into additional sequences; this mission did not request it. All nine existing assertions and thresholds remain unchanged.

Screenshots (14 audit images, plus one effects PNG and one comparison preview = **16 PNGs**, largest **157,119 bytes**):

| Destination | 1280×720 | 1600×900 |
| --- | --- | --- |
| Home (legacy Character/stage baseline) | [PNG](CXR0/audit/home-1280x720.png) | [PNG](CXR0/audit/home-1600x900.png) |
| Bag | [PNG](CXR0/audit/bag-1280x720.png) | [PNG](CXR0/audit/bag-1600x900.png) |
| Map (legacy Boss panel) | [PNG](CXR0/audit/map-1280x720.png) | [PNG](CXR0/audit/map-1600x900.png) |
| Forge / Craft | [PNG](CXR0/audit/forge-craft-1280x720.png) | [PNG](CXR0/audit/forge-craft-1600x900.png) |
| Market (disconnected) | [PNG](CXR0/audit/market-1280x720.png) | [PNG](CXR0/audit/market-1600x900.png) |
| Hero (legacy Character) | [PNG](CXR0/audit/hero-1280x720.png) | [PNG](CXR0/audit/hero-1600x900.png) |
| Help | [PNG](CXR0/audit/help-1280x720.png) | [PNG](CXR0/audit/help-1600x900.png) |

Forge Salvage and Relic are measured separately at both sizes in the JSON/stdout; their PNGs are omitted to keep within the screenshot budget.

## 2. Problems found and fixed

- **Baseline geometry:** no document-scroll, horizontal-overflow or element-overlap findings in the 18 measured states; no product/layout fixes were made. The overlap check is a visible-box heuristic with a 1 CSS-pixel tolerance, ancestor pairs excluded and clipping ancestors respected. It does not establish pixel-perfect visual correctness or detect every clipped text run.
- **Visual observation outside scope:** the compact Character strip at the top right of the 1600×900 captures appears crowded/clipped at the right edge; ancestor clipping means this is not reported as document overflow. Left for the shell/UI owner.
- **Missing references:** reports/ui-redesign/index.html, `BRIEF.md`, and `PLAN.md` are absent from this base and the linked Claude artifact was inaccessible. The manifest therefore uses the explicit mission contract and existing panel keys, with its nine-state interpretation labelled provisional.
- **Existing path-space test bug:** the first clean worktree was named `taskbar hero`; two game-rules guard tests tried to read `taskbar%20hero/...` because they strip `file://` instead of decoding `import.meta.url`. [Initial output](CXR0/checks/test-baseline.log). Moved the isolated worktree to `taskbar-hero`; did not edit those tests or any game-rules file. They pass there.
- **Unit timeout:** the initial space-free full unit run timed out once in the unchanged `ChapterMap` “renders five chapters” test at its existing 5-second limit while builds/browser checks were concurrent. [Failure output](CXR0/checks/test.log). A full unit rerun without this mission's competing heavy checks passes all 1,274 web tests, with no timeout/assertion/config changes. [Rerun output](CXR0/checks/test-rerun.log).
- **Harness fixes during implementation:** native Node ESM needs a JSON import attribute; both new TypeScript imports now supply it. Disconnected Market renders a `.forge-note` rather than `.market`; the manifest accepts its existing unavailable/disconnected state and selects visible matches. All final smoke cases pass.
- **Old audit coverage:** the previous audit measured Forge only after finishing the sub-tab loop and had no 1600×900 viewport or overlap details. Each manifest state is now measured independently at both desktop sizes.
- **Tool cleanup/browser portability:** the old effects script assumed `/opt/pw-browsers/chromium` and killed only the `npx` wrapper. Both audit tools now own their Vite server directly and close resources; effects falls back to Playwright's installed browser.

Existing e2e regenerated 20 tracked artifacts in `reports/f3-art/`, `reports/g1-speed/` and `reports/n1-error-screens/` despite `SCREENSHOTS=0`. Restored these generated outputs to HEAD after the passing suite; no assertions or tests were changed. [Restored-file inventory](CXR0/checks/restored-e2e-artifacts.json). Final report status includes only CXR0 files.

## 3. Tier 2 changes

None. All changes are confined to `apps/web/tools/`, new e2e spec/fixture files, and `reports/redesign/`. No `apps/web/src/`, existing tests, config, art, auth, game rules, dependencies, `.github/` or Supabase files are edited. `gen:deno` regenerated maps identically; its drift check passes.

## 4. Diff against origin/main

Recorded from the complete staged changes relative to origin/main (the same diff committed below):

```text
$ git diff --stat origin/main...HEAD
 apps/web/e2e/fixtures/redesign-shell.html          |  72 +++
 apps/web/e2e/ui/redesign-shell.spec.ts             |  71 +++
 apps/web/tools/compare.test.mjs                    |  38 ++
 apps/web/tools/effects-test.mjs                    |  37 +-
 apps/web/tools/layout-findings.d.mts               |   7 +
 apps/web/tools/layout-findings.mjs                 |  58 +++
 apps/web/tools/screen-manifest.json                |  23 +
 apps/web/tools/shell-smoke.ts                      |  35 ++
 apps/web/tools/ui-audit.mjs                        | 202 ++++----
 reports/redesign/CXR0.md                           | 235 +++++++++
 reports/redesign/CXR0/audit/bag-1280x720.png       | Bin 0 -> 61423 bytes
 reports/redesign/CXR0/audit/bag-1600x900.png       | Bin 0 -> 75407 bytes
 reports/redesign/CXR0/audit/findings.json          | 354 +++++++++++++
 .../redesign/CXR0/audit/forge-craft-1280x720.png   | Bin 0 -> 67677 bytes
 .../redesign/CXR0/audit/forge-craft-1600x900.png   | Bin 0 -> 86429 bytes
 reports/redesign/CXR0/audit/help-1280x720.png      | Bin 0 -> 109789 bytes
 reports/redesign/CXR0/audit/help-1600x900.png      | Bin 0 -> 145162 bytes
 reports/redesign/CXR0/audit/hero-1280x720.png      | Bin 0 -> 67562 bytes
 reports/redesign/CXR0/audit/hero-1600x900.png      | Bin 0 -> 82080 bytes
 reports/redesign/CXR0/audit/home-1280x720.png      | Bin 0 -> 67544 bytes
 reports/redesign/CXR0/audit/home-1600x900.png      | Bin 0 -> 82032 bytes
 reports/redesign/CXR0/audit/map-1280x720.png       | Bin 0 -> 59202 bytes
 reports/redesign/CXR0/audit/map-1600x900.png       | Bin 0 -> 73378 bytes
 reports/redesign/CXR0/audit/market-1280x720.png    | Bin 0 -> 46348 bytes
 reports/redesign/CXR0/audit/market-1600x900.png    | Bin 0 -> 59169 bytes
 reports/redesign/CXR0/checks/build.log             |  36 ++
 reports/redesign/CXR0/checks/classic-build.log     |  24 +
 reports/redesign/CXR0/checks/compare-browser.json  |   6 +
 reports/redesign/CXR0/checks/compare-test.log      |  10 +
 reports/redesign/CXR0/checks/compare.log           |   1 +
 reports/redesign/CXR0/checks/e2e.log               | 557 +++++++++++++++++++++
 reports/redesign/CXR0/checks/effects.log           |  11 +
 reports/redesign/CXR0/checks/gen-deno-final.log    |   5 +
 reports/redesign/CXR0/checks/install.log           |  13 +
 reports/redesign/CXR0/checks/links.json            |   1 +
 reports/redesign/CXR0/checks/lint-final.log        |  17 +
 reports/redesign/CXR0/checks/pnpm-version.log      |   1 +
 reports/redesign/CXR0/checks/report-links.json     |   6 +
 .../CXR0/checks/restored-e2e-artifacts.json        |  24 +
 .../redesign/CXR0/checks/shell-smoke-results.json  |  68 +++
 reports/redesign/CXR0/checks/shell-smoke.log       |  50 ++
 reports/redesign/CXR0/checks/test-baseline.log     |  64 +++
 reports/redesign/CXR0/checks/test-rerun.log        |  50 ++
 reports/redesign/CXR0/checks/test.log              |  69 +++
 reports/redesign/CXR0/checks/typecheck-final.log   |  17 +
 reports/redesign/CXR0/checks/ui-audit.log          |  19 +
 reports/redesign/CXR0/comparison-preview.png       | Bin 0 -> 157119 bytes
 reports/redesign/CXR0/comparison.html              |  43 ++
 .../redesign/CXR0/effects/animation-inventory.json |  12 +
 reports/redesign/CXR0/effects/combat-end.png       | Bin 0 -> 65517 bytes
 reports/redesign/CXR0/effects/summary.json         |  56 +++
 reports/redesign/compare.mjs                       |  56 +++
 52 files changed, 2250 insertions(+), 98 deletions(-)

$ git diff --name-only origin/main...HEAD
apps/web/e2e/fixtures/redesign-shell.html
apps/web/e2e/ui/redesign-shell.spec.ts
apps/web/tools/compare.test.mjs
apps/web/tools/effects-test.mjs
apps/web/tools/layout-findings.d.mts
apps/web/tools/layout-findings.mjs
apps/web/tools/screen-manifest.json
apps/web/tools/shell-smoke.ts
apps/web/tools/ui-audit.mjs
reports/redesign/CXR0.md
reports/redesign/CXR0/audit/bag-1280x720.png
reports/redesign/CXR0/audit/bag-1600x900.png
reports/redesign/CXR0/audit/findings.json
reports/redesign/CXR0/audit/forge-craft-1280x720.png
reports/redesign/CXR0/audit/forge-craft-1600x900.png
reports/redesign/CXR0/audit/help-1280x720.png
reports/redesign/CXR0/audit/help-1600x900.png
reports/redesign/CXR0/audit/hero-1280x720.png
reports/redesign/CXR0/audit/hero-1600x900.png
reports/redesign/CXR0/audit/home-1280x720.png
reports/redesign/CXR0/audit/home-1600x900.png
reports/redesign/CXR0/audit/map-1280x720.png
reports/redesign/CXR0/audit/map-1600x900.png
reports/redesign/CXR0/audit/market-1280x720.png
reports/redesign/CXR0/audit/market-1600x900.png
reports/redesign/CXR0/checks/build.log
reports/redesign/CXR0/checks/classic-build.log
reports/redesign/CXR0/checks/compare-browser.json
reports/redesign/CXR0/checks/compare-test.log
reports/redesign/CXR0/checks/compare.log
reports/redesign/CXR0/checks/e2e.log
reports/redesign/CXR0/checks/effects.log
reports/redesign/CXR0/checks/gen-deno-final.log
reports/redesign/CXR0/checks/install.log
reports/redesign/CXR0/checks/links.json
reports/redesign/CXR0/checks/lint-final.log
reports/redesign/CXR0/checks/pnpm-version.log
reports/redesign/CXR0/checks/report-links.json
reports/redesign/CXR0/checks/restored-e2e-artifacts.json
reports/redesign/CXR0/checks/shell-smoke-results.json
reports/redesign/CXR0/checks/shell-smoke.log
reports/redesign/CXR0/checks/test-baseline.log
reports/redesign/CXR0/checks/test-rerun.log
reports/redesign/CXR0/checks/test.log
reports/redesign/CXR0/checks/typecheck-final.log
reports/redesign/CXR0/checks/ui-audit.log
reports/redesign/CXR0/comparison-preview.png
reports/redesign/CXR0/comparison.html
reports/redesign/CXR0/effects/animation-inventory.json
reports/redesign/CXR0/effects/combat-end.png
reports/redesign/CXR0/effects/summary.json
reports/redesign/compare.mjs
```

## 5. Checks and real output

Executed on Node **v24.22.2**, pnpm **10.28.0**, Playwright **1.64.1**, installed Chromium 1248. Version command: `corepack enable && corepack prepare pnpm@10.28.0 --activate && pnpm --version` → `10.28.0`.

| Command | Result / real output | Log |
| --- | --- | --- |
| `CI=true pnpm install --frozen-lockfile` | PASS — `Lockfile is up to date, resolution step is skipped`; `Already up to date`; `Done in 758ms using pnpm v10.28.0`. Optional native build-script warning only; no approval or dependency/workspace/lockfile change. | [install](CXR0/checks/install.log) |
| `pnpm gen:deno && git diff --exit-code -- supabase/functions` | PASS — `wrote 18 Edge Function import maps`; diff empty, exit 0. | [gen/drift](CXR0/checks/gen-deno-final.log) |
| `pnpm typecheck` | PASS — all six package checks report `Done`. | [typecheck](CXR0/checks/typecheck-final.log) |
| `pnpm lint` | PASS — all six package checks report `Done`. | [lint](CXR0/checks/lint-final.log) |
| `pnpm test` (full rerun) | PASS — chain 7; auth 24; Supabase 517; game-rules 366 passed / 2 expected fail / 11 pre-existing skipped; api-contract 16; web **107 files, 1274 tests passed**. No tests changed or new skips outside the expressly requested contract gate. | [unit rerun](CXR0/checks/test-rerun.log) |
| `pnpm build` | PASS — every workspace build `Done`; web Vite build succeeds. | [build](CXR0/checks/build.log) |
| `VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build` | PASS — TypeScript and Vite production build succeed. | [classic build](CXR0/checks/classic-build.log) |
| `pnpm test:e2e e2e/ui/redesign-shell.spec.ts --reporter=list,json` | PASS — `2 skipped`, `4 passed (17.1s)`; both skip annotations explicitly name the absent rail. | [smoke](CXR0/checks/shell-smoke.log) |
| `pnpm test:e2e --workers=2 --reporter=list` | PASS — **`2 skipped`, `250 passed (2.4m)`**, including classic, v2 server, gameplay and layout projects. Only the two new contract gates skip. Isolated ports 4273–4276, demo environment, screenshots off. | [full e2e](CXR0/checks/e2e.log) |
| `SCREENSHOTS=1 node tools/ui-audit.mjs ../../reports/redesign/CXR0/audit bossReadyStrong` | PASS — `18 screens audited; 0 with findings`; final rerun also used `--strict` and exited 0. | [audit](CXR0/checks/ui-audit.log) |
| `SCREENSHOTS=1 node tools/effects-test.mjs ../../reports/redesign/CXR0/effects` | PASS — **`9 checks, 0 FAIL`**; combat 60.0 fps, 7 impact cues; halted 0 impacts / 29 pixel changes; reduced motion 0 transform animations. | [effects stdout](CXR0/checks/effects.log), [JSON](CXR0/effects/summary.json), [PNG](CXR0/effects/combat-end.png) |
| `node reports/redesign/compare.mjs reports/ui-audit reports/redesign/CXR0/audit reports/redesign/CXR0/comparison.html` | PASS — `"names":29,"matched":5`. | [generator](CXR0/checks/compare.log) |
| `node --test apps/web/tools/compare.test.mjs` | PASS — `tests 2`, `pass 2`, `fail 0`; covers recursive matching, missing sides, escaping/encoding, symlinks, empty/missing inputs. | [tests](CXR0/checks/compare-test.log) |
| Playwright load of generated comparison HTML | PASS — `images: 34`, `brokenImages: 0`, `pageErrors: 0`, `horizontalOverflow: false`. | [browser result](CXR0/checks/compare-browser.json) |
| `node scripts/check-links.mjs --json` before/after | Baseline FAIL unchanged — **1 → 1** broken link, zero added (docs/security-test-matrix.md, line 15). | [comparison](CXR0/checks/links.json) |
| `node --check` on both audit tools and compare generator; `git diff --check` | PASS — no output, exit 0. | Executed locally |

Full effects videos were recorded, but retained outside the patch at `/tmp/cxr0-effects-videos` to avoid adding 11 MB to the draft. The committed motion summary, animation inventory and PNG are the review evidence. No frame sequence was written.

## 6. NOT verified

- The actual AGR0 shell is not present at this base: live contract checks are deliberately skipped, and the independent local stub establishes harness behavior only.
- Signed-in audit mode was retained but not exercised; all mission-specific audit captures use browser-local demo data. Existing full e2e includes a loopback-only PGlite suite. No live database, wallet, SIWE signing, deployment, chain write or transaction is part of this verification.
- Design-source screen order/content cannot be confirmed against the unavailable redesign documents/artifact. The manifest is a living draft.
- Optional mobile audit, extra frame export, and complete text/pixel occlusion analysis were not exercised. No new mobile work was performed; pre-existing tests still run their existing viewports.

## 7. Human decisions / suspicious observations

- Confirm the provisional nine-state manifest and required key selectors when the design source is available. Existing game art remains untouched.
- Consider the existing compact Character strip clipping and path-space guard-test bug in their owners' follow-up work; neither was changed here.
- The mission-specific instruction requests a draft PR, while the generic shared text says no PR. Follow the explicit CXR0 draft-PR instruction; never merge. Use `[skip ci]` in commits to honor the no-Actions-run constraint without editing workflows. Local checks provide verification.

## 8. Branch, commits and reproduction

Branch: `ai/codex-redesign-cxr0`. Clean worktree: `/Users/bao/.codex/worktrees/redesign-cxr0/taskbar-hero`. Base: `origin/main` at `d9299af90c653b0eae876b5fc67cf633d874a8cb` (#227, including the earlier Boss panel and audit fixes). Audit tools already exist on main; PR #220 fallback was **not used**. Author checked: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.

Commit: see the implementation hash recorded after local verification below. Draft PR will be opened against main after push, with all checks performed locally.

From the repo root:

```sh
corepack enable && corepack prepare pnpm@10.28.0 --activate
pnpm --version # 10.28.0
CI=true pnpm install --frozen-lockfile
pnpm gen:deno && git diff --exit-code -- supabase/functions
pnpm typecheck
pnpm lint
pnpm test
pnpm build
VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build
node --test apps/web/tools/compare.test.mjs
node reports/redesign/compare.mjs reports/ui-audit reports/redesign/CXR0/audit reports/redesign/CXR0/comparison.html
cd apps/web
E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 E2E_PORT_SERVER=4275 E2E_PORT_API=4276 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' SCREENSHOTS=0 pnpm test:e2e --workers=2 --reporter=list
SCREENSHOTS=1 node tools/ui-audit.mjs ../../reports/redesign/CXR0/audit bossReadyStrong
SCREENSHOTS=1 node tools/effects-test.mjs ../../reports/redesign/CXR0/effects
```

Only owned servers on free ports were started; unrelated active test servers were left intact. No workflow invocation, merge, deploy, dependency change or live write was performed.
