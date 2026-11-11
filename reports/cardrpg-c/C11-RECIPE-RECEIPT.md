# C11 — pantry recipe availability and costs

Recipe crafting now previews the existing public meta command, shows the resulting owned/cap count, all currency/material costs and every shortage. Missing keys point to the existing mending recipe. Full supply/key stacks and the already-owned ribbon disable crafting before a rejected click; patrol and pending-account locks remain authoritative. Recipe options use player-facing item names. Purchases recompute from the current model state.

Baseline: twelve enabled invalid browser actions across missing resources and full stacks at both sizes; eight component regressions failed. Final: 48 browser checks including 16 keyboard purchases across all seven recipes, shortages, stack caps, active/Prepare/completed patrols. Whole-state comparison verifies read-only previews and exact public transactions. Nine recipe plus ten packing component tests (19 total), workspace typecheck and lint PASS. The stale-quote regression confirms a resource change cannot spend the old account.

Inspected all 38 final captures at1280×720/1440×900; no browser errors, overflow, broken visible images or clipped recipe/action bounds. Initial screenshot review caught generic packing guidance on the milk recipe. Corrected to the existing immediate-healing description, added its regression and repeated affected checks. Two final views and compact logs retained; baseline, initial and final diagnostics remain in /tmp/cardrpg-c-recipe-*. Reproduce with tools/cardrpg-c/pantry-recipe-review.mjs.

No costs, rules, gameplay, acceptance seeds, designer assets or static-demo inputs changed. Demo29,226,665bytes; score7.79 unchanged. Designer inbox still only README. Continue C8/C11 with route-wide packed tonic recovery controls.
