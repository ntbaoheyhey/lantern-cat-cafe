# Progress · 6 November 2026
REFERENCE: reports/cardrpg-big/memory/PROMPT.md; reports/cardrpg-big/memory/STATE.md; baseline/GATES.md

F0 now has 610 cold cases, 1,220 casts, 129,685 raw frames and five profiled reruns. Whole-session MAX is 1,616.5 ms under CPU4. First/repeat cast MAX is 33.4/16.8 ms. There are 58 first-cast frames above 25 ms and zero repeat-cast frames above 25 ms. Both cast windows have zero frames above 50 ms. The profiles attribute opening spikes to the synchronous payload decoder and GC. The original 33.4 ms cast spikes were absent on profiled rerun, leaving a recorded attribution gap.

All five final validation gates pass. E2E 421, web units 1,630, root scripts 11. The source rules diff is empty. Stage height remains 57.12%, and 40/60 sampled frames have HUD-body intersections. All 48 actual skills lack effect-direction registrations.

Next is A automatic controller, default kits, Prepare/Result and all-entry-path checks, then F1 layout and F2 sharpness. The starter slice remains the priority for F3/F4. The requested hourly recovery script remains blocked by the session scheduling constraint. Checkpoints are pushed for handoff.
