# Grader A — self-graded (fresh pass)

Exact head: `127e3f87c678be5909c4b420c46fd55d75fb5d72`. **0/100 — AUTO-FAIL**, not accepted for release.

Full four-file diff read before commands and retained in a-diff.patch. Scope is only docs/release-status.md, docs/security-overview.md, docs/submission.md and docs/video-script.md. Product tree is byte-identical to main340f88b. Builder passed; all37 local links and seven historical media hashes pass.

Sixteen command checks pass: script/package units, 1,448 web units, documentation links, typecheck, lint, art checks, build, repeated related journeys, one full browser matrix at each size, five-repeat resize and strict geometry audit. Full browser results are368/368 at1280×720 and368/368 at1600×900. Resize has0/20 failures; strict geometry has0/18 failing views. No exact-head full suite is repeated. No newly skipped/quarantined/weakened test.

The final pinned axe scan fails: Home has aria-prohibited-attr and the empty Bag has scrollable-region-focusable at both sizes, four failing scans out of20. These are inherited current-main defects with accepted fixes in #263, confirmed by its report and source diff. The separate current-live reward scan also confirms the known contrast defect fixed in #263. Class confirmation focus is assessed separately and repaired in #268. No threshold is waived and no duplicate source repair is made.

The runner mistakenly included nonexistent cxr2-states.spec.ts alongside merged-redesign.spec.ts. Playwright selected the six valid repeated journey executions per size. There are no changed browser specs in this docs-only diff. The one-time full suite includes actual cxr2-state-matrix.spec.ts; the supplementary exact-head state-matrix repeat passed30/30 under each viewport setting,60 executions total, without repeating the full suite. [Supplement receipt](../SINGLE-POLISH/logs/receipt.json).

Native1280 Home and1600 Forge screenshots were inspected: contained HUD/panels, readable body copy and consistent pixel-heading/body/numeric typography. Current-live Class/Home/Bag/Forge/Market/Help captures were also reviewed. Visual review does not override the accessibility failures.

Raw command exits: [a/receipt.json](a/receipt.json). Axe violations and incompletes: [a/axe/axe.json](a/axe/axe.json). This grade must be re-earned after the held fixes land and the docs draft is refreshed against final main.
