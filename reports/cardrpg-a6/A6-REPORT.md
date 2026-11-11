# Taskbar Hero — Lane A6 quality report

The Lantern now has a warm cafe with a large illustrated crew, collectible rarity frames, a ten-card recruit ceremony, a lantern-street campaign and fully automatic battles with portrait HP/rage cards and character cut-ins. Bonds, formation, Power upgrades, campaign stars, idle tips, thirty Tower floors, daily gifts and capped read-only Fuji Relics remain available. All 25 battle units use B’s illustrated puppets. The Journal now opens four keepsake pages directly, with star gifts beside the notes and all claims/caps retained.

Open `docs/cardrpg-a6/index.html` directly; the ten-line [Vietnamese guide](../../docs/cardrpg-a6/CHAY-DEMO.md) gives a five-minute judging route. The **39,094,209-byte** artifact is below 40 MB. App opt-in: `?a6=1`. No deployment, PR merge or live contract change was made.

## Before and after

| Screen | Paired screenshots | Change |
|---|---|---|
| Cafe | [Before / after](comparisons/home.webp) | Large original cats, warm HUD, clear patrol action |
| Recruit | [Before / after](comparisons/recruit.webp) | Legendary art, rarity burst, readable nameplate |
| Map | [Before / after](comparisons/map.webp) | Winding lantern street, landmarks and star chests |
| Battle | [Before / after](comparisons/battle.webp) | Illustrated puppets, closer staging, HP/rage cards |

These pair retained screenshots without altering their contents. Review galleries grant progression for coverage; earned progression is measured separately. [LOOK-SCORES](LOOK-SCORES.md) averages **8.16/10** across eighteen screens at both sizes (1440×900 and1280×720), range **8.1–8.3**. All applicable rows meet7. Recent improvements include readable direct cat skills/previews, indexed Bond Book/Field guide, stable gear and gift actions, direct Journal pages, a contained save/reset desk, and selectable15px enemy tactics above Fight. Prepare scores **8.2/8.1**, Team and Bond Book **8.2/8.1**. P15 resolves the three-helper occlusion; B motion through D0/P40 remains integrated. Scores are agent judgement, not player testing.

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

Final E2E was **420/421 initially**; a test-only idle-accrual readiness repair passed three focused repetitions, not a full-suite rerun. Q47 passes **18 focused HUD/log/phase tests and web typecheck/lint**; Q45 retains 20 awakening/companion/growth and 13 B effects tests; Q43 retains 47 Settings/puppet tests and Q42 ten guide/HUD tests. Earlier changed-area checks and the prior 2,005-test web pass remain recorded in item receipts and [FIXLOG](FIXLOG.md). Recent browser checks verify exact public transactions, caps, locks, bounded forecasts/advice, keyboard, reduced motion and direct-file operation at both sizes, with no observed browser errors or external requests.

[First session, 85 s](clips/first-session.mp4) is earned UI play. [Boss, 62 s](clips/boss.mp4) is a continuous automatic review fixture, including its 44.59 s battle, setup and Victory screen. Both clips and the final cut-in frame are inspected. These are headless Chromium observations, not human enjoyment testing.

| Self-review category | Weight | Score / 10 |
|---|---:|---:|
| Appearance | 30% | 8.16 |
| First ten minutes: clarity and flow | 20% | 7.5 |
| Battle readability, excitement and pacing | 20% | 7.8 |
| Difficulty and upgrade pull | 15% | 5.8 |
| Lane B art integration | 10% | 8.6 |
| Stability | 5% | 9.0 |

Weighted self-score: **7.67/10; target 8.5 not met**. Early loss, unreliable advice recovery and long boss tails remain the largest limits. Q14–Q47 delivery is complete through B D0/P40. The latest guide and save-desk updates preserve all 75 notes, battle pause/focus return, exact save roundtrip/reset, comfort preferences and replay. Their 56 source/56 offline views and six Pantry Crown framing views are inspected. Earlier final seed/run/E2E evidence is retained.

Detailed receipts: [Q44 Companions](Q44.md), [Q43 Settings](Q43.md), [Q42 Field guide](Q42.md), [Q41 Journal](Q41.md), [Q40 Tower](Q40.md), [Q39 Forecast](Q39.md), [Q38 Advice](Q38.md), [Q15 final check](Q15.md), [complete queue](QUEUE.md). Q44 adds 52 inspected source and 52 offline companion views with readable training costs, bounded roster scrolling and all twelve current skill descriptions. [Q45 Awakening](Q45.md) adds exact cost/gain and blocked-reason preview, with 32 accepted source/32 offline views and six Soot framing views. The user has directed B to real 3D; D0/P40 is integrated as temporary fallback while A6 awaits the published lookV3D contract.

[Q46 Battle HUD](Q46.md) adds readable HP/rage, accurate level-or-stars unlock and fallen state, and 44px actions within the original canvas envelopes; 26 source/22 offline views inspected.

[Q47 Battle log](Q47.md) replaces the blank/scrolling overlay with a readable notebook, pauses playback and restores focus/state;14 source/14 offline views inspected. B D1 docs-only production research is integrated.
