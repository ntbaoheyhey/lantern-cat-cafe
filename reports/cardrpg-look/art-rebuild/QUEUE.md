# Lane B illustrated puppet queue

ACTIVE — 2026-11-10. PROMPT.txt supersedes all older native-roster queues and pauses.
One agent; no native roster inference; preserve all sources. Default OFF; demo/look mode ON.
Check STOP-B/INBOX and fetch/show A6-OUTBOX between items. Commit/push and update draft #427 per completed item.

- [x] P1 Puppet pipeline (6 h): tools/cardrpg-look/art-rebuild/puppet/ — cut/fill/pivot/pack script per unit id (resumable, one command), runtime puppet renderer + motion set in the canvas, behind the existing look flag (default OFF; ON in the demo/look mode). Done: unit tests for rig loading/motion selection, one unit animates in battle.
- [x] P2 Pilot 3 units (6 h): Mochi, Soot, Yarn Giant as puppets in a real battle; side-by-side with concepts; all motions; score >= 7.5 each. Fix lowest issue first (max 3 rounds per issue).
- [x] P3 Camera + composition (3 h): closer framing, cats/enemies placement, no empty floor, ult push-in, shake. Before/after pair. Tell A6 in B-OUTBOX.
- [x] P4 All 12 cats (2 batches of 6; commit/push per batch): Mochi, Soot, Clover, Panko, Mallow, Cinnamon, Velvet, Biscuit, Brioche, Marigold, Sorrel, Inkcap (check the exact roster ids in the code). Done per batch: battle captures, contact sheets, face/HP check, scores >= 7.5.
- [x] P5 All enemies and bosses (batches of 6): all 13 enemy concepts mapped to every enemy/boss id in the rules; bosses with boss idle + phase flash. Done: every enemy id has a puppet or a documented fallback.
- [ ] P6 VFX pass (6 h): every signature skill and ultimate on the puppets' real sockets/targets/timing; damage numbers; audit score >= 8.0 at x1 (reuse existing VFX masters where they fit).
- [ ] P7 Stage + light (3 h): warm cafe, faces lit, richer enemy side, night window; cast frame <= 33 ms.
- [ ] P8 Portraits/icons/card art (3 h): regenerate crops from the final puppet art where needed; one manifest; B-OUTBOX entry for A6.
- [ ] P9 Publish for A6 (1 h, repeat after each big batch): push, update #427, write B-OUTBOX.md (what changed, manifest paths, flags, known issues). Make sure the demo size stays <= 40 MB together with A6 (WebP atlases; report your share in B-OUTBOX).
- [ ] P10 Films (by 19 Nov 12:00 UTC): in the throwaway A6 preview (section 2), one 60-90 s x1 battle with several ultimates and one boss fight; R0 vs now comparison posters.
- [ ] P11 Report (by 20 Nov 12:00 UTC): ART-REPORT.md (scores vs R0, PUPPET-SCORES summary, what shipped, known issues, provenance), STATUS-VI.md summary, #427 description. Then improve the lowest-scored unit until the deadline.

## Completed history

- [x] New-session onboarding: 9feba11f4; no live native runner/lease; type/lint and7touchedtestsPASS.
- [x] R0 baseline, M5, Q1–Q4, Q9; original12cat+13enemy concepts,12VFXmasters, Q8 source crops.
- Native-era progress and pre-existing uncommitted queue notes preserved in QUEUE-NATIVE-ARCHIVE.md; no native model acceptance implied.

P1 complete 2026-11-10T16:26:41.319246+00:00: one-command resumable authored cut/hidden fill/1024atlas + validated rig; opt-in runtime and8semanticmotions. Mochi real battle +8pose contact sheet,0pageerrors/0UIoverlaps. type/lint20touchedtestsPASS. P2 remains visual/motion acceptance.

P2 complete 2026-11-10T16:37:30.317365+00:00: Mochi/Soot/Yarn original atlases in disposable A6 shell; 8 poses each, 75 s real x1 replay, 0 errors/overlaps. Median/p95 16.7/16.8 ms; five rules seeds exact across six art modes. Scores 7.8/7.6/8.0, with restrained-motion limits recorded. P3 next.

P3 complete 2026-11-10T16:46:06.885541+00:00: puppet-only framing/normalized heights, all faces visible in simple fan; four A6 captures at both sizes, 0 outside/faceHP/UI errors; ultimate push/impact shake/reduced-motion verified. P4 first six-cat batch now active.

P4 batch1 complete 2026-11-10T16:56:32.276421+00:00: six cats accepted,0page/faceHPerrors; corrected closed lids; type/lint17testsPASS; five-seed parityPASS. Batch2 remains top unfinished work.

P4 complete 2026-11-10T17:02:31.079205+00:00: all12cats in two published batches,96poses,0page/faceHPerrors; exact playable roster coverage test. Scores7.6–7.9; atlas share2368142B; combinedA6preview29.29MB. P5 next.

NON-STOP addendum recorded: continue the active item after checkpoints; only explicit stop/deadline/all-user-blocked gates apply. Full exact text in RULES.md and PROMPT.txt.

P5 batch1 accepted 2026-11-10T17:13:18.731907+00:00: six enemies,48poses,zero page/faceHP/DOM overlap;18tests/parityPASS. Second six and boss performance remain active.

P5 complete 2026-11-10T17:22:53.971881+00:00: all13enemy ids covered with original rigs/atlases; final7units56poses and4bosses×2sizes,0errors/overlaps;19tests and5seedparityPASS. Boss breathing/eye glow/motes/phase flash and reduced-motion verified. P6 next.
