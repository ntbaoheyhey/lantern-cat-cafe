# Session A queue

Run local gates, read INBOX after each card, commit `V3A <card>: <what>` and push the branch after every card. Revisit PARTIAL once after A6. STOP-V3A or freeze (2026-11-19 12:00 UTC) stops feature work.

| Card | Status | Scope and acceptance | Evidence | Self-score |
|---|---|---|---|---|
| A1 | done | Core size all 25; dense two rows; camera/decor/rings; wave 1/3/boss 720p; before/after; battle units + cardrpg E2E | A1/core-size.json; formation-review.json; before-after.png; battle-tests.log (387/387); e2e.log (10/10); typecheck.log | 8.1 (impact 8, readability 7, distinctness 8, perf 8, stability 10, disk 10) |
| A2 | done | Full bleed HUD; 12 portraits; body statuses and mapping; bitmap numbers; TOTAL banner; readability; token font lint; 10s FPS >=50; tests | A2/portraits.png; statuses-1280.png; review.json (58.7 FPS); STATUS-MAP.md; READABILITY.md; unit-tests.log + lifecycle-tests.log; controls-tests.log; e2e-recheck.log; typecheck.log | 8.5 (impact 8, readability 8, distinctness 8, perf 9, stability 10, disk 10) |
| A3 | done | Sequence engine; one postprocessing composer; fixed-clock compositor; 3 pilots <=600KB, impact ±1 frame; unique signatures; static lab; 60s clips + film strips + Desktop copies; High FPS >=50; reduced motion; determinism | A3/browser-review.json (60.0 FPS, exact 3200 ms contact); recording-budget.json (3 × 60 s, 2.73 MB); pilot-*.webm + Desktop copies; *-ult-film.png; unit-final.log (88), model-recheck.log (17), rules-parity.log (10), e2e.log + e2e-recheck.log (10), typecheck.log; SELF-REVIEW.md | 8.4 (impact 8, readability 8, distinctness 8, perf 10, stability 10, disk 8); auto-approved |
| A4 | done | 12 cats + boss unique ultimates; 2–3 active sequences; 4 basic archetypes; all signatures; beat contact sheet; cinematics <=12MB; tests | A4/review.json (49 sequences, no browser errors, 5,999,616 bytes); ultimates-1…4.png; actives-1…4.png; boss-cutin.png; lab.json + lab-field.png; unit-tests.log (74), e2e.log (10), typecheck.log; signature-check 13/max shared 2 | 8.3 (impact 8, readability 8, distinctness 8, perf 8, stability 10, disk 9) |
| A5 | todo | Shared cut-out template and enemy variants; parts/pivots/events; 2 auto-approved pilots then batch; 12-frame animation strips; hole=0 and seam<1%; core sizes; High FPS >=50; tests; bilingual rig contract | Pending | Pending |
| A6 | todo | Merge Session B by ownership at available sync; local full suite/typecheck/lint/build/E2E; 90s audible journey demo; draft PR to main; final English report + Vietnamese status | Pending | Pending |

Score weights: visual impact 30%, readability 20%, distinctness 20%, performance 10%, stability 10%, disk budget 10%; target A1–A4 >=8. Scores reflect observed evidence, not intent.
