# F3 slice phase self-check
REFERENCE: ../memory/PROMPT.md lines 95–99, README.md, variety.json

| Brief requirement | Result | Evidence |
| --- | --- | --- |
| Per cat/enemy at least 12 distinct clips | PASS slice,22 authored per starter hero and 19 per chapter-one model. Remaining roster deferred until checkpoint | card-motion.ts, card-motion-data.ts, card-enemy-motion.ts |
| Idle variants and fidgets every 4–8 s | PASS three variants, deterministic interval and reduced-motion tests | validation/f3-focused.log |
| Ready, walk-in, each skill, ultimate, reactions, guard, heal, KO, victory, defeat | PASS authored coverage. Victory/defeat result presentation due F5, basic/signature enemy presentation variants due F4 | card-motion.test.ts |
| Anticipation, action, follow-through and recovery | PASS authored key tables and actual-rig finite transform samples | trajectories.json |
| Squash/stretch, overshoot, secondary movement, weight shift, eased curves | PASS implementation and rendered strips. Artistic quality remains a self-assessment | ../filmstrips/ |
| Target-directed root motion, stop distance and return | PASS bounded function tests, travel visible in union-crop strips | card-motion.test.ts, ../filmstrips/mochi-1.webp |
| Joint distance matrix and fix offenders | PASS 30/30 required slice pairs at declared 0.10 rad/0.012 height thresholds | variety.json |
| Eight frames per skill/enemy action, embedded in demo | PASS 20 sheets/160 frames, remaining roster due after checkpoint | MotionEvidence.tsx, ../filmstrips/ |
| Retain F1 facing and clear layout | PASS 915 poses with zero overlap/crop/occlusion. Hero scale band MISSED 18.86–47.50% | layout/measurements.json |
| Rerun F0 harness, no new hitches | FAIL full-session, PASS casts. Cold7 and610 cases complete. CPU4 coldMAX383.4/333.3ms, matrix pageMAX566.7ms. First/repeatMAX33.4/16.8ms, zero cast>50ms | PERFORMANCE.md, skills/ranked.json |
| Typecheck, lint, unit, build, E 2 E | PASS final validation after evidence size change,1653 web,903 rules,421 E 2 E | ../validation/f3-final.json |
