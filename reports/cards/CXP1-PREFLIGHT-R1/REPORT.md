STATUS: PRELIMINARY CHECKS PASSED — not a full gate or grade.

# CXP1 integration preflight

Observed 2026-11-01T22:59:51+07:00. Detached integration 9d012cebf7300c60c3087cff5be632805ce75052, tree a22f271cbe1860a07574413f896720e3f2cc1634, combines prospective BASE0/FXRB7023a2d and published CXP1 64cf350. No product branch, PR head or main moved.

The first prelaunch guard rejected stale local ai/codex-cxp1 (6b06574); remote branch and worker checkout both confirm64cf350. No test was launched from that stale reference. Merge rehearsal then found17conflicts:16generated Deno maps and docs/design/decisions.md. Regenerating maps with repaired BASE0 generator retains every key/value from both parents and adds explicit pets/index aliases; the design index retains all three decisions. See resolution.json and setup-ref-guard.json. This resolution must be reapplied/reverified against actual main after BASE0 and FXRB merge.

All six commands exited0: frozen install, pet rules, preview store/isolation, web typecheck, Deno generation+zero drift+import resolution, and pets-preview repeat10. Browser result80/80: eight cases ×10, with fourcases at each1280×720 and1600×900 inside one invocation. Covers acknowledged claim counts, reload persistence, legacy migration and corrupt-storage recovery; no retries, skipped cases or assertion changes. Unit summaries: {"pets-rules": ["17 passed (17)"], "pets-store": ["17 passed (17)"]}. No screenshots generated.

Source review confirms the single count-read adapter in apps/web/src/pets/state.ts consumes existing snapshots and acknowledged claim events, does not grant gameplay rewards, and exports a device-local preview API. Original registry numbers remain DEMO_PREVIEW; isolation tests reject registry imports into combat/drop/forge/server consumers. Companions use original cat-world names and mechanics references recorded in the existing decision; this preflight adds no art or balance input.

Cleanup: temporary source checkout clean; runner29519 stopped;4440–4444free; scoped secret-pattern scan0hits. Exact commands/head/env/exits: checks/results.jsonl and checks/*.log. The unchanged original CXP1 report still describes its historical pre-BASE0 state and must be reconciled on actual integration.

Not verified: complete root/full-browser/UI/reference/a11y/G5/wrapper gates, fresh mutants, independent grades, actual-main integration, merge or live deployment. Preliminary evidence never substitutes for those gates.
