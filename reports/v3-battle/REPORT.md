# V3 battle integration report

The battle now uses normalized original cat/enemy art in dense two-row formations, a full-width portrait HUD, body status effects, bitmap damage numbers and distinct timed skills. Thirteen ultimate plates reuse approved original layers. All units use the native cut-out path; the application imports no Spine runtime.

Session B through B7 (`b7a6ed179`) is merged into `codex/v3-battle-2026-11-13`. A1–A4 are complete. A5 and A6 are closed PARTIAL after their bounded revisits; no active implementation cards remain. The draft is not fully gate-passing.

## Delivery and acceptance

| Card | Outcome | Evidence |
|---|---|---|
| A1 | Pass, 8.1/10 | 25 core-size checks; wave 1/3/boss layouts; before/after; 387 battle tests and 10 E2E |
| A2 | Pass, 8.5/10 | 12 portraits; status map and readability checklist; 58.7 FPS; bitmap numbers; manual/auto controls |
| A3 | Pass, 8.4/10, auto-approved | Three 60-second clips; exact 3200 ms contact; 60 FPS; reduced motion; deterministic rules parity |
| A4 | Pass, 8.3/10 | 49 sequences; 13 signatures; contact sheets; 5,999,616-byte cinematic asset set |
| A5 | PARTIAL, 7.8/10, pilots auto-approved | 22 template rigs; 220 animation strips; loop/event/freeze/performance checks pass; literal alpha gate fails 20/22 |
| A6 | PARTIAL, 7.6/10 | B1–B7 merged; 4,721 unit tests/typecheck/lint/build pass; audible 90-second demo delivered; 13 browser cases remain failing |

A5 retains embedded face/weapon pieces in approved atlas art. Independent repainting and complete hidden-area reconstruction remain unfinished. The final Sorrel deformation candidate reduced peak holes from 1006 to 684 but worsened staff/foot shapes; it was rejected and the original compiler/runtime restored. The unchanged strict gate and rejected evidence are in [A5/revisit/REVIEW.md](A5/revisit/REVIEW.md). No experimental geometry ships. All 13 ultimate plates were completed; the A4 fallback cut was unnecessary.

## Local validation

| Check | Result | Evidence |
|---|---|---|
| Root Node tests | 41 passed | A6/final-unit.log |
| Rules | 1,388 passed; 2 expected failures; 11 skipped | A6/final-unit.log |
| Web | 2,496 passed | A6/final-unit.log |
| Supabase local tests | 724 passed | A6/final-unit.log |
| Auth / chain / API contracts | 24 / 32 / 16 passed | A6/final-unit.log |
| Typecheck / lint / production build | Passed | A6/final-typecheck.log; final-lint.log; final-build.log |
| Latest full browser suite | 420 passed, 15 failed, 435 total | A6/final-e2e.log |
| Subsequent Odds-only recheck | 4/4 passed, resolving two of those 15 failures | A6/odds-icon-recheck.log |
| Remaining browser cases | 13 unresolved; no all-green full rerun claimed | A6/REMAINING-GATES.md |
| Final capture tools | Node syntax checks passed; encoded demo fully decodes | A6/demo-decode-check.log; demo-review.json |

The final source merge fixes earlier headless audio, economy types, Deno maps and guide failures. The two final Odds test repairs preserve exact prices, probabilities and keyboard/focus checks while selecting image-icon controls by accessible names. The Reset selector follows its new accessible name. No thresholds or visual baselines were relaxed. Product code did not change after the final unit/type/lint/build runs.

The remaining 13 browser failures are: eight legacy fallback-font cases; two Market font-fixture cases; two legacy ART2 pixel baselines; one 33-screen word-budget flow. That flow records 32 screens before hidden Night tips blocks access; nine recorded screens exceed 25 words. These are Session B-owned typography and non-battle screens. [REQUESTS-TO-B.md](REQUESTS-TO-B.md) contains actionable locations and reproduction commands. Fresh full builds and focused reruns confirmed the issues; the final revisit fetched B again and found no newer commit. Ownership prevents a safe A-only repair. No hidden CSS workaround was added.

The inherited Session B economy remains PARTIAL: its half-demand burn/all-claims ratio, Star Thread source/sink ratio and heavy-player Legendary timing miss B6 targets; completed-fusion/edition indexing remains absent/Offline. See [Session B report](../v3-shell/REPORT.md) for its own evidence and deployment handoff.

## Audible demo and review access

[demo-v3.webm](A6/demo-v3.webm): 90.007 seconds, 1280×720, 30 FPS, VP9 + stereo Opus, 11,233,436 bytes. The identical Desktop copy is `/Users/bao/Desktop/TaskbarHero-REVIEW/demo-v3.webm`. SHA-256: `d840553def558c8901a934775956b75f0bfffa168cf7de31cde3ede837aa33ab`.

The clip shows landing → Play free guest entry → home → formation → Mochi and Soot ultimates → combat victory → Forge fusion reveal. It uses a disclosed local fixture: level-6 cats, two ready ultimates, four enemies with 450 HP/45 attack/4 defense, and four Common forge inputs. Combat resolves through the real deterministic rules and the reveal uses the real BoundFusion action. Audio is the unmodified live mixer output (mean −22.6 dB, peak −1.2 dB); decoding passes. The original encoder failed after runtime assertions; recovery reused the original audio/video and corrected timestamp syntax/marker detection. Exact runtime cue arrays were not persisted in that first capture; the assertions and recovery limitations are recorded in [demo-review.json](A6/demo-review.json).

Review [the film strip](A6/demo-film.png), [pilot clips](A3/), [all ultimate sheets](A4/), [rig pilots and QA](A5/), or open `docs/vfx-lab/index.html`. Pilot clips are also on Desktop and were auto-approved under the user's decision. The bilingual designer contract is `docs/rig-contract.md`.

[Draft PR #444](https://github.com/ntbaoheyhey/taskbar-hero/pull/444) targets main and remains a draft. GitHub Actions is blocked by billing; every reported gate ran locally. No deployment, live migration, contract deployment or main merge was performed. Disk cleanup left approximately 98 GiB free; no owned preview servers remain. Merge/deploy decisions remain user-only.
