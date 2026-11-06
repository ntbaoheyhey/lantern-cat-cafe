# Progress · 6 November 2026
REFERENCE: reports/cardrpg-big/memory/PROMPT.md; reports/cardrpg-big/memory/STATE.md

F0 baseline validation passed all five gates. Web unit tests 1630, E2E 421. The old demo cold-load matrix shows MAX 1383.3 ms under CPU4. Seven >33 ms intervals in the traced default run now have main-thread task and CPU-stack evidence. Scene height is 57.12% at 1280×720, and 40 of 60 sampled frames have HUD-body intersections.

Source review found every depth skill missing an EFFECT_DIRECTION registration. The corrected 610-case measurement matrix runs serially against a frozen HTML snapshot, preserving first-use/repeat-use and page-open intervals. The heap pilot was superseded because browser memory values were rounded. The current run uses CDP heap readings and per-frame draw/triangle samples.

Next are the F0 phase-end audit/draft and phase A automatic controller, Prepare, Result and all-route tests. Ordered work remains F0, A, F1, F2, starter F3/F4, checkpoint, F5, M, I, G, F6, F7. The user's requested hourly self-recovery script is blocked by this session's automation rules. One agent continues in this chat.
