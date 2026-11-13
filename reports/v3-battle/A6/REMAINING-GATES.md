# Remaining integration gates

Source: integrated product at `0b323e282` (Session B `b7a6ed179`). Final full E2E: 420/435 pass, 15 failures. The subsequent four-case Odds recheck passes and resolves two failures. Thirteen remain; this arithmetic is not a claim that a later full run passed 422/435.

| Failing group | Cases | Diagnosis and owner action |
|---|---:|---|
| baseline-hud fallback guidance | 8 | B removed legacy per-element font rules, while the centralized typography application loads only on the cardrpg entry. The guidance button computes Times even when --font-body is set to sans-serif. Apply shared rules to the legacy entry or restore the intended migration boundary. |
| cxu3-market font fixture | 2 | The legacy Market fixture still checks DM Sans, Pixelify Sans and JetBrains Mono. B must establish and load its intended typography; then align assertions with loaded token fonts. |
| art2-flag-off pixel baseline | 2 | Legacy landing differs from reviewed default-off pixels. Reassess after the font repair; keep baselines unchanged until the typography change is intentional and visually reviewed. |
| text-diet 33-screen flow | 1 | apps/web/src/game/cardrpg/shell/shell.css:6 hides .uv-tips with display:none!important. The Review Night tips control is unreachable. The first 32 screens also include the nine over-budget screens below. |

| Screen | Visible words | Limit |
|---|---:|---:|
| collection | 31 | 25 |
| tower | 39 | 25 |
| bonds | 27 | 25 |
| skills | 30 | 25 |
| cat-gear | 26 | 25 |
| cat-bonds | 26 | 25 |
| tasks | 34 | 25 |
| gifts | 30 | 25 |
| menu | 28 | 25 |

Counts come from `final-word-budget.json` and include the shared Mix control. Keep the existing visibility/count rules and the 25-word threshold. Restore tips access and shorten/restructure B-owned screen text without losing accessible names or keyboard access.

Reproduce from the worktree root with ports 5990–5993 free:

```sh
E2E_PORT_CLASSIC=5990 E2E_PORT_V2=5991 E2E_PORT_SERVER=5992 E2E_PORT_API=5993 pnpm --filter @taskbar-hero/web exec playwright test e2e/ui/baseline-hud.spec.ts e2e/ui/cxu3-market.spec.ts e2e/ui/art2-flag-off.spec.ts e2e/text-diet-c2.spec.ts --grep 'guidance remains readable with fallback fonts|CXU3 real MarketView|ART2 flag-off|C2 player screens' --workers=2 --reporter=line
```

A6 repair methods: fresh integrated builds/full run, then targeted selector repair and focused reruns with source-level diagnosis. The final bounded revisit fetched Session B and confirmed no newer published implementation. A cannot edit these B-owned screens/typography under the user's hard limit. A6 therefore closes PARTIAL with these requests retained. Rerun the affected cases after B fixes, then run the full suite before treating the draft as gate-passing.
