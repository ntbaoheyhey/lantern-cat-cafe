STATUS: DONE

## 1. Mission pieces and acceptance

### Piece 1 — browser infrastructure: PASS

- Ports are validated shared values: E2E_PORT_CLASSIC defaults to 4173, E2E_PORT_V2 to 4174. Project URLs and both server commands use them. Both servers build fresh demo-mode assets with explicit VITE_GAME_V2=0/1, empty Supabase settings, strict ports, reuseExistingServer:false and a 120-second startup timeout. No assertion timeout was raised.
- Chose to fold ui/** into stage-layout because both exercise the same v2 stage-first UI. Keeping classic, stage-layout and v2-loop avoids a redundant fourth project and preserves distinct gameplay counts. Every UI baseURL override, including U3_V2_BASE_URL, was removed.
- All existing specs import the shared auto fixture. It rejects mismatched directory/project or baseURL before test actions and checks the actual first normal page's v2 shell marker (absence for classic). Later Mini-mode navigation is permitted. The arena developer preview has project/origin validation but intentionally no StageLayout marker.
- Port-specific output directories under dist, dist-v2 and test-results prevent concurrent suites from overwriting each other's builds/artifacts. Two complete suites actually ran concurrently at 4273/4274 and 4473/4474 and both passed. Startup cleanup instructions, targeted PID/cwd checks and the broad dedicated-machine fallback are documented in the config comment and docs/test-stability.md; previous unit-suite findings in that document are preserved.
- PASS: back-to-back complete suites on 4473/4474, with no manual cleanup between them. PASS: complete suite with exactly E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274. Every final run: classic 26, stage-layout 91, v2-loop 15; 132 passed, no skipped browser tests.
- PASS: created a throwaway e2e/ui/s1-throwaway.spec.ts using the raw Playwright import, no baseURL line and no shared fixture; its relative goto loaded the v2 marker and project name stage-layout. 1 passed, exit 0. Then deliberately assigned the classic URL using the shared fixture: it failed immediately with “Use the project baseURL; do not override it in a spec”, exit 1 as expected. Removed the throwaway spec in a finally block. Sources/logs are retained as .txt/.log evidence, not runnable specs.
- PASS: invalid-port configuration is rejected before server startup. Real output: E2E_PORT_V2 must be an integer port from 1 to 65535; received invalid.

### Piece 2 — UI integration: PASS

Base: fetched origin/main 672bdeb; clean managed worktree, branch ai/codex-s1-infra. The original checkout's unrelated forge changes were left untouched.

| Card | Report first line | Ancestor of origin/main at gate | Outcome | Real merge commit |
| --- | --- | --- | --- | --- |
| U1 codex/u1-tokens | STATUS: DONE | no, exit 1 | merged first | 367b14c |
| U3 ai/codex-ui-u3-layout | STATUS: BLOCKED | no, exit 1 | working code merged second under explicit S1 authorization; obsolete assertions fixed | e948712 |
| U7 ai/codex-ui-u7-stage-fx | STATUS: DONE | no, exit 1 | merged third | 5cf4c4b |

No branches were skipped. U2/U4/U5/U8 were not re-merged. All three requested merges used git merge --no-ff and had **no textual conflicts**. Semantic U1/U3 conflict: U1 styles every .pixel-btn--secondary, while U3 placed that button class on a noninteractive wallet wrapper. Kept U1's shared button rules and U3's actual wallet-button appearance, removed the wrapper class, and updated U3's descendant selector. This removed 2–6px mobile overflow and restored the intended compact header. No other mission's product zone or StageCanvas.tsx was edited.

PASS: git merge-base --is-ancestor origin/<each merged branch> HEAD returns 0 for all three. Exact requested report/ancestor commands and output are in branch-audit.log.

PASS: full unit suite, all three browser projects, root build, explicit classic build and explicit v2 build. PASS: grep -c "stage-v2-enabled" apps/web/dist-v2/assets/*.js reports index-D5hiX65G.js:1; every classic apps/web/dist/assets/*.js count is 0. Marker existed on main, so verified rather than waived.

### Piece 3 — link debt: PASS

Baseline: node scripts/check-links.mjs --json found 58 broken items across 44 Markdown files / 589 links and paths; full list retained in links-before.json.

- Historical dry-run image names are retained as plain capture labels and explicitly marked **not committed**, both in timing-table column titles and the evidence index. No screenshot was fabricated or substituted.
- Corrected README's og image to its actual public path and demo-script's GameCanvas reference to apps/web/src/GameCanvas.tsx.
- Reworded local/generated .env, broadcast/cache/out paths as uncommitted machine-local artifacts; replaced wildcard file claims with existing directories in database, submission and schema docs.
- cutover-v2 now clearly identifies the founder migration as a file on another branch, not a committed main file. Its historical git-show command remains. No migration was read from disk, changed or applied.
- verify-pr links the real script and separates the invocation from its path.
- The checker exempts angle-bracket template segments only in backticked examples (including deploy, extending, licenses-v2 and report templates). Actual Markdown/HTML links still resolve; missing concrete backticked paths still fail. The four temporary-file checks in link-checker-cases.log verify both positive and negative behavior. No broad directory, historical-report or image exemption was added.

Final command: `node scripts/check-links.mjs` — **exit 0**:

```text
Checked 44 markdown files and 542 links/paths.
✓ All links, image paths, and backticked repo paths exist on disk.
```

### Piece 4 — evidence and clean normal runs: PASS

SCREENSHOTS=1 targeted e2e/ui/s1-infra.spec.ts: 6 passed, exit 0. Six lossless PNG contact sheets show all 18 combinations: Main, Forge, Boss at 1600x900, 1280x720, 390x844, 320x568 light and 1280x720, 390x844 dark. Each panel is an unmodified native viewport capture, with a separate 28px label row. This reconciles the requested 18 views with the 16-PNG cap. PNGs are 65,185–133,399 bytes, below 200,000. Mobile and desktop sheets were visually inspected.

Normal full runs after evidence write no report screenshots. git status --short reports/ showed only `?? reports/s1-infra/` before staging. The initial run exposed U8's unconditional report writes; those tracked images were restored, and its pixel/PNG-size assertions now operate on the same in-memory PNG while disk writes require SCREENSHOTS=1. U4's existing screenshot test now runs all of its visibility checks normally instead of skipping, with only file writes gated. Classic a11y/demo-path and the arena spec also gate file writes.

Acceptance mapping: 1 PASS (all required checks, counts below); 2 PASS (two consecutive full runs plus requested overrides); 3 PASS (throwaway removed); 4 PASS (link checker exit 0); 5 PASS (classic build and 26 classic browser cases); 6 PASS (three real merges, all ancestor checks exit 0); 7 PASS (v2 marker present, classic absent); 8 PASS (branch/conflict/Tier 2 details here).

## 2. Problems found and fixed

- FIXED: ui/** belonged to classic and depended on literal 4174 overrides; project discovery now owns its v2 routing, including brand-new specs.
- FIXED: fixed ports and shared build/output paths caused collisions or stale-build risks; shared environment ports, fresh strict previews and port-isolated paths permit concurrent runs.
- FIXED: U3 desktop tests encoded 60vh/320px geometry while the new container uses clamp(200px,40vh,360px); replaced only the obsolete geometry assertions with exact new dimensions and bottom alignment.
- FIXED: U1's secondary-button padding styled U3's wrapper, causing 29 initial failures; corrected the wrapper/descendant class use without changing overflow checks.
- FIXED: normal U8 runs rewrote reports and U4 skipped a validation case; PNG measurement remains active in memory and normal runs now execute all browser tests without writing report images.
- FIXED: 58 apparent/broken links mixed genuine stale paths, uncommitted history/local artifacts and templates; corrected each category without inventing evidence.
- FOUND, preserved: existing game-rules unit skips/expected failures; none added here.
- ENVIRONMENT: Corepack is absent. Used the required exact-version npx fallback throughout. Install warned about ignored bufferutil/keccak/utf-8-validate build scripts; no approval or lock/workspace changes.
- ENVIRONMENT: a later default-port startup correctly rejected port 4174 occupied by PID 62388 in a different checkout (/Users/bao/taskbar-hero/apps/web). Did not kill that unrelated preview; final suites used isolated port pairs. One accidental pre-fix rerun after a cwd-relative edit failed was interrupted and is not claimed as verification. Initial failures and the collision log are retained.

## 3. Tier 2 changes and old → new assertions

- README.md: correct the actual location of the generated og image; needed for zero broken links.
- docs/cutover-v2.md: clarify a branch-only migration reference instead of claiming it is committed locally; needed for zero broken links. No DB/schema file changed.
- Top-level classic e2e specs: import the shared guard; a11y/demo-path file captures also require SCREENSHOTS=1. Their behavioral assertions are unchanged.
- apps/web/e2e/layout/stage-layout.spec.ts (expressly authorized Tier 2): desktop `height >= 320` and `abs(height - 0.6*viewportHeight) <= 2` → `abs(height - clamp(200,0.4*viewportHeight,360)) <= 1` plus exact `width = min(viewportWidth,1440)`. At the tested 1280x800 viewport this means old 480px → new 320px.
- Same spec's canvas/container assertion: `abs(canvas.height-stage.height) <= 48` → exact `canvas.height = 96 * stageZoom(width,stageHeight(width,height))` and `abs(canvas.bottom-stage.bottom) <= 1`. At 1280x800 the renderer remains 480px while the container is 320px, deliberately cropping sky; integer zoom, width bound, single canvas, phone aspect ratio and all other assertions remain.
- Imported U3 includes StageLayout.test.tsx and tabIcons.tsx; imported U1/U7 include their unit tests. These are the requested branches' working code, not independent edits to other owners' zones.

## 4. Diff against origin/main

<!-- S1_DIFF -->

## 5. Checks actually run (real output summaries)

All pnpm commands used `npx -y pnpm@10.28.0`. Corepack attempt: command not found, exit 127. Version check: **10.28.0**. Node: v26.11.1.

| Command | Actual result |
| --- | --- |
| CI=true npx -y pnpm@10.28.0 install --frozen-lockfile | exit 0; Scope all 7 workspace projects; Packages +505; Done in 5.8s using pnpm v10.28.0 |
| npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions | exit 0; wrote 18 Edge Function import maps; no drift |
| npx -y pnpm@10.28.0 typecheck | exit 0; all six package scripts Done; rerun after final code changes |
| npx -y pnpm@10.28.0 lint | exit 0; all six package scripts Done; rerun after final code changes |
| npx -y pnpm@10.28.0 test | exit 0; chain 7, auth 24, Supabase 385, game-rules 330, API contract 16, web 1108 passed; web 87 test files passed |
| npx -y pnpm@10.28.0 build | exit 0; all package builds Done |
| VITE_GAME_V2=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 --filter @taskbar-hero/web build | exit 0; classic build |
| VITE_GAME_V2=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 --filter @taskbar-hero/web build --outDir dist-v2 | exit 0; v2 build |
| SCREENSHOTS=1 E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 npx -y pnpm@10.28.0 --dir apps/web test:e2e e2e/ui/s1-infra.spec.ts --project=stage-layout | exit 0; 6 passed (14.2s) |
| E2E_PORT_CLASSIC=4473 E2E_PORT_V2=4474 npx -y pnpm@10.28.0 test:e2e (cwd apps/web), twice chained with && | exit 0; 132 passed (45.3s), then 132 passed (36.9s); no manual cleanup |
| E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 npx -y pnpm@10.28.0 test:e2e (cwd apps/web), concurrent with first 4473/4474 run | exit 0; 132 passed (46.6s) |
| node scripts/check-links.mjs | exit 0; 44 files, 542 links/paths; 0 broken |
| git diff --check | exit 0 |

Final browser breakdown for each complete run: **classic 26 + stage-layout 91 + v2-loop 15 = 132 passed**, no skips. Earlier post-fix run before adding S1's six new cases: 126 passed (35.2s). Initial integrated run before the wrapper fix: 29 failed, 96 passed, 1 existing screenshot-only skip; retained honestly in e2e-initial.log. Negative guard and invalid-port tests intentionally exit 1 and are separate from the green suites.

Existing game-rules output: Test Files 20 passed | 3 skipped (23); Tests 330 passed | 2 expected fail | 11 skipped (343). No new skips, expected failures, assertion weakening or arbitrary timeout increases.

Complete raw logs, screenshot sizes, per-project counts, baseline link JSON, marker counts, throwaway sources and branch audit are under reports/s1-infra/.

## 6. NOT verified

No live Supabase, live database writes, deployed site, wallet/SIWE transactions, Fuji RPC flow, contracts or deployment were exercised; verification uses Chromium and local demo saves. A final corrected full run using the *default* pair 4173/4174 was not repeated while another checkout owned 4174; the full final code passed both independent alternative pairs, including the exact required 4273/4274 pair. Existing skipped game-rules tests were not forced to run. No broad orphan cleanup was performed against other users' previews.

## 7. Human decisions and suspicious findings outside the zone

No decision is needed to review this branch. The unrelated preview on 4174 may need cleanup by its owner. Existing game-rules unit skips/expected failures remain visible. PNG contact sheets carry viewport-sized panels instead of eighteen separate files to honor the evidence file limit. No PR, merge to main, Actions run, deploy, Site change, remote asset, dependency edit, forbidden product-zone edit or hard-stop file change was made.

## 8. Branch, commits and reproduction

Branch: ai/codex-s1-infra. Base: origin/main 672bdeb. Merge commits: 367b14c (U1), e948712 (U3), 5cf4c4b (U7). Implementation/delivery commit audit follows below after recording the diff. All commits in origin/main..HEAD use ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>.

Reproduce from a clean checkout using the exact pnpm fallback, install/build checks above, then run the evidence command and normal full-suite command with a free port pair. To prove concurrency, start the two final full-suite commands in separate terminals. The screenshots are generated by apps/web/e2e/ui/s1-infra.spec.ts with existing midGame demo fixtures, a fixed clock and reduced motion. The throwaway .spec.ts was removed; its source is available as a non-runnable .txt record. Report status after normal suites is recorded in reports-status.log. Only S1 evidence/report files were left changed.
