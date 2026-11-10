# Taskbar Hero — Lane A6 quality report

The Lantern now has a warm cafe with a large illustrated crew, collectible rarity frames, a ten-card recruit ceremony, a lantern-street campaign and fully automatic battles with portrait HP/rage cards and character cut-ins. Bonds, formation, Power upgrades, campaign stars, idle tips, thirty Tower floors, daily gifts and capped read-only Fuji Relics remain available. All 25 battle units use B’s illustrated puppets. The Journal now reads as a keepsake book, retaining every claim and daily cap.

Open `docs/cardrpg-a6/index.html` directly; the ten-line [Vietnamese guide](../../docs/cardrpg-a6/CHAY-DEMO.md) gives a five-minute judging route. The **38,371,409-byte** artifact is below 40 MB. App opt-in: `?a6=1`. No deployment, PR merge or live contract change was made.

## Before and after

| Screen | Paired screenshots | Change |
|---|---|---|
| Cafe | [Before / after](comparisons/home.webp) | Large original cats, warm HUD, clear patrol action |
| Recruit | [Before / after](comparisons/recruit.webp) | Legendary art, rarity burst, readable nameplate |
| Map | [Before / after](comparisons/map.webp) | Winding lantern street, landmarks and star chests |
| Battle | [Before / after](comparisons/battle.webp) | Illustrated puppets, closer staging, HP/rage cards |

These pair retained screenshots without altering their contents. Review galleries grant progression for coverage; earned progression is measured separately. [LOOK-SCORES](LOOK-SCORES.md) averages **7.95/10** across eighteen screens at both sizes (1440×900 and 1280×720), range **7.5–8.3**. All current applicable rows meet 7. Journal improved from 7.3/7.1 to **8.0/7.8**; P15 resolves the three-helper occlusion, bringing boss views to **8.2/8.1**. Field guide and Settings now score **8.0/7.8** and **7.9/7.8**, with current V5/rage/phase advice and verified x3/save transfer. Prepare (7.5 at 720p) is next. Scores are agent judgement, not player testing.

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

Final E2E was **420/421 initially**; a test-only readiness wait for idle accrual passed three focused repetitions. This is not a clean full-suite rerun. Current typecheck/lint, **13 Q18 web tests**, retained **19 earlier changed-area web tests** and **17 Journal rule tests** pass; earlier integration/phase/pacing checks are retained. The final gallery, actual-keyboard/reduced-motion checks and both-size offline checks report no browser errors, broken images, overflow or external requests.

[First session, 85 s](clips/first-session.mp4) is earned UI play. [Boss, 62 s](clips/boss.mp4) is a continuous automatic review fixture, including its 44.59 s battle, setup and Victory screen. Both clips and the final cut-in frame are inspected. These are headless Chromium observations, not human enjoyment testing.

| Self-review category | Weight | Score / 10 |
|---|---:|---:|
| Appearance | 30% | 7.95 |
| First ten minutes: clarity and flow | 20% | 7.5 |
| Battle readability, excitement and pacing | 20% | 7.8 |
| Difficulty and upgrade pull | 15% | 5.8 |
| Lane B art integration | 10% | 8.6 |
| Stability | 5% | 9.0 |

Weighted self-score: **7.63/10; target 8.5 not met**. The main limitations are early loss, unreliable advice recovery and long boss tails. Q14–Q18 source delivery is complete; continue the weakest-screen work and integrate later published B tips through the deadline. Q18 awaits the next offline package. Receipts: [Q18](Q18.md), [Q14](Q14.md), [Q15](Q15.md), [Q17](Q17.md), [FIXLOG](FIXLOG.md).
