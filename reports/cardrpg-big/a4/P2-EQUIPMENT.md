# A4 P2 — equipment, saved shifts and pantry safety
REFERENCE: GAMEPLAY-V4.md sections3/4/9; memory/PROMPT-A4-v2.md. Status: functional phase accepted; balance residuals carried into P3/P6.

Gameplay v4 now computes bounded level-relative equipment stats and a labelled approximate utility score. Equipment compares current/replacement stats, crew transfers and set/unique effects. Three named shifts store the crew, rows, standing plan and equipment identities. Applying a shift validates every piece before changing any ownership. Missing pieces leave the current team intact.

The shared240-piece shelf rejects voluntary batch acquisitions before spending. Mandatory route drops convert into disclosed salvage within the daily threads cap. Pantry supplies reserve one preparation effect, refund an uncommitted replacement and consume on Fight. Existing over-cap saves retain every piece/stack. THC9 preserves shifts and supply reservations; THC5–8 import and OFF THC7 export remain supported.

## Verification

- Focused19 equipment/supply cases PASS, including missing preset items, whole-batch full-shelf rejection, daily conversion caps, over-cap imports, reversible reservations and exactly-once Fight consumption.
- Typecheck/lint/build PASS;1,735 web/1,054 rules tests (+2 expected failures/11 skips) and421 existing E2E PASS. 24 targeted captures across1280×720,1440×900,1024×600 and Classic/Look PASS;0 page errors/overflow; minimum measured contrast8.877:1. Receipt: p2/acceptance.json.
- The first full-suite failure came from an effect fixture that inherited a healing multiplier; the isolated fixture now measures the intended8/25 HP effect. Original failures and the passing retry are retained.
- Train-only1500-encounter pilot PASS for exact replay, preset/save roundtrip and absent legacy meters. Its24 adjacent steps contain6 increases,18 ties,0 reversals; fixed-content level6 remains saturated. These are residual balance misses, not500-seed heldout acceptance. OFF165cells/8250routes exactly match47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3.

## Limits carried into P3/P6

The utility score explicitly says approximate; its coefficients are not calibrated or certified by heldout ranking. Adjacent-tier win gains, full-band saturation, single-item paired win gain, equal-power set/cat spreads and crew advantage remain NOT VERIFIED. P3 must introduce declared gear-independent challenge bands before intended-content balance closure. No balance PASS is inferred from strictly ordered raw main stats.

B-owned fight presentation has not adopted the v4 event request. P2 touches no B/protected paths and does not promote the live default. Startup/cold CPU parity remains unverified. Targeted screenshots are separate from the reserved last-artifact204 pack. No merge or deployment.

Browser first attempt timed out on an exact accessible select label. Equipment/pantry controls now have explicit accessible names. A-owned panel colours now have explicit paired surfaces in Classic and Look and supply labels use player-facing catalogue names. The retained first-attempt log/checks contain no page error; corrected retry and both remaining sizes passed.

Artifact: docs/cardrpg3/index.html,26,198,406bytes; SHA-256 dc9654271bd5077cd58b2375dccb4e202ce2869ba90cc6e8de07e6c0903bdce2. This is8,164bytes above P1 and78,077above A3; startup-byte parity is therefore MISS. Still within the disclosed32MB artifact exception. ColdCPU not remeasured in P2. baseline-v1 and13historical sim files unchanged.
