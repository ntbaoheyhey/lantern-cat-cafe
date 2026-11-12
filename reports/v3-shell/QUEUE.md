# V3B queue

- [ ] B1 done — Audio engine, licensed samples and sound board
- [ ] B2 done — Vietnamese fonts and typography tokens
- [ ] B3 partial — Original icons and rarity tiles
- [ ] B4 todo — Landing, sign-in and café hub
- [ ] B5 todo — Guided battle and first-visit tutorials
- [ ] B6 todo — Economy v3 and chain proofs
- [ ] B7 todo — Sync, reports and Vietnamese deployment guide

Each card records gates, evidence, self-score and any PARTIAL limits here. Local runs only.

## B2 — done, score 8/10
G1: shots/b2-vietnamese.png; browser font load check passes. G2: tests/b2-font-lint.log, no font-family declarations outside tokens. G3: 82,456 font bytes. All accents visually inspected. Centralized CSS families; protected Session A paths untouched.

## B1 — done, score 8/10
G1: AUDIO-BATTLE.json: 180 seconds, 1,021 cues, 848 played, 0 unmapped, 0 fallback, 0 browser errors; other cues intentionally suppressed by cooldown/voice priority. G2: AUDIO-LOUDNESS.json all 20 encoded files pass true-peak, music/voice loudness and loop RMS gates. G3: public/audio/LICENSES.json 100% coverage. G4: static-server sound board plays hit.blunt. G5: typecheck and 16 focused audio tests pass. Payload 3,937,590 bytes.

## B3 — partial pending end-of-queue revisit, score 7/10
G1: shots/b3-icon-sheet.png, original 16 painted item icons at 24/48/96 on light/dark; SVG nav/status and six rarity layers. G3: scripts/ui/check-icons.mjs, budget under 3 MB. G2: new shell will be glyph-free; inherited non-battle panels still contain glyph icons and need a focused sweep. No Session A files touched. Source atlas/prompts: assets/provenance.json.
