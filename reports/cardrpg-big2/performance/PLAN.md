# B1 measurement plan
REFERENCE: reports/cardrpg-big2/memory/PROMPT.md; tools/cardrpg-big2/measure.mjs; tools/cardrpg-big/skill-measure.mjs; tools/cardrpg-big2/lifecycle.mjs

All timing requires /tmp/cardrpg-big-locks/timing.lock. CPU4 is CPU throttling only; GPU remains Metal.
Inherited cold/page/first-repeat harness retained. Lane B additionally pins input bytes in a private temporary artifact, traces each cold scenario, and separates pre-interactive, post-hub-interactive and post-scene-ready windows. None of those windows replaces the whole-page raw data.
The first pilot ran while the HTML builder replaced the file between cold cases; keep it as diagnostic only, not an artifact-consistent gate. Rerun from a captured byte snapshot.

Gates fixed before measurements: every cast <=50ms; >=99% cast frames <=20ms at DPR1/2; post-first-interactive MAX<=100ms; CPU4 p95<=33ms/MAX<=100ms; <=250draws/150000triangles. Cold load-to-interactive and battle-ready shown separately; whole-page MAX also shown even when it occurs before interactivity.
20-battle lifecycle is one naturally completed encounter then20 natural replay/result transitions with a real speed selector atx4. Record GC marks and all RAF intervals; GC occurs only between fights. Retained JS-heap growth <=2MiB and GPU geometry/texture/program growth=0 against replay0. This tests retained renderer lifecycle, not20different unique encounters; asset caching is separately exercised by the full gallery matrix.
Cold matrix:1280x720/1440x900 DPR1/2 CPU1/4 plus2560x1440DPR1. Skill matrix uses all72 inherited gallery actions x10 configurations=720 cases,1440 casts. Include low quality. Five worst-case trace reruns after ranking.
Rapid navigation while warmup compiles uses inherited meta-lifecycle20-case probe; confirms GPU release waits for compile settlement.
Three-size screenshot/layout/progress checks are separate from timing, to avoid screenshot capture contaminating RAF.
