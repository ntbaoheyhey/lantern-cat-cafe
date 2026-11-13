# V3B queue

- [x] B1 done — Audio engine, licensed samples and sound board
- [x] B2 done — Vietnamese fonts and typography tokens
- [x] B3 done after revisit — Original icons and rarity tiles
- [x] B4 done after revisit — Landing, sign-in and café hub
- [x] B5 done — Guided battle and first-visit tutorials
- [x] B6 closed PARTIAL — Economy flow proved; simulation targets missed after three tuning candidates
- [x] B7 done — Pushed handoff, draft PR #445, current evidence and Vietnamese deployment guide

Each card records gates, evidence, self-score and any PARTIAL limits here. Local runs only.

## B2 — done, score 8/10
G1: shots/b2-vietnamese.png; browser font load check passes. G2: tests/b2-font-lint.log, no font-family declarations outside tokens. G3: 82,456 font bytes. All accents visually inspected. Centralized CSS families; protected Session A paths untouched.

## B1 — done, score 8/10
G1: AUDIO-BATTLE.json: 180 seconds, 1,021 cues, 848 played, 0 unmapped, 0 fallback, 0 browser errors; other cues intentionally suppressed by cooldown/voice priority. G2: AUDIO-LOUDNESS.json all 20 encoded files pass true-peak, music/voice loudness and loop RMS gates. G3: public/audio/LICENSES.json 100% coverage. G4: static-server sound board plays hit.blunt. G5: typecheck and 16 focused audio tests pass. Payload 3,937,590 bytes.

## B3 — done after end-of-queue revisit, score 8/10
G1: shots/b3-icon-sheet.png, original 16 painted item icons at 24/48/96 on light/dark; SVG nav/status and six rarity layers. G3: scripts/ui/check-icons.mjs, budget under 3 MB. G2: complete non-battle card-RPG sweep returns zero glyph icons; tests/icons-final.log. Final payload: 207,921 bytes. No Session A files touched. Source atlas/prompts: assets/provenance.json.

## B4 — done after end-of-queue revisit, score 8/10
G1: 18 desktop screenshots at 1280x720 / 1440x900, shots/b4-*.png. New landing, seven-button dock, dark panels, self-hosted fonts; inherited glyphs and panel contrast repaired and re-reviewed. G2: tests/b4-anvil.json real guest and injected wallet SIWE on Anvil 8546, plus mock guest screenshot flow and 18 focused tests (one assertion-library repair, then pass). G3: verified supply read or explicit Offline; no save-based chain counts. G4: typecheck and typography lint pass. Muted ten-second gameplay trailer recorded locally. Economy/season pages read v3 policy, with direct contract-season burn/claims and validated indexer fallback; feature actions are proved under B6.

## B5 — done, score 8/10
G1: tests/b5-flow.json walks a new guest through the practice battle, all 26 steps and 14 guide pages; zero browser errors. G2: roles, rows, turn order, enemy intent/targeting, rage, statuses, supplies, speed/auto, equipment/sets, enhancement/Blessing, fusion, rates/pity/featured, seasons/edition, Spool/Deed/sealing/market all covered in lessons.ts and FieldGuide. G3: four focused tests enforce 12-word instructions, skip/replay and pause restoration. Workspace typecheck passes. Evidence: shots/b5-battle-coach.png and b5-guide.png. Coaching describes the actual auto-plan battle controls; Session A owns any future manual ultimate control.

## B6 — closed PARTIAL after final revisit, score 6/10
G1: tests/b6-anvil.json, 13 confirmed receipts including dead-address burn, quality/Deed discovery and guest-wallet movement; tests/b6-browser.json shows guest quest/mint/withdraw UI. G2: live-counters-final.log and economy-v3 rule tests compare published odds to actual rules. G3: ECONOMY-SIM.md/JSON and COHORT-SUMMARY.json, complete 120-account cohort. Half-demand burn/all claims 0.846–0.897 FAIL; Star Thread source/sink 25.93–36.04 FAIL; heavy first Legendary median day 11 FAIL. Casual day 11 PASS; hourly ratio <=3x PASS within model. Three tuning candidates exhausted; report honestly, no fourth round. G4: Bell-only draw costs, deterministic fusion, no YARN random path. G5: release-suite/types/build and real PostgreSQL concurrency checks pass. V3 guest quest gate and shared tester-pool guard pass focused checks. Final revisit completed; no pending implementation card, but economy acceptance remains PARTIAL. Optional currency migration/dynamic fees deferred.

## B7 — done, score 8/10
Implementation committed at 9af6da640 and pushed to codex/v3-shell-2026-11-13. Draft [PR #445](https://github.com/ntbaoheyhey/taskbar-hero/pull/445) targets main without merging. REPORT.md and TEST-EVIDENCE.md distinguish current passing local checks from historical repairs and the three economic misses. USER-DEPLOY-VI.md covers the 20 November operator sequence, finite shared budgets, Supabase changes, Vercel demo flags, sponsor funding, market seed, public smoke and rollback; SQL and ten shell blocks were checked locally. STATUS-VI.md remains under 30 lines. Recorded preview PIDs 41682 and 41781 are stopped. Session A's later battle/rig/trailer integration and the user's deployment remain explicit external follow-ups; no request to import A was present.
