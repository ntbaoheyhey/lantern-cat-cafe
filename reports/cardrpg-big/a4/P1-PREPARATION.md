# A4 P1 — decisions before the automatic encounter
REFERENCE: docs/design/cardrpg/GAMEPLAY-V4.md sections1–2; memory/PROMPT-A4-v2.md.

A new default-OFF gameplayV4 path adds counted crew jobs, front/rear formation, two standing-plan settings, complete automatic kits with fixed ultimate delays, readable enemy intent, and observed outcome reasons. The main offline demo opts ON. Existing active routes retain their stored mode; THC8 preserves extensions and THC5/6/7 migration remains available. First-node collected-roster changes are allowed; later edits keep the crew, carried HP and encounter seed. Fight commits preparation in rules.

Recovered unpublished implementation is preserved at f7bcc760 and wip/a4-p1-staged-2026-11-07. The preparation method was renamed to avoid the inherited mechanics-lab method. No B-owned or protected files changed.

| Evidence | Result |
|---|---|
| Typecheck / lint / build | PASS; label-only web typecheck also PASS |
| Web / rules | 1735 / 1035 pass; 2 expected failures, 11 skips inherited |
| E2E | 421 pass |
| Functional v4 simulation | 3000 encounters; 500 train seeds × 6 plans; exact replay and serialized-save equality |
| OFF behavioral equivalence | PASS 165 cells / 8250 routes, SHA 47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3 |
| Historical compatibility | 13 sim file hashes exact; baseline-v1 exact23937000bytes / 9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3 |
| Headless preparation paths | PASS 1280×720,1440×900,1024×600;10 captures each across Classic/Look |
| Layout / text | zero horizontal overflow/browser errors; minimum sampled new-panel text contrast6.2448:1 |
| Offline artifact | 26190242 bytes; SHA256 d4e5b472fcfb9f70e2d26f953a441893c8ec5b07e7d1ed26a028d12b4a44c51d |

Original failed logs retained: save harness compared omitted undefined fields before JSON-normalized equality; build used a stale interpreter then lacked Pillow; browser exact label lookup failed, then Look crew text contrast failed. Corrections are local tooling, explicit accessible names and A-owned panel CSS. The build uses a developer-only /tmp/cardrpg-a4-tools Pillow environment; no runtime dependency changed. Thirty captures are a targeted phase pack, not the reserved204 pack.

Receipts: validation/a4-p1.json; p1/sim.json; p1/events-fixture.json; p1-off/checks.json; p1/browser-*/checks.json; p1-scope.json. Raw simulations are functional evidence, not balance acceptance. P2–P7 numeric balance, pacing, startup/cold CPU and expanded meta loops remain pending. Artifact grew69913bytes against A3; live startup byte parity is NOT VERIFIED at this phase.

Open B request: hide obsolete charge/energy/break/flavour meters when battle.v4 exists and render typed crew/row/plan cues; A-owned Prepare/Result/event log already explains them. B presentation is not yet adopted. Phase cue≤400ms and finishing cue≤800ms must fit inside existing action duration.

G0-CLOSE: immutable BEFORE economy completed90accounts×45days, maximum heavy/casual ratio2.1948×; complete curve and OFF digest published with this checkpoint. See G0-AUDIT.md and g0/before.json. No merge/deployment.
