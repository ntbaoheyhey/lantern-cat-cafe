STATUS: PARTIAL

# CXR1 — merged redesign coverage and findings (living draft)

1 November 2026 (Asia/Ho_Chi_Minh). Baseline `1fb25ed` has AGR0, AGR1 and AGR2. `git log origin/main --oneline --grep='AGR[34]'` returns no matches. The redesigned Forge, Market, Hero, Help and shared modal/toast work is therefore deferred to the required end-of-queue recheck. Existing legacy screens remain exercised by the shell smoke; that is not acceptance of missing redesign work.

## Acceptance

| Test | Result | Evidence |
| --- | --- | --- |
| T1: component tests | PASS focused for merged scope | New registry/frame/HUD tests and Bag filter/selection/empty-slot tests pass. Existing Rail, Hud, ScreenFrame, Landing/Home, ClassPicker and Bag suites remain in the full suite. Redesigned AGR3/AGR4 component tests are NOT VERIFIED because that code is absent. |
| T2: desktop flow | PASS merged scope | [8 browser cases pass](CXR1/checks/desktop-e2e.log): guest Landing → Class → Home → populated Bag → equip/reload at both sizes, plus real-shell/stub/geometry smokes. No missing-shell skip remains. Forge/Market/Hero/Help redesign flows await AGR3/AGR4. |
| T3: registry and onboarding destinations | PASS | Actual registry, rendered rail, all legacy TABS, and literal destinations in onboarding/nextStep.ts resolve to their intended screens rather than silently falling back to Home. |
| T4: new text-token contrast pairs | FAIL | 29/30 pairs pass. Warning `--bad` (#ff6b6b) on `--surface-3` (#4a3a5e) is **3.6770:1**, below unchanged AA **4.5:1**. Assertion remains active; CXR2 owns the cosmetic correction. |
| T5: complete existing suite | PARTIAL | First round: e2e 252 passed / two known mobile HUD failures; typecheck/build caught a test-only unsupported RTL option, since corrected. Second round passes typecheck, lint and both builds; unit tests have 2,318 passes and the one contrast failure; e2e again has 252 passes and the two excluded mobile failures. No failure is hidden. |
| T6: bug list | PASS delivered | File/line findings and visible comparison differences below. |

## Test changes

- Activated the CXR0 real-shell smoke by replacing its pre-AGR0 conditional skip with an ordinary required-rail assertion. The independent stub and geometry regression probes are retained.
- Added a genuine stocked local guest journey using the existing fixture and APIs. It verifies three starter radios, actual progress, painted canvas, eight Bag columns, selected filter semantics, equip-best completion and persisted equipment after reload. It uses the existing #landing entry hash; no route or gameplay endpoint was added.
- Added 12 registry/frame/HUD checks and three Bag checks covering selected-item identity through sorting/removal, announced filter selection without count changes, and decorative empty slots staying out of the tab sequence.
- Extended the original eight contrast checks to 30, covering text, muted, accent, good, bad, shard and key foregrounds on all four plum surfaces. Existing thresholds are unchanged.
- Fixed two new-test harness errors: jsdom rewrites import.meta.url away from file URLs, so the static onboarding read uses the repository-relative cwd path; Testing Library's role-name string is exact by default and its options do not accept Playwright's `exact` property. Removing that unsupported option does not relax the name assertion.

No production component, rules, art, auth, dependency, workflow or server file changes are made by CXR1.

## Visual comparison and evidence

[Side-by-side comparison](CXR1/comparison.html) pairs the approved mockup with the current app for Landing, Class, Home and populated Bag at 1280×720 and 1600×900. All four reference frames and four application frames at each size were opened and visually inspected. The comparison page was also opened at both sizes: 16 images, zero broken images in each browser check.

The reference HTML was opened, all ten visual tabs were visited at both sizes, and its app frame was captured at the requested logical dimensions. A capture-only stylesheet removes the reference viewer's scale/toolbar offset; it does not edit the mockup file or its app styles. Application screenshots use the real existing artwork. Exactly **16 PNGs**, each 1280×720 or 1600×900; largest **103,318 bytes**, all below 200 KB. Eight are app evidence and eight are labelled reference captures. No asset source was created or modified.

| Screen | App at 1280×720 | App at 1600×900 |
| --- | --- | --- |
| Landing | [PNG](CXR1/screens/landing-1280x720.png) | [PNG](CXR1/screens/landing-1600x900.png) |
| Class | [PNG](CXR1/screens/class-1280x720.png) | [PNG](CXR1/screens/class-1600x900.png) |
| Home | [PNG](CXR1/screens/home-1280x720.png) | [PNG](CXR1/screens/home-1600x900.png) |
| Bag | [PNG](CXR1/screens/bag-1280x720.png) | [PNG](CXR1/screens/bag-1600x900.png) |

### Visible differences, at both sizes unless stated

| Area | Current app versus approved reference | Disposition |
| --- | --- | --- |
| Shared surface/type tokens | Current page bg is #1a1220 instead of the brief's #120b19; body base is 16px instead of 14px. Some cards/filter chips use rounded edges instead of square pixel frames. | Cosmetic findings for CXR2; preserve the existing display/body/number font families. |
| Shared HUD | App adds title, chapter/kill progress, next action and sync state, and orders level before currencies. Mockup shows currencies before XP and a sample wallet address. At 1280 the real next-action text is clipped. | Fix clipping and spacing; retain actual values, semantic labels and existing actions. A fake wallet address or renamed currency would not be implementation truth. |
| Rail | Real cat logo and existing icons replace mockup text/logo/glyphs; active color and footer badge differ in detail. | Existing real art is retained; cosmetic frame/token differences belong to CXR2. |
| Landing | 16px outer inset, constrained/more-indented hero content, strip-height room backdrop, and a single cat positioned low instead of a full scene and cats centred on the right. Network pill is rounded; footer links/type differ. | Fix layout/spacing; one real cat and the room artwork replace placeholder art. Never generate extra cats or backgrounds. |
| Landing copy | Both mockup and app incorrectly say ERC-721, while RelicNFT extends ERC1155. “Open source” targets this private repository. Wallet says “Get a browser wallet” in the tested no-extension state. | Correct false display claims in CXR2; preserve truthful wallet behavior. No contract or repository-visibility change. |
| Class | App centres a short, max-width row of cards and CTA in a large blank page; reference uses a top-left heading, tall cards filling the page and bottom-right CTA. Whole-card radios replace the mockup's Select controls. | Reflow cards/header/footer cosmetically while preserving radio semantics, keyboard order and existing confirmation behavior. |
| Class content/art | Real Warrior/Guardian/Rogue labels, passive text, stat multipliers and existing weapon/swatch art replace demo Guardian/Hunter/Mystic, star ratings and cats. | Keep real classes, numbers, text and art; do not copy demo balance or create new classes. |
| Home macro layout | App uses Hero/Goal on the left, stage/log centre and loot right. Reference has wide stage/log left with Hero/Goal/Loot stacked in one right sidebar. Main content has no intended gutter. | CSS layout and stage-size presentation correction in CXR2. |
| Home scene/cards | Fixed three-column sizing leaves large dark space around the real stage; card radius/border, event-log surface and loot presentation differ. App shows real detailed loot rows and real events, not demo icons/timestamps. | Fix sizing/frame/surface differences. Preserve actual loot/event content and boss-ready actions; do not invent sample activity. |
| Bag grid | Eight fixed 56px columns occupy only part of the main pane, increasingly obvious at 1600. Reference fills the width with eight fluid columns. App's real 200-slot capacity differs from demo 40. | Fix fluid desktop grid; capacity is a protected game number and remains unchanged. |
| Bag toolbar/actions | App has an extra page heading, sort and Equip best utilities, pill filters and a taller toolbar; reference is compact. Equip best and detail Equip compete as primary actions. | Compact/re-skin without removing controls; preserve existing sorting and bulk equip. |
| Bag detail | Current detail and compare share a tall card, with actions below comparison in a two-column grid; reference has actions in the item card and a separate compare card. Real gear has more stats and Lock than the placeholder. | Reflow presentation while retaining every existing action/value and tab order. |
| Bag Relic claim | Source contains literal #1042 · minted for any Relic-like item, without token metadata. It is not used in the normal-gear captures but is exposed by the existing synthetic Relic component fixture. | Replace invented display proof with a truthful unavailable state; no new on-chain integration in this mission. |
| Unmerged screens | Forge/Market/Hero/Help/shared states still have their legacy implementations, unlike the approved redesign. | Deferred under the explicit AGR3/AGR4 gate; do not rebuild those lanes here. |

## Actionable findings for CXR2 (source lines at baseline)

1. apps/web/src/theme.css:18 — warning foreground fails AA on surface-3 (the new regression is red).
2. apps/web/src/theme.css:4 and :48 — page background and body base differ from the approved token brief.
3. apps/web/src/layout/layout.css:1052 and :1059 — Home padding is forced to zero while entry screens get an outer inset; these contradict the intended content/edge treatment.
4. apps/web/src/layout/home/home.css:16 and apps/web/src/layout/metrics.ts:37 — three-column layout and sizing formula differ from the two-column reference; fix both together to retain integer pixel scaling.
5. apps/web/src/layout/home/home.css:49 — card frame/radius and contextual loot/log styling differ; the screenshot's loot card is capped while large blank space remains.
6. apps/web/src/layout/classpicker/classpicker.css:3, :111 and :126 — centred short-card layout does not fill the intended desktop frame.
7. apps/web/src/layout/landing.css:26, :48 and :234 — inspect the scene/hero/cat positioning and full-bleed container against the paired captures.
8. apps/web/src/layout/LandingHero.tsx:76 and :109 — incorrect NFT standard and misleading public-source wording. Contract evidence is read-only: contracts/src/RelicNFT.sol:14 extends ERC1155.
9. apps/web/src/shell/shell.css:174 and :199 plus apps/web/src/layout/layout.css (v2-hint rules) — 1280px next-action label clips.
10. apps/web/src/layout/bag/bag.css:237, :247, :253 and :276 — fixed slot/card/tile widths waste the desktop pane.
11. apps/web/src/layout/bag/bag.css:50, :88 and :714 plus apps/web/src/layout/bag/BagPanel.tsx — toolbar/detail/compare presentation and action priority differ from the reference.
12. apps/web/src/layout/bag/BagPanel.tsx:395 — hardcoded token/mint proof. The existing test in BagPanel.test.tsx also asserts that placeholder and needs a documented old-to-new correction if fixed.

These are presentation findings, not authorization to change contracts, auth, economy, schema, art or repository visibility. Anything requiring a new feature or data contract remains a proposal.

## Audit and motion checks

- [UI audit stdout](CXR1/checks/ui-audit.log), [findings JSON](CXR1/audit/findings.json): nine manifest states × two desktop sizes = **18 audited; zero findings**. All document-scroll, horizontal-overflow, element-overlap, missing-element and console-error arrays are empty.
- [Effects stdout](CXR1/checks/effects.log): **9 checks, 0 FAIL** at the tool's default 1280×720. Combat impacts, frame changes, frame rate, long-frame threshold, halted idle behavior and reduced-motion transforms are checked. The tool currently has no viewport CLI option; 1600×900 effects are NOT VERIFIED here and are required in CXR2.
- Geometry success does not claim a match to the approved layout, text clipping detection everywhere, live wallet correctness or missing redesign coverage.

## Tier 2 notes

The explicitly requested theme.contrast.test.ts extension is a test-only addition outside the .test.tsx pattern. No production files are changed. The existing fixture and geometry helpers are reused without modified thresholds. The real-shell skip is removed, not replaced by another skip.

## NOT verified

AGR3/AGR4 redesign components and flows; real wallet or live server state; 1600px effects. Main's two mobile HUD failures remain outside the desktop scope. No contrast failure, missing feature or visual discrepancy is relabelled PASS.

## Delivery

Branch: ai/codex-redesign-cxr1; worktree: /Users/bao/.codex/worktrees/mega-cxr1/taskbar-hero. Draft PR: https://github.com/ntbaoheyhey/taskbar-hero/pull/245. Report and verification tails will be pushed even while the gate/finding keeps the item PARTIAL. Recheck latest main after the queue; never merge the draft from this run.

## Verification rounds

Round 1 exposed the test-only unsupported `exact` option during TypeScript checks. It was corrected without changing assertion behavior, then the entire install → drift → typecheck → lint → unit → build → e2e sequence was repeated. Round 2 passes compilation and builds. The deliberately active AA regression and two pre-existing excluded mobile HUD cases remain red and are listed above. [Complete browser output](CXR1/checks/full-e2e.log). Main and branch link debt remain exactly one absent proposal path.

The palette correction is assigned to the next CXR2 item rather than weakening the new test or mixing production styling into this test-only branch. Missing AGR3/AGR4 screens cannot be completed in this lane; their code is rechecked at the end of the queue.

<!-- MEGA verification evidence -->

## Executed checks

| Check | Exit | Result |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | 0 | PASS |
| `pnpm gen:deno` | 0 | PASS |
| `git diff --exit-code -- supabase/functions` | 0 | PASS |
| `pnpm typecheck` | 0 | PASS |
| `pnpm lint` | 0 | PASS |
| `pnpm test` | 1 | FAIL |
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
Done in 382ms using pnpm v10.28.0
```

```text
$ pnpm gen:deno
# exit 0; 0.2 seconds

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/mega-cxr1/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

```text
$ git diff --exit-code -- supabase/functions
# exit 0; 0.0 seconds
```

```text
$ pnpm typecheck
# exit 0; 8.8 seconds

> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/mega-cxr1/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
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
# exit 0; 8.8 seconds

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/mega-cxr1/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
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
# exit 1; 50.0 seconds
packages/chain test:  Test Files  3 passed (3)
packages/chain test:       Tests  32 passed (32)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  31 passed (31)
supabase/tests test:       Tests  541 passed | 1 expected fail (542)
packages/game-rules test:  Test Files  24 passed | 3 skipped (27)
packages/game-rules test:       Tests  366 passed | 2 expected fail | 11 skipped (379)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test: ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
apps/web test:  FAIL  src/theme.contrast.test.ts > theme WCAG contrast > --bad on --surface-3 >= 4.5:1
apps/web test:  Test Files  1 failed | 112 passed (113)
apps/web test:       Tests  1 failed | 1339 passed (1340)
apps/web test: Failed
/Users/bao/.codex/worktrees/mega-cxr1/taskbar-hero/apps/web:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/web@0.0.0 test: `vitest run`
Exit status 1
 ELIFECYCLE  Test failed. See above for more details.
```

```text
$ pnpm build
# exit 0; 7.2 seconds
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-cxr1/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1817 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.13 kB │ gzip:   0.77 kB
apps/web build: dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
apps/web build: dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/StageScene-EiK_cC7z.js           15.73 kB │ gzip:   5.79 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/index-Dg86klCB.js               239.71 kB │ gzip:  67.18 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 338ms
apps/web build: Done
```

```text
$ pnpm test:e2e
# exit 1; 68.3 seconds
    Received:    214

      62 |     expect(measures.intersections).toBe(0);
      63 |     expect(measures.luminance).toBeLessThan(.2);
    > 64 |     if (size.width <= 390) expect(measures.height).toBeLessThanOrEqual(88);
         |                                                    ^
      65 |     if (size.width === 1600) expect(measures.height).toBeLessThanOrEqual(64);
      66 |   });
      67 | }
        at /Users/bao/.codex/worktrees/mega-cxr1/taskbar-hero/apps/web/e2e/ui/u2-hud.spec.ts:64:52

    Error Context: test-results/4173-4174/ui-u2-hud-HUD-readable-at-320x568-stage-layout/error-context.md

  2 failed
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 390x844 ──────────────────────────
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 320x568 ──────────────────────────
  252 passed (1.1m)
 ELIFECYCLE  Command failed with exit code 1.
```

```text
$ pnpm --filter @taskbar-hero/web build
# exit 0; 5.0 seconds
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-cxr1/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
✓ 1817 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.13 kB │ gzip:   0.77 kB
dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/StageScene-EiK_cC7z.js           15.73 kB │ gzip:   5.79 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/index-Dg86klCB.js               239.71 kB │ gzip:  67.18 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB

✓ built in 342ms
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
 apps/web/e2e/ui/merged-redesign.spec.ts            |  74 +++++
 apps/web/e2e/ui/redesign-shell.spec.ts             |   8 +-
 apps/web/src/layout/bag/BagPanel.redesign.test.tsx |  46 +++
 apps/web/src/shell/redesign-contract.test.tsx      |  68 ++++
 apps/web/src/theme.contrast.test.ts                |  10 +
 reports/redesign/CXR1.md                           |  99 ++++++
 reports/redesign/CXR1/audit/findings.json          | 340 +++++++++++++++++++
 .../redesign/CXR1/checks/comparison-browser.log    |   2 +
 reports/redesign/CXR1/checks/desktop-e2e.log       |  40 +++
 .../CXR1/checks/effects-animation-inventory.json   |  14 +
 reports/redesign/CXR1/checks/effects-summary.json  |  56 ++++
 reports/redesign/CXR1/checks/effects.log           |  11 +
 reports/redesign/CXR1/checks/focused-unit.log      |  29 ++
 reports/redesign/CXR1/checks/full-e2e.log          | 369 +++++++++++++++++++++
 reports/redesign/CXR1/checks/round1-typecheck.log  |  26 ++
 reports/redesign/CXR1/checks/ui-audit.log          |  19 ++
 reports/redesign/CXR1/comparison.html              |  22 ++
 reports/redesign/CXR1/reference/bag-1280x720.png   | Bin 0 -> 56644 bytes
 reports/redesign/CXR1/reference/bag-1600x900.png   | Bin 0 -> 63101 bytes
 reports/redesign/CXR1/reference/class-1280x720.png | Bin 0 -> 32268 bytes
 reports/redesign/CXR1/reference/class-1600x900.png | Bin 0 -> 35936 bytes
 reports/redesign/CXR1/reference/home-1280x720.png  | Bin 0 -> 61117 bytes
 reports/redesign/CXR1/reference/home-1600x900.png  | Bin 0 -> 68614 bytes
 .../redesign/CXR1/reference/landing-1280x720.png   | Bin 0 -> 65656 bytes
 .../redesign/CXR1/reference/landing-1600x900.png   | Bin 0 -> 73051 bytes
 reports/redesign/CXR1/screens/bag-1280x720.png     | Bin 0 -> 92939 bytes
 reports/redesign/CXR1/screens/bag-1600x900.png     | Bin 0 -> 100013 bytes
 reports/redesign/CXR1/screens/class-1280x720.png   | Bin 0 -> 54229 bytes
 reports/redesign/CXR1/screens/class-1600x900.png   | Bin 0 -> 54154 bytes
 reports/redesign/CXR1/screens/home-1280x720.png    | Bin 0 -> 91526 bytes
 reports/redesign/CXR1/screens/home-1600x900.png    | Bin 0 -> 103318 bytes
 reports/redesign/CXR1/screens/landing-1280x720.png | Bin 0 -> 52159 bytes
 reports/redesign/CXR1/screens/landing-1600x900.png | Bin 0 -> 55778 bytes
 33 files changed, 1228 insertions(+), 5 deletions(-)
$ git diff --name-only origin/main
apps/web/e2e/ui/merged-redesign.spec.ts
apps/web/e2e/ui/redesign-shell.spec.ts
apps/web/src/layout/bag/BagPanel.redesign.test.tsx
apps/web/src/shell/redesign-contract.test.tsx
apps/web/src/theme.contrast.test.ts
reports/redesign/CXR1.md
reports/redesign/CXR1/audit/findings.json
reports/redesign/CXR1/checks/comparison-browser.log
reports/redesign/CXR1/checks/desktop-e2e.log
reports/redesign/CXR1/checks/effects-animation-inventory.json
reports/redesign/CXR1/checks/effects-summary.json
reports/redesign/CXR1/checks/effects.log
reports/redesign/CXR1/checks/focused-unit.log
reports/redesign/CXR1/checks/full-e2e.log
reports/redesign/CXR1/checks/round1-typecheck.log
reports/redesign/CXR1/checks/ui-audit.log
reports/redesign/CXR1/comparison.html
reports/redesign/CXR1/reference/bag-1280x720.png
reports/redesign/CXR1/reference/bag-1600x900.png
reports/redesign/CXR1/reference/class-1280x720.png
reports/redesign/CXR1/reference/class-1600x900.png
reports/redesign/CXR1/reference/home-1280x720.png
reports/redesign/CXR1/reference/home-1600x900.png
reports/redesign/CXR1/reference/landing-1280x720.png
reports/redesign/CXR1/reference/landing-1600x900.png
reports/redesign/CXR1/screens/bag-1280x720.png
reports/redesign/CXR1/screens/bag-1600x900.png
reports/redesign/CXR1/screens/class-1280x720.png
reports/redesign/CXR1/screens/class-1600x900.png
reports/redesign/CXR1/screens/home-1280x720.png
reports/redesign/CXR1/screens/home-1600x900.png
reports/redesign/CXR1/screens/landing-1280x720.png
reports/redesign/CXR1/screens/landing-1600x900.png
```

## Independent draft verification

Implementation/evidence commit: `9d6bc77`. Third full local verification round: `CI=true SCREENSHOTS=0 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' bash scripts/verify-pr.sh 245`, without --comment. Install, Deno drift, typecheck, lint and build pass. The unit AA failure and two excluded mobile e2e failures reproduce; no new category of failure appears. [Wrapper summary and test counts](CXR1/checks/verify-pr.log). The temporary verification checkout was removed.

Status remains PARTIAL because AGR3/AGR4 are absent and the active contrast finding awaits the following CXR2 fix. No tests are loosened or retried to conceal these results.
