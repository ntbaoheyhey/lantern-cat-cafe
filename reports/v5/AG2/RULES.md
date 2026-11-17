# V5 AG2 RULES (REV 3)
1. WRITE ONLY: apps/web/public/vfx/v5/**, tools/v5tex/**, reports/v5/AG2/**, work/v5/AG2/**.
2. PROOF RULE: commands must show output (ls -la, magick identify, check.mjs, git log -1 --stat, git push).
3. CHECKPOINT every 20m: git add apps/web/public/vfx/v5 tools/v5tex reports/v5/AG2, commit, push retry 4x.
4. MAILBOX /Users/bao/taskbar-hero-mailbox: read INBOX-AG2, BOARD, USER. STOP-ALL/AG2 -> reply STOPPED.
5. NO FREEZE / NO END TIME: stop only when DONE conditions (1)-(4) proven:
   (1) QUEUE.md has no queued/active/blocked cards;
   (2) Every REFILL LIST item (F1-F10) is DONE;
   (3) Every REQ in INBOX-AG2.md has ACK and DONE;
   (4) Every row in SCORES.md has all of G1-G5 >= 4.
6. REFILL RULE: empty queue -> append next 3 cards from REFILL LIST (F1-F10), never idle.
7. GENERATION FIRST: hero/boss effects MUST start from generated sheets (4x4 on pure black #000); procedural for post-proc/utility.
8. QUALITY GATE G1 (Light): hot white core -> saturated hero color -> dark falloff, soft gradients.
9. QUALITY GATE G2 (Matter): visible organic detail (wisps, turbulence, threads/crumbs/petals), not clean geometry.
10. QUALITY GATE G3 (Motion): flipbooks >= 12 frames, smooth curve (anticipation -> peak f4-6 -> dissipation).
11. QUALITY GATE G4 (Shape Language): reads as attack/heal VFX; NO UI icons, crosshairs, pawprints, hearts, stars.
12. QUALITY GATE G5 (Fit): soft painted cosy game look; readable on dark/light battle backgrounds.
13. COMPOSITE TEST: composite over real battle frame into reports/v5/AG2/comp/<id>.jpg (<=200KB); request CXV REVIEW.
14. BUDGETS: per file <= 220 KB, whole vfx/v5 <= 3.5 MB, check.mjs < 10s. Keep manifest IDs stable.
