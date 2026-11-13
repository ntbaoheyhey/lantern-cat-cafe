# V3 battle integration report

The battle now uses normalized original cat/enemy art in dense two-row formations, a full-width HUD, portrait controls, on-body statuses, bitmap damage numbers and distinct timed skill sequences. Thirteen ultimate plates use the approved original layers and native cut-out actors. The application imports no Spine runtime; the three designer cats are preserved.

## Delivered acceptance evidence

| Card | Outcome | Evidence |
|---|---|---|
| A1 | Pass, 8.1/10 | 25 core-size checks; wave 1/3/boss layouts; before/after PNG; 387 battle tests and 10 E2E |
| A2 | Pass, 8.5/10 | 12 portraits; status map/readability; 58.7 FPS; bitmap numbers and manual/auto controls |
| A3 | Pass, 8.4/10, auto-approved | Three 60-second review clips; exact 3200ms contact; 60 FPS; reduced motion and determinism parity |
| A4 | Pass, 8.3/10 | 49 sequences, 13 signatures, contact sheets; 5,999,616-byte cinematic asset set |
| A5 | Partial, 7.8/10, pilots auto-approved | 22 template rigs; 220 animation strips; loop/event/freeze/performance gates pass; literal alpha gate fails 20/22 |
| A6 | In progress | Session B B1–B5 merged; draft PR #444; local integration failures isolated; audible demo harness prepared |

A5 retains embedded face/weapon pieces in approved atlas art. It does not claim the requested independent repaint/split workflow is complete. Raw holes include source handles/tail openings and some extreme-pose slivers; the failing counts are kept. A final bounded revisit is planned before closure.

## Local integration verification

Initial combined rules run: 1,382 passed, 2 expected failures, 11 skipped. Initial web unit run: 2,487/2,491 pass. Initial full E2E: 409/435 pass. Returning-guest fixtures resolve the landing-screen timeouts. The follow-up run exposes legacy font fallback and hidden Night tips in Session B's shell; exact repros are in REQUESTS-TO-B.md. B6's economy definitions, headless audio guards and guide repairs are awaiting publication. Typecheck, lint and build must be rechecked after that merge.

During cleanup, the nested server E2E build was removed while later cases still needed it. It was restored with the same environment; subsequent guidance cases reach their real font assertion. The initial eight missing-page failures are not attributed to the product.

GitHub Actions is blocked by billing. All listed evidence is local. No deployment, live database migration, contract deployment or main merge was performed.

## Review access

[Draft PR #444](https://github.com/ntbaoheyhey/taskbar-hero/pull/444). Local media: `reports/v3-battle/A3/`, `A4/`, `A5/`, and `/Users/bao/Desktop/TaskbarHero-REVIEW/`. Open `docs/vfx-lab/index.html` for the offline skill lab. The final 90-second audible journey will be placed in `A6/demo-v3.webm` and copied to Desktop. Designer intake contract: `docs/rig-contract.md` (English/Vietnamese).
