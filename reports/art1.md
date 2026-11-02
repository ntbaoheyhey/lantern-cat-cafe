STATUS: IN-PROGRESS

ART1 P/B implementation and targeted evidence are ready for coordinator review. This is an unmerged builder report, not a score or a full mission gate claim. Branch ai/codex-art1; base 1fb25edf4c54ada0d161e3c1dd16a4c4550aafba. No push, merge, deploy, live write, agent spawn, new dependency or production asset change.

## Delivered scope

- P: inspected all 71 tracked art/public/rig/support/reference files in the inventory, current content registries, historical git evidence, the UI brief/plan and rune design/plan. Rendered all 10 redesign screens and 12 rune-demo screens at 1280x720 and 1600x900: 44 views. The [inspection data](scorecard/art1/references/inspection.json) and eight contact sheets record the reference views. The builder visually reviewed all eight sheets plus the existing social PNG. External resources were blocked, so fonts use system fallbacks. This is reference inspection, not an app UI-match audit.
- B: dependency-free Python tools for nearest-centre pixel snapping, 48-colour palette locking, binary alpha, trim/pad, stable sprite sheets with reconstructable JSON atlases, lossless PNG optimization and explicit validation. Writers refuse to overwrite existing files. Original fixture pixels are temporary; existing art is never a test output.
- Docs: [STYLE](../docs/art/STYLE.md), [INVENTORY](../docs/art/INVENTORY.md), [MANIFEST](../docs/art/MANIFEST.md), canonical [PROVENANCE](../docs/art/PROVENANCE.md), machine JSON inventories and [format/tool contracts](../tools/art/README.md). The lowercase [provenance.md](../docs/art/PROVENANCE.md) link is compatibility spelling; there is no case-colliding sibling.
- Manifest: 434 explicit slots, 248 existing mappings and 186 placeholders. Covers all 163 proposal IDs through direct rows or six explicit pet aliases; 12 pet reservations each have portrait/locked/idle slots; 12 skill icons + 12 effects; 18 passive icons + 3 capstone frames; 24 rune tiers + 6 twin overlays + 2 sockets; eight proposal materials and all seven current materials; all 155 gear entries; seven classes; 25 monsters/bosses; six missing recipe icons; four Relics; five chapter thumbnails; 20 map states + five decor slots; UI frames and other proposal slots. Existing code/SVG mappings retain their native sizes.
- Provenance: per-path first/latest git hashes and dates; full checked-in method paths where available. Unknown historical prompts, seeds, tools and model versions remain unknown. Prior project-original licence claims are attributed, not independently certified. New fixtures have an original-method entry. Reference capture files have their own evidence rows.

## Decisions and source findings

[Decision](../docs/decisions/art-pipeline.md), indexed in [design decisions](../docs/design/decisions.md): lock cafe-night-v1 to 48 colours drawn from current art/theme, preserve historical palettes, use Python 3.9+ standard library, and reserve stable art IDs for CXP1 binding. Every hex, role, native size, lighting/outline rule and rationale is in STYLE.md. No production gameplay or backend behavior changes; no flag is added.

Current registries establish Kitchen as chapter 2 and Basement as chapter 4; older art-direction prose reverses them. Historical black/white outlines and other palette colours remain unchanged. The old demo has only six pets and includes a franchise-like display name; no demo pet display names were adopted. The twelve cafe-NN art reservations are not gameplay IDs: ART2 must bind them one-to-one to CXP1 before wiring. Historical licence certification in licenses-v2.md is stronger than git can independently establish; this card records the evidence gap without editing that out-of-zone document.

Reference review: the redesign uses broad plum panels, restrained warm active borders, a scene/card split, and state/rarity shapes. The rune demo needs distinct small silhouettes, rank/tier pips, large effect canvases and a list/detail icon vocabulary. Existing icon matrices and monster pilots are more detailed than the demo glyphs and remain the source for reuse. No reference pixels, placeholder cats, borrowed display names or demo numbers were turned into new production art.

## Targeted results (not self-scoring)

| Acceptance piece | Observation | Evidence |
|---|---|---|
| Style and locked palette | 48 distinct source-backed colours; style contains every hex; native sizing documented | targeted-tests.log, test_locked_palette_comes_from_existing_sources_and_matches_style |
| Snap / palette / trim / pad / sheets / optimize | 36 targeted tests passed, including 25 pipeline tests; two complete CLI runs have identical output bytes | [raw tests](scorecard/art1/logs/targeted-tests.log) |
| Determinism repeat | 25 pipeline tests x 10 runs, each exit 0 | pipeline-repeat-01.log through pipeline-repeat-10.log |
| Test strength | Eight genuine code faults, eight assertion failures; every mutant exit 1, harness exit 0; scratch copies removed | [mutations](scorecard/art1/logs/mutations/summary.json), per-mutant raw logs |
| Inventory/provenance/manifest | Generated catalogs match source; selectors, dimensions, IDs, paths and git commits checked; all 51 classic/pilot/hero sprite records independently match evaluated TypeScript exports | [catalog drift](scorecard/art1/logs/catalog-drift.log), catalog unit tests |
| Existing art preserved | All 71 inventoried file hashes identical before/after; runtime/protected-file diff empty | [hashes](scorecard/art1/logs/source-preservation.json), [scope](scorecard/art1/logs/syntax-and-scope.json) |
| Original designs inspected | 44 reference views; zero page errors; eight PNG contact sheets below 200,000 bytes | [reference run](scorecard/art1/logs/reference-review.log) |
| Link regression | Base/current each have one pre-existing broken path; no new failure | [comparison](scorecard/art1/logs/links-comparison.json) |
| Syntax / whitespace / secrets | Python AST and Node syntax checks exit 0; diff whitespace exit 0; scoped credential scan found no matches | syntax-and-scope.json, whitespace.log, secret-scan.log |

## Command exits and real tails

All verification raw output is under [logs](scorecard/art1/logs/commands.json); individual logs include the executed command and exit. The runner's command list covers its checks; extra install, browser, syntax/scope and initial-failure logs are separate.

| Command / run | Exit | Real result tail |
|---|---|---|
| CI=true pnpm install --frozen-lockfile | 0 | Done in 5.6s using pnpm v10.28.0; 505 existing locked packages reused; 0 downloads; optional native build scripts ignored |
| Python / browser version probes | 0 / 0 | Python 3.9.6; zlib 1.2.12; Node v24.22.2; Playwright 1.64.1; Chromium 156.0.8078.4 |
| python3 -B tools/art/catalog.py | 0 | generated 5 art catalog files; application assets read only |
| python3 -B -m unittest discover -s tools/art -v | 0 | Ran 36 tests; OK |
| python3 -B tools/art/catalog.py --check | 0 | checked 5 art catalog files; application assets read only |
| Ten pipeline-only unittest runs | 0 each | Ran 25 tests; OK, each run |
| python3 -B tools/art/mutation_check.py --logs reports/scorecard/art1/logs/mutations | 0 | 8/8 mutations produced assertion failures; scratch copies removed |
| Each mutant's selected unchanged test | 1 each, expected | FAILED (failures=1), AssertionError; no import-error/crash kills |
| node tools/art/source_audit.mjs | 0 | 51 existing sprites checked (classic, pilot and hero); no source writes |
| node tools/art/reference_review.mjs | 0 | Inspected 44 reference views. Eight contact sheets; no app runtime gate executed. |
| git diff --exit-code 1fb25ed -- baseline markdown paths | 0 | empty diff |
| node scripts/check-links.mjs --json with base docs / default current docs | 1 / 1 | brokenCount: 1 in each; missing docs/proposals/tbh-index-research from the existing rune README |
| python3 -B tools/art/verify.py | 0 | source hashes unchanged: True (71 files); links baseline=1, current=1, new=0 |
| node --check tools/art/reference_review.mjs; Python AST parse | 0 / 0 | no syntax findings |
| git diff --exit-code -- protected runtime/dependency paths | 0 | empty diff |
| git diff --check | 0 | empty output |
| Scoped secret-pattern scan | 0 | Findings: 0; values never printed |
| Initial catalog test runs | 1 | five assertions, then one assertion failed; fixed as below; earlier raw failure retained |
| Initial reference capture run | 1 | reference contact sheet exceeds 200 KB; fixed by splitting sheets, limit unchanged |

Exploratory shell reads exited 0 except two early inventory probes (exit 2 for not-yet-created tools/docs directories; exit 1 for the not-yet-created decisions index) and the recorded failing development tests. The first 23-test pipeline run exited 0; two later 34-test runs exited 0 before the extra malformed-palette test was added. A later 35-test run also exited 0; the current suite has 36 after adding nonuniform animation coverage. No preliminary result is presented as the current gate. The CUA browser attempt returned "Local browser use is disabled in Work settings" (no process exit code); the existing local Playwright dependency provided the completed reference inspection.

## Development rounds and root causes

1. Catalog assertions exposed an implementation size error: historical Relic SVGs have 16x16 viewBoxes, displayed at 128x128. Corrected the manifest to native 16x16 with explicit 8x display note. The test now checks native dimensions against the actual SVG.
2. A new registry-coverage test assumed literal monster IDs. The registry derives IDs from a roster; a first broadened regex still matched only a comment. The corrected test derives all 25 IDs from roster names using the published mapper and keeps the exact 25-entry assertion. No existing test was weakened.
3. A 12-view reference contact sheet exceeded the 200 KB evidence budget. Split it into six-view sheets; every screen/size remains covered and the size assertion is unchanged. Earlier oversized outputs were removed from this card's report folder.
4. The first link baseline included generated link-check.md while the checker default excludes it, yielding a misleading 33-versus-1 comparison. Corrected the baseline file set to match the checker exactly; current evidence is 1-versus-1 with no new failure. No link claim relies on the discarded comparison.
5. An independent TypeScript export audit exposed a uniform-frame assumption: four bosses have 23 frames and four chapter-5 monsters have 13, while other pilots have 14. Replaced the fixed count with literal animation-array inspection, recorded all 51 classic/pilot/hero records, added explicit coverage and independently compared every record against evaluated exports.
6. Self-review tightened PNG optimization to choose the stripped source as a candidate (never larger), validated palette file shapes, and bounded pad allocations. The current tests and all eight mutants were rerun afterward.

## Integrity and scope

All additions are Tier 1 under tools/art, docs/art and this card's report/evidence, except two authorized Tier 2 documentation files: docs/decisions/art-pipeline.md records the required palette/tooling decision; docs/design/decisions.md indexes it. No package/lockfile, app asset, runtime, backend, contract, auth, .github or environment file changed.

No existing tests were edited or deleted. No skip/only/fixme/todo, timeout increase, retry, matcher loosening, golden adjustment, type suppression or src console output was introduced. tools/art/reference_review.mjs and tools/art/source_audit.mjs each have two deliberate console.log progress/result lines for raw logs; they are not app source. mutation_check.py contains intentional failing substitutions in scratch copies, including a disabled CRC branch; those substitutions are never applied to production code. New test corrections above address incorrect test assumptions without reducing cardinalities or changing an existing behavior expectation.

The staged changed-file list and diff statistics are recorded in the handoff logs. All PNG evidence is reference capture, not newly generated production content, and remains under the 200 KB limit. No unrelated screenshot or report was modified.

## Remaining verification lines (coordinator-owned)

NOT VERIFIED in this builder card: full pnpm gen:deno + drift, typecheck, lint, workspace test, build, classic build, app e2e at both sizes, full e2e repeats, bundle check, verify-pr, UI-audit/effects, keyboard/contrast gate, independent graders, latest-origin/main gate, PR/push/merge, post-merge main checks and live smoke. These were explicitly kept with the coordinator; no full e2e was run here. The local reference renderer is not a substitute for any app gate. Historical missing prompts/seeds/model versions cannot be reconstructed from git and are honestly recorded, not a user question.

ART2/ART3 remain responsible for producing and wiring placeholder art, binding the twelve CXP1 pet IDs, and checking production raster exports, palettes, contact sheets, reduced-motion playback and UI appearance. ART1 supplies concrete paths and contracts; it does not claim those future assets exist.

Branch: ai/codex-art1 | Merge commit: none | PR: none | Report: reports/art1.md | Status: implementation and targeted evidence ready, unmerged.
