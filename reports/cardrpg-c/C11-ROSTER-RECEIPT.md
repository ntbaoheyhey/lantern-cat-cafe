# C11 — roster order

Public gallery switches kept surviving cats in their old renderer lanes while the A6 HP/rage cards followed the new crew order. Reproduced eight mismatches in twenty cases. Party lanes now follow the same actor order as the cards; an asynchronous load reads the current assignment when it completes. Existing enemy identity lanes remain stable.

Verification: all twenty public preview/return cases pass at 1280×720 and 1440×900, with both motion settings. The original paused practice battle stays byte-for-byte unchanged. Ten additional lifecycle checks cover delayed Mochi image completion across two roster switches, return to practice, enemy removal/replacement, and fallen party members. The first lifecycle harness accidentally held Vite PNG module imports and timed out before app initialization; restrict the delay to image requests. Preserve that failed harness receipt separately; it was not a product failure.

Thirty existing focused tests across layout, cinematics, FeelLab and BattleHudA6 pass, as do workspace typecheck/lint and diff whitespace checks. Retained those completed logs without rerunning. Rebuilt the offline gallery/demo. Framing recheck: 240 source cases, minimum edge clearance 4.16px, peak 70 draws; 144 offline cases and six real Pause/Play checks pass, peak 61 draws. No label/mask overlap, dropped particles, browser error or offline HTTP request. This is correctness evidence; no new frame-time benchmark.

Inspected all 26 final captures via six contact sheets: eight public roster views, ten source framing views, eight offline views. Also inspected full-size 720p Inkcap and 900p Yarn Giant. Stage cats match the card sequence; boss/minions fit and faces/HP remain clear. Evidence in shots/c11-roster-{before,after,framing,offline}, checks/c11-roster-*, and the roster review harnesses.

Demo 29,225,393 bytes; Lane C evidence about 111.0 MB, below the 40/120 MB limits. Designer inbox remains empty; no new published PSD character. Score 7.79, gameplay/rules, original account recordings and seed ledger unchanged. Full 421 E2E results predate these C11 changes; earlier four forced-redraw differences remain PARTIAL.

Next inspect cancellation of pending actors when a preview is closed or its enemy is replaced before loading completes; the current delayed case retained Mochi throughout. Continue C8/C11, with the final report due 20 November.
