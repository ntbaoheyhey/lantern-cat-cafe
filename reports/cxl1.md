STATUS: IN-PROGRESS

# CXL1 — Compendium adapter builder delivery

Implementation and targeted verification are complete in the assigned worktree on `ai/codex-cxl1`. This report does not claim a full gate, independent grade, PR, merge or deployment. The coordinator owns those steps and BASE0 PR #246 owns shared baseline repairs. No agents were spawned; no remote write, UI/gameplay change, dependency change, secret/environment change or live action was made.

Base/precondition: fetched origin/main was `1fb25edf4c54ada0d161e3c1dd16a4c4550aafba`; HEAD matched it. The codex directory was absent on main, so CXL1 was implemented rather than skipped. [Precondition command/output](scorecard/CXL1/logs/precondition.log). Author is ntbaoheyhey, email 108352255+ntbaoheyhey@users.noreply.github.com; pnpm 10.28.0, Node 24.22.2. [Install log](scorecard/CXL1/logs/install.log) records frozen-lockfile installation, exit 0; lock/workspace files unchanged.

## Delivered pieces and acceptance evidence

The [P/B cards](scorecard/CXL1/cards.md) preceded implementation. [API/source/odds documentation](../docs/compendium-adapter.md) describes IDs, probability semantics and missing facts.

| Piece / acceptance line | Observed result | Evidence |
| --- | --- | --- |
| Typed read-only entries from current registries, original names | PASS: 209 entries across all eight kinds; no demo content | [entries tests](../packages/game-rules/src/v2/codex/entries.test.ts), [current package test run](scorecard/CXL1/logs/rules-tests-current.log) |
| IDs unique and full registry coverage | PASS: complete ID set, uniqueness assertion and count snapshot | Same tests/run |
| Every link resolves and carries correct kind | PASS: all links bidirectional, no duplicate/self links; source and unlock references checked | [entry tests](../packages/game-rules/src/v2/codex/entries.test.ts), [provenance tests](../packages/game-rules/src/v2/codex/generator.test.mjs) |
| Source facts and missing values are honest | PASS: class/monster multiplier distinction, real boss helper, source paths/symbols, existing Relic metadata, null contextual odds/cost/name/icon gaps | Same tests; API document |
| Exact chest percentages/reciprocals from weights | PASS: all ten chests; zero probabilities explicit; conditional and per-chest odds separated | [odds tests](../packages/game-rules/src/v2/codex/odds.test.ts) |
| Per-source normalization ±1e-9 | PASS: five conditional rarities sum to 100%; per-chest outcomes plus no-drop sum to 100%; overlapping at-least-one rows not falsely normalized | Same odds tests |
| Independent analytic comparison | PASS: every group/rarity agrees with existing loot engine; chapter-5 total 92, not an assumed 100 | Same odds tests |
| Offline generator | PASS: no network, unchanged data equals parsed JSON, stdout/file bytes identical, external cwd works, bad arguments/output fail | [generator tests](../packages/game-rules/src/v2/codex/generator.test.mjs), [CLI log](scorecard/CXL1/logs/generator-cli-current.log) |
| Large JSON not committed | PASS: generated 996,700 bytes, 209 entries, ten chests, then removed | Same CLI log; staged audit |
| Five or more genuine mutants restored | PASS: nine behavior mutants killed in scratch copies; unchanged control passes; source hashes unchanged and scratch removed | [mutation summary](scorecard/CXL1/logs/mutations-current.log), individual logs below |
| No UI/gameplay behavior introduced | PASS by diff inspection: additive lazy read-only adapter, one barrel export, generator and generated maps only | [scope/integrity audit](scorecard/CXL1/logs/audit-current.log) |

Snapshot counts: class 7, monster 20, boss 5, gear 155, material 7, recipe 6, relic 4, chapter 5. Elites are included in monsters; no bosses are duplicated. Recipes have no registry display name, so IDs remain visible. Four existing Relic names are drift-tested against original metadata, not invented. Detailed per-item gear chances require player context and remain null; the adapter publishes exact rarity odds separately. Existing first-party content only.

## Checks actually run

Each log includes its command, raw output and exit. The wrappers and reproduction scripts are under [scorecard/CXL1](scorecard/CXL1/).

| Command / check | Result and actual output tail | Raw log |
| --- | --- | --- |
| pnpm frozen install | Exit 0, Done using pnpm v10.28.0 | [install](scorecard/CXL1/logs/install.log) |
| game-rules typecheck | Exit 0, tsc --noEmit | [typecheck](scorecard/CXL1/logs/typecheck.log) |
| game-rules lint | Exit 0, tsc --noEmit | [lint](scorecard/CXL1/logs/lint.log) |
| game-rules build | Exit 0, tsc --noEmit | [build](scorecard/CXL1/logs/build.log) |
| Complete game-rules unit suite | Exit 0: 27 files passed, 3 skipped; 385 tests passed, 2 expected fail, 11 skipped | [rules-tests-current](scorecard/CXL1/logs/rules-tests-current.log) |
| New adapter/generator tests | Exit 0: 3 files / 19 tests passed | [targeted-3](scorecard/CXL1/logs/targeted-3.log) |
| Ten repetitions of new pure tests | Exit 0, 10/10 repetitions; each 19 tests passed | [repeats](scorecard/CXL1/logs/repeats.log), repeat-01 through repeat-10 logs |
| Reference demo walkthrough | Exit 0: all 12 screens opened at 1280×720 and 1600×900; Codex search/detail/linked entries and odds columns exercised | [demo-flow](scorecard/CXL1/logs/demo-flow.log) |
| pnpm gen:deno | Exit 0, wrote 18 Edge Function import maps; 16 maps changed by five codex entries each | [generation](scorecard/CXL1/logs/gen-deno.log) |
| Deno import guard | FAIL: exit 1, 80 existing unresolved forge/bag ./index edges | [guard](scorecard/CXL1/logs/deno-imports.log) |
| Compare guard with untouched main archive | Exit 0 comparison: exactly the same 80 failures, zero added | [baseline comparison](scorecard/CXL1/logs/baseline-deno-2.log) |
| Deno regeneration drift | PASS: exit 0, no unstaged map drift after regeneration | [drift](scorecard/CXL1/logs/deno-drift.log) |
| check-links after | Same one existing failure, no new broken link; touched docs/report pass | [after](scorecard/CXL1/logs/links-after.log), [touched](scorecard/CXL1/logs/links-touched-current.log) |
| Scope / integrity / secret audit | PASS: exit 0, allowed files only; existing assertions preserved; no detected secrets or oversized JSON | [audit](scorecard/CXL1/logs/audit-current.log) |
| Staged diff statistics | Evidence only, no gate claim | [diff-stat](scorecard/CXL1/logs/diff-stat.log) |
| check-links baseline | FAIL: exit 1, one existing missing research-directory reference | [before](scorecard/CXL1/logs/links-before.log) |

Existing skips and expected failures in the package suite were preserved, not added by this item. They are not represented as executed passing cases. No application e2e ran: the static demo walkthrough is reference inspection, not an app gate. Backend variables were empty in generator subprocess tests; no backend or preview ports were needed.

## Mutation evidence

Tests were unchanged in disposable copies inside the assigned worktree. Each red run exited 1 with the named behavioral assertion failing; the unmodified scratch control exited 0. This is evidence only, not a self-assigned score.

| Mutant | Change | Test that rejects it | Raw log |
| --- | --- | --- | --- |
| M1 | Replace original gear name with ID | Original names | [M1](scorecard/CXL1/logs/mutation-M1-name.log) |
| M2 | Remove starter relationship | Starter/class/chapter mapping | [M2](scorecard/CXL1/logs/mutation-M2-starter-link.log) |
| M3 | Force gear stat multiplier to 1 | Gear stats and slot unlocks | [M3](scorecard/CXL1/logs/mutation-M3-gear-stats.log) |
| M4 | Divide weights by 100 instead of actual total | Weight normalization | [M4](scorecard/CXL1/logs/mutation-M4-weight-total.log) |
| M5 | Omit chest chance gate | Independently calculated chest examples | [M5](scorecard/CXL1/logs/mutation-M5-chance-gate.log) |
| M6 | Return p instead of 1/p | Reciprocal assertions | [M6](scorecard/CXL1/logs/mutation-M6-reciprocal.log) |
| M7 | Remove known material chest probability | Acquisition/source values | [M7](scorecard/CXL1/logs/mutation-M7-material-source.log) |
| M8 | Remove deep freeze | Read-only snapshot protection | [M8](scorecard/CXL1/logs/mutation-M8-readonly.log) |
| M9 | Sum independent rarity rolls without overlap correction | Analytic aggregate odds | [M9](scorecard/CXL1/logs/mutation-M9-aggregate-odds.log) |

## Corrections and integrity

- Build iteration 1: two **new** tests incorrectly demanded a guessed floating-point literal or a different operation order. [Raw failed run](scorecard/CXL1/logs/targeted-1.log). The per-chest equality now uses the published `c × (w/W)` evaluation order and remains exact `toBe`. The new Moon Pearl assertion changed from a guessed repeated `30.000000000000004` to explicit source count plus 100/30 within 12 decimal places, tighter than the mandated 1e-9 tolerance. No pre-existing assertion, snapshot or matcher was changed. [Subsequent run](scorecard/CXL1/logs/targeted-2.log) passed all 19 tests.
- Baseline comparison script iteration 1 used a Python tar extraction option absent on this machine. [Failed log](scorecard/CXL1/logs/baseline-deno.log). It now validates archive paths/member types explicitly before extraction. [Corrected comparison](scorecard/CXL1/logs/baseline-deno-2.log) completed and removed its scratch archive.
- Review added direct chest references to bosses/chapters and exact gear chest-eligibility assertions. The current full rules run and mutation rerun cover those additions.
- Evidence tooling review: the first secret scan matched its own provider-prefix detection string, not a credential; it now requires a token payload. Mutation labels with empty replacements initially had trailing spaces; labels now print `<empty>`, and fresh raw mutant runs replace those labels. Earlier failed audit output is retained; whitespace-check failures are preserved as JSON-escaped raw logs so their trailing-space diagnostics do not themselves introduce trailing whitespace.
- No test was skipped, deleted, quarantined, retried or assigned a larger timeout. The sole count snapshot is newly added; no existing golden changed. Detailed staged integrity/scope/secret findings are in the audit log. No self-score or independent grade is asserted.

## Scope and source decisions

Tier 1: new codex files, exactly one v2/index.ts export, scripts/gen-codex-json.mjs, docs/compendium-adapter.md, this report and CXL1 evidence only. Tier 2: the 16 generated non-auth Deno maps need five codex module mappings each because the shared package barrel is reachable from Edge Functions. No handler, migration, auth map, contract, lockfile, gameplay registry, art, UI or existing test was edited. Every changed file is enumerated by the staged audit and diff-stat evidence.

Read-only representation choices: keep existing IDs; namespace Relics by pinned token ID; use existing recipe IDs where names are missing; distinguish conditional/per-chest/at-least-one probability; zero-probability reciprocal is null for JSON safety; source material probability context is stated explicitly. These introduce no economy/content number and require no backend flag. The API document explains how consumers should interpret each choice.

References read: the full supplied stricter mission; rune demo README/index, design.md, plan.md and proposal README; current v2 content/config/forge/idle/state/combat/view/lootcheck implementations, common loot engine and pinned Relic metadata. Static demo flow inspected at both desktop sizes; demo numbers/names were not adopted.

## Remaining acceptance gaps for the coordinator

NOT VERIFIED in this builder delivery: latest-main integration after BASE0; complete fresh-worktree root typecheck/lint/test/build; classic and v2 application builds/e2e at both desktop sizes; application flake gates; bundle comparison; verify-pr; independent grading by two graders; PR/push/merge and post-merge/live checks. These are deliberately coordinator-owned under the assignment, not blocked on the user. No full gate is claimed.

Known baseline findings: Deno guard fails on main's existing forge/bag index imports; check-links has one existing missing research-directory reference. Neither was repaired out of scope. Relic metadata remains a small drift-tested projection until its original source offers an exported display-name registry. Per-item loot odds still require player context; this adapter does not invent them.

Branch: ai/codex-cxl1; merge commit: none; PR: none; report: reports/cxl1.md; status: builder implementation delivered, coordinator gates pending.
