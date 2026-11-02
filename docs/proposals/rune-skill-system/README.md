# Rune and skill system proposal (docs and demo only)

Status: DRAFT. No game rule, contract, auth, schema, number or app code changed (Tier 3 untouched).
Date: 2026-10-31. Inspiration came from separate structure-only research; this directory contains the original proposal and runnable demo.

| File | What |
|---|---|
| `demo/index.html` | Clickable static demo (open in a browser; no build). 12 screens, desktop 1280x720 / 1600x900. All numbers are demo-only. |
| `design.md` | Data model, mapping to `packages/game-rules` without changing it, formulas, what needs sign-off. |
| `plan.md` | Phases, dependencies, owners, test plan. |
| `art/MANIFEST.md` | Every image the system needs (generated from the demo data). |
| `art/STYLE-BIBLE.md` | Palette, grid, outline and shading rules, frame counts, checklist, provenance rules. |

Originality rule: nothing here copies the reference game's art, names, flavour text or exact tables. The demo's pixel glyphs are placeholders drawn for this demo.
Implementation phases, dependencies and test requirements are in [the plan](plan.md). Asset requirements are in [the art manifest](art/MANIFEST.md).
