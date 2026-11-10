# Lane B illustrated puppet queue

ACTIVE — 2026-11-10. PROMPT.txt supersedes all older native-roster queues and pauses.
One agent; no native roster inference; preserve all sources. Default OFF; demo/look mode ON.
Check STOP-B/INBOX and fetch/show A6-OUTBOX between items. Commit/push and update draft #427 per completed item.

- [x] P1 Puppet pipeline (6 h): tools/cardrpg-look/art-rebuild/puppet/ — cut/fill/pivot/pack script per unit id (resumable, one command), runtime puppet renderer + motion set in the canvas, behind the existing look flag (default OFF; ON in the demo/look mode). Done: unit tests for rig loading/motion selection, one unit animates in battle.
- [x] P2 Pilot 3 units (6 h): Mochi, Soot, Yarn Giant as puppets in a real battle; side-by-side with concepts; all motions; score >= 7.5 each. Fix lowest issue first (max 3 rounds per issue).
- [x] P3 Camera + composition (3 h): closer framing, cats/enemies placement, no empty floor, ult push-in, shake. Before/after pair. Tell A6 in B-OUTBOX.
- [x] P4 All 12 cats (2 batches of 6; commit/push per batch): Mochi, Soot, Clover, Panko, Mallow, Cinnamon, Velvet, Biscuit, Brioche, Marigold, Sorrel, Inkcap (check the exact roster ids in the code). Done per batch: battle captures, contact sheets, face/HP check, scores >= 7.5.
- [x] P5 All enemies and bosses (batches of 6): all 13 enemy concepts mapped to every enemy/boss id in the rules; bosses with boss idle + phase flash. Done: every enemy id has a puppet or a documented fallback.
- [x] P6 VFX pass (6 h): every signature skill and ultimate on the puppets' real sockets/targets/timing; damage numbers; audit score >= 8.0 at x1 (reuse existing VFX masters where they fit).
- [x] P7 Stage + light (3 h): warm cafe, faces lit, richer enemy side, night window; cast frame <= 33 ms.
- [x] P8 Portraits/icons/card art (3 h): regenerate crops from the final puppet art where needed; one manifest; B-OUTBOX entry for A6.
- [x] P9 Publish for A6 (1 h, repeat after each big batch): push, update #427, write B-OUTBOX.md (what changed, manifest paths, flags, known issues). Make sure the demo size stays <= 40 MB together with A6 (WebP atlases; report your share in B-OUTBOX).
- [x] P12 [auto] Individual motion polish after core delivery: improve the lowest motion score with authored tail/cloth lag and a clearer anticipation/settle pilot; compare at x1, retain clean overlap and reduced motion. Extend only accepted improvements to relevant rigs.
- [x] P13 [auto] Broad-boss composition: inspect Rain Spool impact proximity to party faces and improve lateral spacing without shrinking accepted cat/boss scale; two viewports, same HUD envelopes; also both Binding Thread faces visible in Rain Spool/Yarn Giant/Pantry Crown fights, verified canvas dimensions.
- [x] P15 [auto] Phase3 summoned-add composition: extend the accepted initial two-add formation to all four Binding Threads; keep every face identifiable at both sizes, retain boss/cat scale; inspect actual phase3 in current A6 before final film acceptance.
- [x] P10 Films (by 19 Nov 12:00 UTC): in the throwaway A6 preview (section 2), one 60-90 s x1 battle with several ultimates and one boss fight; R0 vs now comparison posters.
- [x] P11 Report (by 20 Nov 12:00 UTC): ART-REPORT.md (scores vs R0, PUPPET-SCORES summary, what shipped, known issues, provenance), STATUS-VI.md summary, #427 description. Then improve the lowest-scored unit until the deadline.

- [x] P14 [auto] Lowest-score motion continuation after report: Spool Ram (overall7.6/motion7.5) gets a forward horn dip, planted front legs and delayed tail recovery. Accept only from x1 before/after and reduced-motion/face/HP checks; preserve art/rig and scores of untouched units.

- [x] P16 [auto] Lowest-score motion continuation: Inkcap lantern lead, open offhand and soft tail follow-through on the existing mesh/atlas; preserve tail root and reduced motion. Accept from both sizes, natural x1 basic/signature/ultimate, sockets/face-HP and compact evidence; max3repairs, no score uplift from tests alone.

- [x] P17 [auto] Lowest-score motion continuation: Sock Skipper gets a small anticipation/hop/landing, a forward mitten reach and loose-thread recovery, using existing art. Two sizes, natural x1 basic/signature and reduced motion; keep boot/knit seams, actual glove socket and HP clear. Max3repairs; no score uplift from technical gates alone.

- [x] P18 [auto] Lowest-score motion continuation: Cinnamon raises its left-hand serving tray with a restrained right-cup countergesture, delayed head/tail recovery and clean wrist/robe overlap. Reuse original rig/atlas; compare both sizes and natural x1 basic/signature/ultimate plus reduced motion, real main-hand socket and HP checks. Max3 repairs; scores only from visible improvement.

- [x] P20 [A6 correction] Boss atmosphere dispose must release each geometry/material exactly once, including motes, even if called twice. Reproduce the existing failing test, fix ownership cleanup, verify the existing second-dispose assertion and focused type/lint/tests. No gameplay/art change.

- [ ] P19 [auto] Lowest-score motion continuation: Sorrel staff tilts around its painted floor contact, with an open palm, slight head response and delayed tail; keep the long staff rigid and shoulder seams clean. Both sizes/natural x1 basic/signature/ultimate/reduced, true tip drift/socket/HP checks; max3 repairs.

Research refinements 11/11: P6 uses the saved49+6cast audit and33tests; complete missing parity and visual acceptance. P7 records before/after plus representative cast timing. P8 reuses existing concepts/VFX and only exports missing formats. P10 adds representative x2/x3/reduced-motion readability checks alongside requested x1films. Completed P1–P5 are unchanged. Rationale in RESEARCH-PUPPET.md/DECISIONS.md.

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

P6 complete 2026-11-10T17:50:04.179396+00:00: saved49+6casts/33tests reused and visually reviewed, exact sockets0error, canvas numbers/accessibility/reducedPASS; new5seed parityPASS. VFX audit8.1 self-review; P7 stage next.

P8 complete 2026-11-10T18:09:14.154961+00:00: accepted saved25unit formats/60skills, source/path checks and prior format-sheet review; UI crops/icons preserved,4full-body card fixes. Completed while P7 waits for A6 lease; P7 remains top unfinished.

P7 complete 2026-11-10T18:29:55.894769+00:00: saved6current-HUD captures/5casts accepted; warm fill, night crescent, enemy accents;19tests/parityPASS; warmedp95/max16.8ms. Stage8.0 self-review; P9 budget next.

P9 complete 2026-11-10T18:31:20.425804+00:00: current A6+B P7 actual38,140,486B, headroom1,859,514B; Bembedded23,545,868B incl retained assets. Integration manifest/flags/ownership published; P10film correction next.

P12 complete 2026-11-10T18:54:16.068996+00:00: saved controlled Soot pilot accepted; head/lantern/tail delayed follow-through,8paired poses/12x1casts incl reduced,21tests/parityPASS. Reordered prepared P12/P13 before P10/P11: boss film reveals hidden Binding Thread, so close composition and then capture the complete boss outcome; accepted normal film is retained.

P13 complete 2026-11-10T19:03:20.254644+00:00:20correct-viewport before/after views, both add faces visible across3bosses,0bounds/HP/UIerrors;25tests/type/lint/parityPASS; latestA6combined38,152,962B. P10 complete boss film running, normal85.49s accepted.

P15 complete 2026-11-10T19:21:37.791752+00:00:12actual phase3 views with3/4helpers across3bosses×2sizes; stable survivor lanes,0page/bounds/HPerrors; type/lint6tests/parityPASS; combined38,175,926B. Final boss film P10 next.

P10 complete 2026-11-10T20:05:27.602413+00:00: retained85.49s/9ult normal; corrected136.93s/13ult boss through visible Victory1.8s; four/three helpers clear,0page/faceHPerrors; saved12speed checks/posters reused. P11 report next.

P11 complete 2026-11-10T20:06:26.833444+00:00: report includes all25units, acceptedfilms, R0comparison limits, provenance,38175926B combinedbudget and honest8.225selfscore below8.5. Continue P14/P16; report is not a stop.

P14 complete 2026-11-10T20:07:29.667353+00:00: accepted saved16paired views/8naturalcasts, plantedhooves/horn dip/tail lag; type/lint19tests/parityPASS;38176310B. Spoolmotion7.5→7.7/overall7.6→7.7; no whole-roster score uplift. P16next.

P16 complete 2026-11-10T20:15:17.001198+00:00: attempt2 raises lantern0.06946units,16pairedposes/12casts/22tests/type/lint/parityPASS;38176938B; motion7.7/overall7.8. Initial loweringgesture rejected; savedbefore reused. P17next.
