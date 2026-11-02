STATUS: IN-PROGRESS

## Coordinator repair snapshot — 2026-11-02

The documented stable-snapshot contract failed when the local preview counter was
already saturated: another valid delta published an equal object, notified listeners
and rewrote storage. A new regression first failed1/17cases at the identity assertion.
The one-line no-op guard preserves the cap transition and ignores only a count that
did not change. The focused store/isolation control then passed18/18. Preview numbers,
storage keys/migration, claim observation, equipped selection and gameplay are unchanged.

This section records implementation-time evidence. Current exact-head verification,
retained failures and pending gates are recorded on the ledger in
reports/cards/CXP1-VERIFY-R2/REPORT.md and linked from PR240. The builder record below
is historical; no source/main/full-gate or independent-score claim is inferred from it.

# CXP1 — scoped builder continuation

2026-11-01. Reused detached checkout `7a66b14f4e1bb9816235ee3195a2f15745180031`
and PR [#240](https://github.com/ntbaoheyhey/taskbar-hero/pull/240). Builder work
and targeted evidence are ready for coordinator inspection. No full gate,
self-score, push, merge, deploy or live check is claimed. BASE0 #246 owns shared
repairs; this continuation does not change its files or the older local branch.
The earlier report below is explicitly historical, including its whole-suite
PASS claims. The current source and commands are the evidence for this handoff.

## P/B cards and changes

[Cards](scorecard/cxp1/cards.md): P1 audited every sections 10/11 CXP1 acceptance
line; P2 reviewed the rune demo; B1 documented the public store and added its
React hook; B2 ran targeted checks plus ten scratch mutants; B3 reviewed scope,
assertion retention and secrets and prepared this detached commit.

The registry, original rule/isolation tests, observer logic and two-line mount
are unchanged from the assigned head. Added `usePetsState(store?)` using
`useSyncExternalStore`, explicit type re-exports and top-of-file API docs.
Added six store tests and strengthened all existing persistence cases without
removing assertions. The browser suite now compares credited kills with exact
saved-game progress, verifies reload after recovery/migration, rejects legacy
resurrection after corrupt current data, and checks console/page errors in
every case. No existing timeout, retry, snapshot or golden was changed.

[Preview-number decision](../docs/decisions/pets-preview.md) is SIGNED by Codex
under full user authority, 2026-11-01, and indexed in
[design decisions](../docs/design/decisions.md). This approves DEMO_PREVIEW
numbers only; no live balance or server behavior is activated.

## Sections 10/11 acceptance audit

| Acceptance line | Current result | Evidence |
| --- | --- | --- |
| Twelve ORIGINAL typed definitions: id, name, unlock target/count, bonusKey, perLevel, flavour | PASS targeted | `pets/index.ts` unchanged; 17 rule tests; registry table below |
| Pure petProgress(killCounts, defs): unlocked, level, nextAt, pct | PASS targeted | Rule tests check all unlock boundaries, custom definitions, invalid counts, cap/interval percentage |
| Unlock exactly at threshold | PASS targeted | All twelve per-ID boundary cases; unlock-round-up mutant fails assertions |
| Level steps | PASS targeted | Zero, threshold-minus-one, exact step, nextAt, percentage and cap assertions retained |
| Equip at most two; no duplicates; locked/unknown rejected | PASS targeted | Rule/store exact result assertions; third-slot and duplicate mutants fail |
| Versioned localStorage and corrupt parse recovery | PASS targeted | Parser/store tests; two desktop recovery cases with reload; corrupt-grants-selection mutant fails |
| Migration from v0 | PASS targeted | Current/legacy v0 formats, valid selections, legacy retention/current precedence; migration-disabled mutant fails |
| Unique registry IDs | PASS targeted | Exactly twelve unique IDs/names and preview labels; original assertions unchanged |
| Read only already tracked kill data / existing event | PASS targeted | Single adapter in `apps/web/src/pets/state.ts`; actual GameLoopV2 tests and exact browser saved-progress assertion |
| Refresh and concurrency deduplication | PASS targeted | Same-reference and cloned replay, concurrent claim requests, refresh overtaking claim, only post-refresh delta, old response rejection, retired disposal; refresh/cleanup mutants fail |
| Nothing computing power consumes the preview registry | PASS targeted | Existing runtime grep isolation test; actual scratch power-consumer mutant detected in combat/stats.ts |
| No power, drop, forge or server effects before CXG1 | PASS targeted source boundary | Registry is absent from v2 barrel; `preview.*` labels; runtime isolation guard; no new API calls/server code |
| Stable types + store hooks documented at top of state.ts | PASS targeted | Public API section below; hook update/identity/unsubscribe test and subscription mutant |
| Every preview number marked DEMO_PREVIEW and decision recorded | PASS audit | Registry module-level marker plus field comments, signed decision and README |
| Reference demo reviewed at both desktop sizes | PASS mechanics review | Six current PNGs, all opened; [review/differences](scorecard/cxp1/ui-diff.md) |
| Report lists twelve pets and single count-read file | PASS document audit | Registry and source sections below |
| DONE: root pnpm test green; complete verify/merge gates | NOT VERIFIED here | Explicitly reserved to coordinator; prior full-suite evidence is historical |

## Stable API for CXP2

Import from `apps/web/src/pets/state.ts`:

- Types: `PetsState`, `PetDef`, `PetKillCounts`, `PetProgress`, `PetEquipResult`.
- `getPetsStore(): PetsStore`; `usePetsState(store?: PetsStore): PetsState`.
- Store: `subscribe(listener): unsubscribe`, `getSnapshot(): PetsState`,
  `equip(id): PetEquipResult`, `unequip(id): void`. Immutable snapshots retain
  identity on rejected selection changes. React receives updates and unsubscribes.
- `new PetsStore(storage | null)` for isolated consumers/tests; storage needs
  getItem/setItem. Default storage is localStorage, with memory fallback.
- `parsePetsState(raw)`, `PETS_STORAGE_KEY`, `PETS_LEGACY_STORAGE_KEY` for recovery.
- Integration-only: `bindPetsToLoop(loop, store?)` and
  `store.recordClaimedKills(delta)`. UI consumers never infer/grant kills.
- Read `PET_DEFS`, `petProgress`, and the pure equip helper directly from
  `@taskbar-hero/game-rules/src/v2/meta/pets`, not the shared v2 barrel.

## Twelve stable original pets

All values below are DEMO_PREVIEW, with target `claimed-idle-kills`.

| ID | Name | Unlock |
| --- | --- | ---: |
| pet.hemwhisk | Hemwhisk | 7 |
| pet.sillskip | Sillskip | 13 |
| pet.thimblepurr | Thimblepurr | 19 |
| pet.kettlepaw | Kettlepaw | 31 |
| pet.crumbcurl | Crumbcurl | 43 |
| pet.bristletoe | Bristletoe | 61 |
| pet.puddleplume | Puddleplume | 79 |
| pet.latchlynx | Latchlynx | 103 |
| pet.pocketmew | Pocketmew | 137 |
| pet.hushspool | Hushspool | 173 |
| pet.eavetuft | Eavetuft | 227 |
| pet.dawnknead | Dawnknead | 283 |

DEMO_PREVIEW: each level requires another unlock-sized step, capped at three;
per-level labels are [0.7, 1.3, 2.1] with no units/game effect. Equip limit is two.
No art, names or numbers were imported from the six-pet demo.

## Exact kill-count source and runtime gaps

The only pet adapter reading client progress is `apps/web/src/pets/state.ts`, line 121
(`bindPetsToLoop`). Existing `storeV2.ts:115` mounts it. It observes GameLoopV2's
state adoption and synchronous `claimed` event (`loopV2.ts:207–213`). It calls
existing `claimedKills` in `apps/web/src/game/stage/progress.ts`, line 4:

`max(0, (after.round - before.round) * after.killsPerRound + after.kills - before.kills)`.

Missing previous state or changed chapter returns zero. The adapter keeps one
pending delta and consumes it only on that adoption's acknowledged event; other
deltas expire at the microtask boundary. WeakMap binding and idempotent cleanup
prevent duplicate observers. Loop state/action epochs and claim serialization
remain unchanged. The tests use the actual loop, including overlapping refresh.

Runtime limitations: counts are local to this browser/device, shared across
account/demo switches, with no cross-tab merge, cloud sync, species/boss totals
or historical backfill. A chapter-changing claim is omitted; rewardless progress
is not credited because the loop emits `claimed` only for positive gains.
Simultaneous tabs may overwrite local preview data. No treats, adoption action,
active bonus, UI tab, pet art or server persistence exists in CXP1. CXP2 owns
presentation and CXG1 owns authoritative runtime integration. Storage data is
untrusted preview data and must never become a reward authority.

## Current targeted commands

Every command/exit and raw output is under [logs](scorecard/cxp1/logs/).

| Check | Exit and observed result | Evidence |
| --- | --- | --- |
| Node / pnpm / Playwright | 0; v24.22.2 / 10.28.0 / 1.64.1 | [versions](scorecard/cxp1/logs/versions.log) |
| CI=true pnpm install --frozen-lockfile | 0; no lock/workspace edits | [install](scorecard/cxp1/logs/install.log) |
| Focused rules | 0; 17 passed | [rules](scorecard/cxp1/logs/rules-targeted.log) |
| Focused store/isolation | 0; 17 passed (16 store + 1 isolation) | [store](scorecard/cxp1/logs/store-targeted.log) |
| Rules and web typecheck | 0 each | [rules](scorecard/cxp1/logs/rules-typecheck.log), [web](scorecard/cxp1/logs/web-typecheck.log) |
| Focused persistence at both sizes | 0; 8 passed; VITE_GAME_V2=1, empty public backend config, ports 4340–4343 | [browser](scorecard/cxp1/logs/persistence-e2e.log) |
| Same spec --repeat-each=10 | 0; 80 passed; no retries/failures | [repeat](scorecard/cxp1/logs/persistence-repeat.log) |
| Classic/v2 builds | 0 within focused Playwright webServer setup; both local builds produced, not full root build gate | Browser logs above |
| Built classic/v2 secret scans | 0 each; 25 / 31 text files | [classic](scorecard/cxp1/logs/bundle-classic.log), [v2](scorecard/cxp1/logs/bundle-v2.log) |
| pnpm gen:deno + generated diff | 0 each; no new map changes | [generator](scorecard/cxp1/logs/gen-deno.log), [drift](scorecard/cxp1/logs/deno-drift.log) |
| check-deno-imports | 1; 80 inherited unresolved ./index imports in five forge/bag modules across 16 functions | [shared failure](scorecard/cxp1/logs/deno-imports.log); BASE0 owns repair |
| check-links current and cached origin/main 1fb25ed | 1 each; same one pre-existing missing proposal path | [current](scorecard/cxp1/logs/links-corrected.log), [cached baseline](scorecard/cxp1/logs/links-baseline-complete-mirror.log) |
| check-links touched docs | 0; six checked links, none broken | [touched](scorecard/cxp1/logs/links-touched.log) |
| Demo review | 0 after harness correction; both sizes, no console/page errors | [review](scorecard/cxp1/logs/demo-review-corrected.log) |
| Integrity/scope/secrets | 0; original assertion lines retained; no secret-pattern findings | [audit](scorecard/cxp1/logs/integrity-scope-secrets.log) |
| git diff --check | 0 | [diff](scorecard/cxp1/logs/diff-check.log) |

`check-bundle.mjs` reports secret scan counts, not bundle byte budgets; a current
main byte comparison remains a coordinator gate. The cached-main link comparison
is not a claim that origin/main was freshly fetched or that BASE0 is already
merged. Port preflight lsof exit 1 means none of the four assigned ports listened.

## Behavioral mutations

[Reproducible runner](scorecard/cxp1/tools/mutate.py) creates disposable scratch
copies inside this worktree and checks source hashes afterwards. Original
sources were never mutated. Scratch baseline and restored copies both passed
17 rules plus 17 store/isolation tests. Each of ten mutants exited 1 with an
assertion failure; none was counted on a compile/setup failure. These are test
observations, not a builder score.

| Mutation | Assertion evidence |
| --- | --- |
| Round unlock count up | [boundary failures](scorecard/cxp1/logs/mutation-unlock-round-up.log) |
| Permit third equipped pet | [limit failure](scorecard/cxp1/logs/mutation-equip-third.log) |
| Allow duplicate equipped ID | [duplicate failure](scorecard/cxp1/logs/mutation-equip-duplicate.log) |
| Disable v0 migration | [migration failures](scorecard/cxp1/logs/mutation-migration-disabled.log) |
| Corrupt parse grants an equipped pet | [empty recovery failure](scorecard/cxp1/logs/mutation-corrupt-grants-selection.log) |
| Drop persistence on publish | [reload equality failure](scorecard/cxp1/logs/mutation-persistence-dropped.log) |
| Retain refresh delta past microtask | [false credit failure](scorecard/cxp1/logs/mutation-refresh-delta-retained.log) |
| Repeat retired cleanup | [binding identity failure](scorecard/cxp1/logs/mutation-retired-cleanup-repeats.log) |
| Hook never subscribes | [reactive snapshot failure](scorecard/cxp1/logs/mutation-hook-never-subscribes.log) |
| Import/use pet preview value in real power calculation | [runtime isolation failure](scorecard/cxp1/logs/mutation-preview-changes-power.log) |

[Machine-readable changes/results](scorecard/cxp1/logs/mutation-summary.json),
[aggregate run](scorecard/cxp1/logs/mutations-with-isolation.log).

## Scope, integrity and corrections

Every changed path vs cached origin/main is classified in
[scope.tsv](scorecard/cxp1/scope.tsv). Tier 2: decision/index (explicit authority),
focused e2e (built persistence), inherited storeV2 two-line mount (read-only event
binding), and sixteen inherited generated game import-map aliases (one preview
directory alias each). No auth map/source, .github, credentials, environment,
dependency, contract, migration, CSS or asset changes in this continuation.

Diff statistics: [complete CXP1 branch](scorecard/cxp1/logs/diff-stat-branch.log)
and [this continuation](scorecard/cxp1/logs/diff-stat-continuation.log). Raw
command/exit inventory: [log index](scorecard/cxp1/logs/README.md).

Self-review read the full source/test diff and original adapter/loop/helper.
All 31 original store assertion lines, 24 rule assertion lines, 11 browser
assertion lines and the isolation assertion remain. No skips, only/fixme/todo,
new timeouts/retries, suppression comments, any casts or source debug logs.

Current correction log (no grading round implied):

1. Historical report treated unsigned numbers and broad earlier checks as current;
   current decision is signed for preview and old claims are labelled historical.
2. An added backticked helper reference included `::claimedKills`, creating one
   broken path. Split file and symbol; touched docs now have zero broken links.
   The optional report check also caught two backticked file:line references;
   those now separate file and line as well.
3. Demo harness assumed one hunt would unlock adoption; actual thresholds needed
   two. It now continues through visible hunt controls without changing demo code.
4. Baseline mirror first used a Python tar API unavailable on this machine, then
   omitted referenced script/.github paths. The corrected read-only mirror yields
   the same one missing proposal path as current. Both failed attempts remain in
   logs and are not used as baseline findings.
5. Deno import guard is red on inherited forge/bag imports. No repair duplicated;
   generated maps stayed unchanged. This is an acceptance gap for BASE0/coordinator.

## Remaining acceptance gaps / handoff

Coordinator must inspect this detached HEAD, integrate BASE0/latest main, push
HEAD to existing remote ai/codex-cxp1 / PR #240, and run complete fresh-worktree
root typecheck/lint/test/build/classic build, complete e2e, all required audits,
verify-pr, current-main bundle/link comparisons and independent grading before
any merge. No full app e2e was run in this assignment. Post-merge/live checks are
not run or claimed. There is no user permission or credential dependency for
this preview. CXP2 and CXG1 boundaries above remain intentional runtime gaps.

Delivery: detached continuation for ai/codex-cxp1; PR #240; reports/cxp1.md;
status PARTIAL (targeted builder evidence only). Exact new commit is supplied in
the handoff message after committing. No local branch ref is moved.

---

<details>
<summary>Historical report from assigned head 7a66b14 — not current verification</summary>

All claims and PASS labels below describe an earlier attempt. They are preserved
for audit and are not asserted as rerun evidence by this builder continuation.
Current results and remaining acceptance gaps are listed above.

STATUS: PARTIAL

# CXP1 — local companion preview (living draft)

1 November 2026 (Asia/Ho_Chi_Minh). Continues draft PR #240 from main `1fb25ed`. Twelve original pets, progress and equip-two selection remain preview-only. No pet value affects power, rewards, drops, forge or server state. All 2,310 unit tests and six focused desktop browser cases pass. The strict overall status remains PARTIAL: the complete browser suite has the two excluded mobile HUD failures.

## Changes and acceptance

| Requirement | Result | Evidence |
| --- | --- | --- |
| Twelve typed original pets and unique IDs | PASS full suite | Registry and boundary tests under packages/game-rules/src/v2/meta/pets |
| Exact unlock, level steps, percentage, cap and equip-two/no duplicates | PASS full suite | Existing pure-rule tests retained unchanged |
| Corrupt storage and v0 migration | PASS focused | Ten store tests plus six browser cases across both desktop sizes |
| Read only client-tracked kills | PASS focused | Single adapter: apps/web/src/pets/state.ts; existing claimedKills helper; actual acknowledged claim events |
| No pet imports into power/combat/drop/forge/server runtime | PASS | Existing lint-style source guard passes unchanged |
| Desktop persistence | PASS | Six Playwright cases: claims/reload, corrupt storage and migration at 1280×720 and 1600×900 |
| Full shared suite | PARTIAL | Core checks pass; 256 e2e pass and two existing mobile HUD cases fail. The initial generated-map drift was corrected and rechecked clean. |

The registry uses a direct preview module import, not the shared v2 barrel. Bonus keys are preview.* labels. Every unlock threshold, level step, per-level display value and equip limit is marked DEMO_PREVIEW in code/docs. No demo design table or art is copied. The existing mount consists of one import and one observer call in storeV2.ts.

## Registry

| Id | Original name | DEMO_PREVIEW unlock count |
| --- | --- | ---: |
| pet.hemwhisk | Hemwhisk | 7 |
| pet.sillskip | Sillskip | 13 |
| pet.thimblepurr | Thimblepurr | 19 |
| pet.kettlepaw | Kettlepaw | 31 |
| pet.crumbcurl | Crumbcurl | 43 |
| pet.bristletoe | Bristletoe | 61 |
| pet.puddleplume | Puddleplume | 79 |
| pet.latchlynx | Latchlynx | 103 |
| pet.pocketmew | Pocketmew | 137 |
| pet.hushspool | Hushspool | 173 |
| pet.eavetuft | Eavetuft | 227 |
| pet.dawnknead | Dawnknead | 283 |

Per-level values are DEMO_PREVIEW display labels only. They have no units or gameplay effect. Counts target only claimed-idle-kills; there is no per-species/lifetime counter in the client, so no species or historical progress is inferred.

## Problems found and fixed

- Reproduced false credit after a same-round refresh: the old observer held a load delta until a later claimed event reused that snapshot, awarding four preview kills with no new progress. An overlapping refresh/claim had the same defect. The delta now expires at the microtask boundary unless the same synchronous adoption emits an acknowledged claim. Existing valid claims still count exactly once. [Before](cxp1/checks/observer-before.log), [after](cxp1/checks/observer-after.log).
- Reproduced retired cleanup invalidating a replacement binding: an old dispose call deleted the replacement's WeakMap guard. Cleanup is now idempotent, preserving the replacement and preventing duplicate observers.
- Fixed missing generated metadata: gen:deno indexes every public game-rules module, even without a barrel export. The initial run exposed one missing alias in each of sixteen game-function maps. Included exactly the generator's additions; the repeat generator/drift check is clean. No auth map or function source changed, and no Edge Function imports or consumes the preview registry.
- Browser harness setup initially imported browser API dependencies into Node (JSON import attributes), then a bundler-only directory import. The test now reads the storage-key constants and imports the pure registry through a relative file path. No product API or assertion was weakened.

## Tier 2 changes

- apps/web/src/game/v2/storeV2.ts: existing two-line read-only mount is necessary to observe the already-tracked client loop.
- apps/web/e2e/v2/pets-preview.spec.ts: verifies the built application's mounting, local persistence and migration at both requested desktop sizes.
- Sixteen generated supabase/functions game deno.json files: one directory alias each, required by the mandated generator; metadata only, no server behavior or deployment. Auth manifests are untouched.

## Browser and visual evidence

Opened the proposal demo's Pets screen in Chromium at 1280×720 and 1600×900 and visually inspected both. Used its structural progress/equip-two intent only. No Pets screen is introduced here; AGP1 owns that later UI.

[Focused browser output](cxp1/checks/desktop-e2e.log): 6 passed (14.2s), one worker, no retries. The browser uses the real existing 30-second local claim timer with Playwright's controlled clock; no test-only gameplay endpoint was added. Reload retains the credited local aggregate. Corrupt preview storage recovers; legacy data migrates with two selections and retains the old recovery key.

Current Home captures (existing art, unchanged UI):

- [1280×720 PNG](cxp1/home-1280x720.png), 90,717 bytes.
- [1600×900 PNG](cxp1/home-1600x900.png), 99,427 bytes.

Both were opened for visual QA. Earlier JPEG evidence remains preserved. No UI layout/token changes are made by this logic item, so there is no new Pets layout to compare against the redesign mockup. The visible 1280px HUD next-action text is clipped; this existing cosmetic finding belongs in CXR1/CXR2.

## NOT verified and boundaries

- Signed balance and gameplay effects are intentionally absent. No economy, odds, config.ts, auth, contract, migration, deployment, live DB or chain write was changed or performed.
- No Pets screen, art, cross-tab synchronization, cloud sync or per-species/history backfill is claimed. Local preview progress is browser/device-local and shared across demo/account switches.
- The untouched main branch's known narrow HUD failures are outside this desktop mission. Any actual full-suite failures will be listed, not relabelled PASS.
- No existing test is removed, skipped, quarantined, weakened or given retries. Existing upstream expected failures/skips remain unchanged.

## Delivery

Branch: ai/codex-cxp1; draft PR: https://github.com/ntbaoheyhey/taskbar-hero/pull/240. Existing implementation commit: 6b06574. Worktree: /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero (detached continuation preserves the older worktree's unfinished regression).

Use Node 20+ and pnpm 10.28.0; run the shared suite from the root and the focused browser test from apps/web. SCREENSHOTS=1 opts into evidence. All commits use the requested author and end with [skip ci]. No merge or workflow invocation.

## Verification findings

All 28 pet tests pass (17 registry, 10 store, one isolation). Full browser result: 256 passed, two known narrow HUD height failures (138/214px versus 88px). The six new cases pass in that full run too. [Full e2e output](cxp1/checks/round1-e2e.log). Main and branch retain exactly one broken proposal link; no new debt.

The first full run correctly exposed unstaged generated-map additions. After including those additions, `pnpm gen:deno && git diff --exit-code -- supabase/functions` passes with no unstaged drift. The following table preserves the initial failure rather than rewriting history; the second clean committed PR checkout verifies the corrected maps with no drift.

<!-- MEGA verification evidence -->

## Executed checks

| Check | Exit | Result |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | 0 | PASS |
| `pnpm gen:deno` | 0 | PASS |
| `git diff --exit-code -- supabase/functions` | 1 | FAIL |
| `pnpm typecheck` | 0 | PASS |
| `pnpm lint` | 0 | PASS |
| `pnpm test` | 0 | PASS |
| `pnpm build` | 0 | PASS |
| `pnpm test:e2e` | 1 | FAIL |
| `pnpm --filter @taskbar-hero/web build` | 0 | PASS |
| `node scripts/check-links.mjs --json` | 1 | BASELINE DEBT — compare count below |

```text
$ pnpm install --frozen-lockfile
# exit 0; 0.5 seconds
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 445ms using pnpm v10.28.0
```

```text
$ pnpm gen:deno
# exit 0; 0.3 seconds

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

```text
$ git diff --exit-code -- supabase/functions
# exit 1; 0.0 seconds
     "../../../packages/game-rules/src/v2/idle/types": "../../../packages/game-rules/src/v2/idle/types.ts",
     "../../../packages/game-rules/src/v2/lootcheck": "../../../packages/game-rules/src/v2/lootcheck/index.ts",
+    "../../../packages/game-rules/src/v2/meta/pets": "../../../packages/game-rules/src/v2/meta/pets/index.ts",
     "../../../packages/game-rules/src/v2/sim": "../../../packages/game-rules/src/v2/sim/index.ts",
     "../../../packages/game-rules/src/v2/sim/config": "../../../packages/game-rules/src/v2/sim/config.ts",
     "../../../packages/game-rules/src/v2/sim/player": "../../../packages/game-rules/src/v2/sim/player.ts",
diff --git a/supabase/functions/v2-state/deno.json b/supabase/functions/v2-state/deno.json
index b42daac..d013b34 100644
--- a/supabase/functions/v2-state/deno.json
+++ b/supabase/functions/v2-state/deno.json
@@ -54,6 +54,7 @@
     "../../../packages/game-rules/src/v2/idle/drops": "../../../packages/game-rules/src/v2/idle/drops.ts",
     "../../../packages/game-rules/src/v2/idle/types": "../../../packages/game-rules/src/v2/idle/types.ts",
     "../../../packages/game-rules/src/v2/lootcheck": "../../../packages/game-rules/src/v2/lootcheck/index.ts",
+    "../../../packages/game-rules/src/v2/meta/pets": "../../../packages/game-rules/src/v2/meta/pets/index.ts",
     "../../../packages/game-rules/src/v2/sim": "../../../packages/game-rules/src/v2/sim/index.ts",
     "../../../packages/game-rules/src/v2/sim/config": "../../../packages/game-rules/src/v2/sim/config.ts",
     "../../../packages/game-rules/src/v2/sim/player": "../../../packages/game-rules/src/v2/sim/player.ts",
```

```text
$ pnpm typecheck
# exit 0; 10.9 seconds

> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

```text
$ pnpm lint
# exit 0; 9.0 seconds

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

```text
$ pnpm test
# exit 0; 60.9 seconds
packages/chain test:  Test Files  3 passed (3)
packages/chain test:       Tests  32 passed (32)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  31 passed (31)
supabase/tests test:       Tests  541 passed | 1 expected fail (542)
packages/game-rules test:  Test Files  25 passed | 3 skipped (28)
packages/game-rules test:       Tests  383 passed | 2 expected fail | 11 skipped (396)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  113 passed (113)
apps/web test:       Tests  1314 passed (1314)
apps/web test:    Duration  20.70s (environment 47%, tests 38%, import 10%, transform 4%)
apps/web test: Environment  jsdom was created 113 times · 81.32s total, 47% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

```text
$ pnpm build
# exit 0; 10.5 seconds
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1819 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.13 kB │ gzip:   0.77 kB
apps/web build: dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
apps/web build: dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/StageScene-DGbwNpHc.js           15.73 kB │ gzip:   5.79 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/index-D4O8tvuP.js               244.21 kB │ gzip:  68.94 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 394ms
apps/web build: Done
```

```text
$ pnpm test:e2e
# exit 1; 81.4 seconds
    Received:    214

      62 |     expect(measures.intersections).toBe(0);
      63 |     expect(measures.luminance).toBeLessThan(.2);
    > 64 |     if (size.width <= 390) expect(measures.height).toBeLessThanOrEqual(88);
         |                                                    ^
      65 |     if (size.width === 1600) expect(measures.height).toBeLessThanOrEqual(64);
      66 |   });
      67 | }
        at /Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero/apps/web/e2e/ui/u2-hud.spec.ts:64:52

    Error Context: test-results/4173-4174/ui-u2-hud-HUD-readable-at-320x568-stage-layout/error-context.md

  2 failed
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 390x844 ──────────────────────────
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 320x568 ──────────────────────────
  256 passed (1.3m)
 ELIFECYCLE  Command failed with exit code 1.
```

```text
$ pnpm --filter @taskbar-hero/web build
# exit 0; 5.6 seconds
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-cxp1/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
✓ 1819 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.13 kB │ gzip:   0.77 kB
dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/StageScene-DGbwNpHc.js           15.73 kB │ gzip:   5.79 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/index-D4O8tvuP.js               244.21 kB │ gzip:  68.94 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB

✓ built in 359ms
```

```text
$ node scripts/check-links.mjs --json
# exit 1; 0.1 seconds
Checked 67 files, 807 paths; broken count 1.
```

## Diff snapshot

Recorded from the complete worktree before the report-only commit.

```text
$ git diff --stat origin/main
 apps/web/e2e/v2/pets-preview.spec.ts              |  81 +++++
 apps/web/src/game/v2/storeV2.ts                   |   2 +
 apps/web/src/pets/isolation.test.ts               |  24 ++
 apps/web/src/pets/state.test.ts                   | 162 ++++++++++
 apps/web/src/pets/state.ts                        | 126 ++++++++
 packages/game-rules/src/v2/meta/pets/README.md    |  44 +++
 packages/game-rules/src/v2/meta/pets/index.ts     |  83 +++++
 packages/game-rules/src/v2/meta/pets/pets.test.ts |  58 ++++
 reports/cxp1.md                                   |  83 +++++
 reports/cxp1/checks/desktop-e2e.log               |  38 +++
 reports/cxp1/checks/observer-after.log            |   8 +
 reports/cxp1/checks/observer-before.log           |  72 +++++
 reports/cxp1/checks/round1-e2e.log                | 369 ++++++++++++++++++++++
 reports/cxp1/desktop-1280x720.jpg                 | Bin 0 -> 80884 bytes
 reports/cxp1/desktop-1600x900.jpg                 | Bin 0 -> 103800 bytes
 reports/cxp1/home-1280x720.png                    | Bin 0 -> 90717 bytes
 reports/cxp1/home-1600x900.png                    | Bin 0 -> 99427 bytes
 supabase/functions/boss-fight/deno.json           |   1 +
 supabase/functions/equip/deno.json                |   1 +
 supabase/functions/game-state/deno.json           |   1 +
 supabase/functions/idle-claim/deno.json           |   1 +
 supabase/functions/relic-forge/deno.json          |   1 +
 supabase/functions/relic-mint-report/deno.json    |   1 +
 supabase/functions/upgrade/deno.json              |   1 +
 supabase/functions/v2-boss-fight/deno.json        |   1 +
 supabase/functions/v2-choose-class/deno.json      |   1 +
 supabase/functions/v2-claim/deno.json             |   1 +
 supabase/functions/v2-craft/deno.json             |   1 +
 supabase/functions/v2-equip/deno.json             |   1 +
 supabase/functions/v2-lock/deno.json              |   1 +
 supabase/functions/v2-relic-forge/deno.json       |   1 +
 supabase/functions/v2-salvage/deno.json           |   1 +
 supabase/functions/v2-state/deno.json             |   1 +
 33 files changed, 1166 insertions(+)
$ git diff --name-only origin/main
apps/web/e2e/v2/pets-preview.spec.ts
apps/web/src/game/v2/storeV2.ts
apps/web/src/pets/isolation.test.ts
apps/web/src/pets/state.test.ts
apps/web/src/pets/state.ts
packages/game-rules/src/v2/meta/pets/README.md
packages/game-rules/src/v2/meta/pets/index.ts
packages/game-rules/src/v2/meta/pets/pets.test.ts
reports/cxp1.md
reports/cxp1/checks/desktop-e2e.log
reports/cxp1/checks/observer-after.log
reports/cxp1/checks/observer-before.log
reports/cxp1/checks/round1-e2e.log
reports/cxp1/desktop-1280x720.jpg
reports/cxp1/desktop-1600x900.jpg
reports/cxp1/home-1280x720.png
reports/cxp1/home-1600x900.png
supabase/functions/boss-fight/deno.json
supabase/functions/equip/deno.json
supabase/functions/game-state/deno.json
supabase/functions/idle-claim/deno.json
supabase/functions/relic-forge/deno.json
supabase/functions/relic-mint-report/deno.json
supabase/functions/upgrade/deno.json
supabase/functions/v2-boss-fight/deno.json
supabase/functions/v2-choose-class/deno.json
supabase/functions/v2-claim/deno.json
supabase/functions/v2-craft/deno.json
supabase/functions/v2-equip/deno.json
supabase/functions/v2-lock/deno.json
supabase/functions/v2-relic-forge/deno.json
supabase/functions/v2-salvage/deno.json
supabase/functions/v2-state/deno.json
```

## Independent PR verification

Continuation commit: `954604f`. `CI=true SCREENSHOTS=0 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' bash scripts/verify-pr.sh 240` ran without --comment. The clean committed checkout passes install, generated-map drift, typecheck, lint, unit tests and build. E2E again reports 256 passed and the same two excluded mobile HUD failures. [Summary and failure tail](cxp1/checks/verify-pr.log). Two full rounds are recorded; status remains PARTIAL, not a false whole-suite PASS.

The separate Deno deployment import guard still emits the same 80 unresolved edges as main; its output compares byte-for-byte equal. Generated metadata does not add an unresolved import. No art/public assets or dependency manifests differ from main. The PR remains a draft, and the wrapper removed its temporary checkout.

</details>
