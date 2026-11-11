# Taskbar Hero — Lane A6 quality report

The Lantern now has a warm cafe with a large illustrated crew, collectible rarity frames, a ten-card recruit ceremony, a lantern-street campaign and fully automatic battles with portrait HP/rage cards and character cut-ins. Bonds, formation, Power upgrades, campaign stars, idle tips, thirty Tower floors, daily gifts and capped read-only Fuji Relics remain available. All 25 battle units use B’s illustrated puppets. The Journal now opens four keepsake pages directly, with star gifts beside the notes and all claims/caps retained.

Open `docs/cardrpg-a6/index.html` directly; the ten-line [Vietnamese guide](../../docs/cardrpg-a6/CHAY-DEMO.md) gives a five-minute judging route. The **39,109,129-byte** artifact is below 40 MB. App opt-in: `?a6=1`. No deployment, PR merge or live contract change was made.

## Before and after

| Screen | Paired screenshots | Change |
|---|---|---|
| Cafe | [Before / after](comparisons/home.webp) | Large original cats, warm HUD, clear patrol action |
| Recruit | [Before / after](comparisons/recruit.webp) | Legendary art, rarity burst, readable nameplate |
| Map | [Before / after](comparisons/map.webp) | Winding lantern street, landmarks and star chests |
| Battle | [Before / after](comparisons/battle.webp) | Illustrated puppets, closer staging, HP/rage cards |

These pair retained screenshots without altering their contents. Review galleries grant progression for coverage; earned progression is measured separately. [LOOK-SCORES](LOOK-SCORES.md) averages **8.13/10** across eighteen screens at both sizes (1440×900 and1280×720), range **8.0–8.3**. All applicable rows meet7. Recent improvements include readable direct cat skills/previews, indexed Bond Book/Field guide, stable gear and gift actions, direct Journal pages, a contained save/reset desk, and selectable15px enemy tactics above Fight. Prepare scores **8.2/8.1**, Team and Bond Book **8.2/8.1**. P15 resolves the three-helper occlusion; B motion through P37 remains integrated. Scores are agent judgement, not player testing.

## Measurements and limits

| Evidence | Result | Assessment |
|---|---|---|
| 500 fresh seeds 60001–60500, run once | Normal/boss median **27.15 / 70.93 s** | Authored timeline; pacing bands met |
| Final simulation difficulty | First loss **10.37 min**; mean **3.52** losses; **45.8%** with 1–3 losses | Targets missed |
| Final simulation recovery / HP | **47.76%** recovery over 1,698 retries; normal-win HP **98%** | Targets missed |
| Final earned UI run, **1,800.70 s** | **26 wins / 2 losses**, zero errors/stalls; first loss **5.38 min** | Early losses remain |
| Final x1 browser timing | Normal **31.12 / 44.16 s** median/p90 (18); boss **90.35 / 184.70 s** (9) | Normal median passes; boss tail too long |
| Final UI rewards / HP | 58 rewards, gap **6.31 s** median / **189.95 s** max; normal-win HP **99%** | Median gap passes; HP misses |

Q13f used the prescribed three-attempt fallback. Enemy budgets stay fixed, so upgrades do not strengthen opponents. Two free formation changes led to successful next routes in the final UI run, but broad same-seed recovery remains weak. Some cats miss ultimate-frequency targets. Team variety and both seven-day economy cohorts meet their existing gates. The final seed block is not repeated or used for further numerical tuning.

## Verification and self-review

Final E2E was **420/421 initially**; a test-only readiness wait for idle accrual passed three focused repetitions. This is not a clean full-suite rerun. Q39 adds9Forecast lifecycle tests/final typecheck/lint; Q38 retains13advice lifecycle tests/typecheck/lint; Q37 retains nine Daily tests; prior 2005web tests pass after an inadvertently broad Q36 invocation (FIXLOG);5Relic tests retained;40puppet+2reward-feedback checks retained; Q34 retains five earlier touched tests. Q33 source claims retained4Campaign tests. The pre-integration web check passed2000tests after an inadvertently broad invocation (FIXLOG); no repeated full-suite run. Retained **2 Q22 dialog tests, 2 Q21 UI tests, 3 Q20 UI tests, 39 current puppet tests, 5 Q28 Settings tests, 9 Q27 guide/HUD tests, 6 Q26 Journal/Journey tests, 6 Q25 Tower tests, 3 Q24 Bag tests, 7 Q23 Daily tests, 12 Q19 UI tests, 13 Q18 web tests**, retained **19 earlier changed-area web tests** and **17 Journal rule tests** pass; earlier integration/phase/pacing checks are retained. The final gallery, actual-keyboard/reduced-motion checks and both-size offline checks report no browser errors, broken images, overflow or external requests.

[First session, 85 s](clips/first-session.mp4) is earned UI play. [Boss, 62 s](clips/boss.mp4) is a continuous automatic review fixture, including its 44.59 s battle, setup and Victory screen. Both clips and the final cut-in frame are inspected. These are headless Chromium observations, not human enjoyment testing.

| Self-review category | Weight | Score / 10 |
|---|---:|---:|
| Appearance | 30% | 8.13 |
| First ten minutes: clarity and flow | 20% | 7.5 |
| Battle readability, excitement and pacing | 20% | 7.8 |
| Difficulty and upgrade pull | 15% | 5.8 |
| Lane B art integration | 10% | 8.6 |
| Stability | 5% | 9.0 |

Weighted self-score: **7.67/10; target8.5 not met**. The main limitations remain early loss, unreliable advice recovery and long boss tails. Q14–Q39 source/offline delivery is complete through B P37. Q34 pairs companion art with an original receipt and a bounded three-page battle report. Its38source+42offlineviews verify exact-once rewards, replay/tutorial/Tower/advice/keyboard/reduced motion and corrected feedback expiry. Yarn framing is clear. Zero browser errors/network requests. Earlier final checks remain retained. Q35 adds a readable keepsake cabinet with36source/36offline views and exact read-only wallet/error/timeout guards. Q36 makes Bag costs/owners readable and resets stale detail scrolling;56source/28offline views and exact upgrade/transfer checks pass. Q37 makes Daily claims readable, shows honest blocked reasons and exact capped rewards;34 source/34 offline views pass. Q38 adds bounded8s advice, exact fallback costs and accurate cafe/Tower actions;28source/28offline views pass. Q39 makes foe/phase labels readable and bounds forecast waiting;52source/52offline views plus four boundary captures per build verify all13foes and unchanged Fight. Next: Tower floor/gift readability and later published B tips. Receipts: [Q39](Q39.md), [Q38](Q38.md), [Q37](Q37.md), [Q36](Q36.md), [Q35](Q35.md), [Q34](Q34.md), [Q33](Q33.md), [Q32](Q32.md), [Q31](Q31.md), [Q30](Q30.md), [Q29](Q29.md), [Q28](Q28.md), [Q27](Q27.md), [Q26](Q26.md), [Q25](Q25.md), [Q24](Q24.md), [Q23](Q23.md), [Q22](Q22.md), [Q21](Q21.md), [Q20](Q20.md), [Q19](Q19.md), [Q18](Q18.md), [Q14](Q14.md), [Q15](Q15.md), [Q17](Q17.md), [FIXLOG](FIXLOG.md).
