# Lane C queue

- [x] C0 Setup + carryover (<= 60 min): section 1.
- [x] C1 Gap research (<= 60 min, RESEARCH-C.md <= 2 pages, words only): Spine web runtime choice for our renderer; how layered Live2D/Spine characters are integrated in top 2D side-view hero battlers; painted-style 2D skill VFX techniques and budgets; difficulty curves of top idle/hero battlers (first loss timing, retry loops). Skip what A6/B research already covers.
- [x] C2 Contract + slots + intake (by 12 Nov 06:00 UTC): 2.2 + 2.3, DESIGNER-QUEUE.md + DESIGNER-QUEUE-VI.md (pilot Mochi; wave 1 = other 2 demo cats, 2 common demo enemies, Yarn Giant; wave 2 = remaining cats; wave 3 = remaining monsters/bosses) with concept/PSD paths, role, tier/size, skills shown.
- [x] C3 Spine runtime + 2D stage (by 12 Nov 20:00 UTC): 2.1, lookSpine, fallback chain, sockets, event wiring, unit tests + Playwright battle test at both sizes.
- [x] C4 Placeholders 25/25 (by 13 Nov 12:00 UTC): 2.4(a); all pass the validator; lineup.webp on the 512 grid; size tests (node: heights per tier; Playwright: on-screen cats equal +-8%, cat >= 22% of canvas height, boss <= 55%). Then 2.4(b) per character as PSDs appear (repeat item).
- [x] C5 Gameplay difficulty + boss tail (by 14 Nov 12:00 UTC): 2.6 numeric targets; up to 3 tuning rounds, then pick the simplest fallback, publish remaining misses honestly. Finished3rounds; PARTIAL firstloss11.61min/normalHP94%/ult consistency; seeC5-RECEIPT.
- [x] C6 Skill VFX pass 1 (by 15 Nov 12:00 UTC): 2.5 for every skill/ult/status; VFX gallery page docs/cardrpg-c/vfx.html (each effect looping on a placeholder unit, x1).
- [x] C7 A6 leftovers + first ten minutes (by 16 Nov 06:00 UTC): A6 Q55 (legacy Bag portrait containment), Q56 (Bag material-card contrast), then 2.6 first-ten-minutes work; HUD on sockets 2.7.
- [ ] C8 Designer intake (continuous; initial checkpoint complete, final exports absent; see C8-RECEIPT): validate, integrate, acceptance sheet, Vietnamese feedback, before/after poster (placeholder vs designer), retime that unit's VFX to its events.
- [x] C9 VFX pass 2 + stage polish (by 17 Nov 20:00 UTC): ult cut-ins with the unit's portrait, backdrop cleanup, warm tint/vignette, boss phase change presentation, entrance moves.
- [x] C10 Demo (complete 11 Nov, repeat-update): static docs/cardrpg-c/index.html + CHAY-DEMO.md (Vietnamese, <= 10 lines) + `pnpm` local run note; lineup, each unit's animations, recorded normal and boss fight at x1, placeholder vs designer where available; total demo <= 40 MB.
- [ ] C11 Quality pass from real screenshots (until report): score every screen and the battle at both sizes; fix the lowest first.
- [ ] C12 Report (20 Nov 06:00 UTC): C-REPORT.md (before/after, numbers, self-score, designer-made vs placeholder units, known limits), STATUS-VI.md; then keep improving the lowest item until 20 Nov 12:00 UTC.
Missed time box: PARTIAL in DECISIONS.md, finish the current step, move on. Never stop the lane for a miss.

