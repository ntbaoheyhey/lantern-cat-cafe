# Lane B illustrated puppet queue

ACTIVE — 2026-11-10. PROMPT.txt supersedes all older native-roster queues and pauses.
One agent; no native roster inference; preserve all sources. Default OFF; demo/look mode ON.
Check STOP-B/INBOX and fetch/show A6-OUTBOX between items. Commit/push and update draft #427 per completed item.

- [x] P1 Puppet pipeline (6 h): tools/cardrpg-look/art-rebuild/puppet/ — cut/fill/pivot/pack script per unit id (resumable, one command), runtime puppet renderer + motion set in the canvas, behind the existing look flag (default OFF; ON in the demo/look mode). Done: unit tests for rig loading/motion selection, one unit animates in battle.
- [ ] P2 Pilot 3 units (6 h): Mochi, Soot, Yarn Giant as puppets in a real battle; side-by-side with concepts; all motions; score >= 7.5 each. Fix lowest issue first (max 3 rounds per issue).
- [ ] P3 Camera + composition (3 h): closer framing, cats/enemies placement, no empty floor, ult push-in, shake. Before/after pair. Tell A6 in B-OUTBOX.
- [ ] P4 All 12 cats (2 batches of 6; commit/push per batch): Mochi, Soot, Clover, Panko, Mallow, Cinnamon, Velvet, Biscuit, Brioche, Marigold, Sorrel, Inkcap (check the exact roster ids in the code). Done per batch: battle captures, contact sheets, face/HP check, scores >= 7.5.
- [ ] P5 All enemies and bosses (batches of 6): all 13 enemy concepts mapped to every enemy/boss id in the rules; bosses with boss idle + phase flash. Done: every enemy id has a puppet or a documented fallback.
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
