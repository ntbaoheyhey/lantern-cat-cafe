# B5 · default-off automatic mechanics checkpoint
REFERENCE: docs/design/cardrpg/MECHANICS-LAB.md; packages/game-rules/src/cardrpg/depth/auto-extras; tools/cardrpg-big2/MechanicsLab.tsx

Tea cloud, Front relay and Intent lens are additive, encounter-local experiments. All four checkboxes (master and three extras) start off. No save or live economy changes; the lab uses its own disposable account. Promotion remains the user’s decision.

## Evidence
REFERENCE: ../mechanics/SUMMARY.md; ../mechanics/browser/checks.json; ../validation/b5-fixed.json; ../validation/b5-e2e.json

- 18,000 variant fights plus 3,600 original references; 50 training and 50 held-out seeds per cell. All 3,600 disabled/full-state JSON comparisons and 7,200 disabled/lens hash checks match. Tea cloud changes 3 training and 4 held-out losses to wins; relay changes none. Saturated level-6 cells do not establish balance.
- Typecheck, lint, build and tests passed: 1,689 web / 935 rules (+2 expected failures, 11 skips), 32 chain / 24 auth / 581 Supabase / 16 contract. Archived-source E2E: 421 passed. The 32 added rules tests cover flags, caps, round limits, source attribution, terminal states and replay parity.
- Four real-click browser cases: 1280×720, 1440×900, reduced-motion 1024×600, and CPU4 1280×720. Zero runtime errors, unchanged main account, automatic controls only, impact-aligned proc cue and matching final SHA256 `45c71470afe5af090cb5c53399dfb14ffbfc52068252fc6c526ecbac0fc7bfb7`. Natural playback sample MAX16.8ms / p95 16.7ms; 223 draws / 99,992 triangles. This is not the exhaustive skill matrix.
- Seven fresh-page cold runs: whole-page MAX199.9ms native /149.9ms CPU4, post-interactive MAX133.4ms; CPU4 p95 16.8ms. Opening and post-interactive100ms gates MISS. Raw frame arrays remain in [cold](cold/summary.json).

## Visible limitations
REFERENCE: ../review/FRESH-EYES.md; ../mechanics/browser; ../mechanics/browser-early

The screenshot review found a separated master checkbox, dim disabled descriptions and a result below the initial viewport. The later B6 review source fixes these; this pinned B5 artifact deliberately retains the original screenshots and measurements. Its lab is functional but is not accepted as the final layout. Team choices are compact text selectors; full team-building screens remain Lane A-owned. The final full-roster matrix and integrated ON/OFF gear/economy simulations remain required.

Artifact SHA256: `bdf621365486924dc2c2037b4db515d4f9b12e4aa2498c04f948c7353854c125`. Source/archive identity is recorded in validation/pinned-source-audit.json. No merge or deploy.
