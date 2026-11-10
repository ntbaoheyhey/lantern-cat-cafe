# Taskbar Hero — Lane A6 quality report (draft)

The Lantern now has a warm cafe with a large illustrated crew, collectible rarity frames, a ten-card recruit ceremony, a lantern-street campaign and automatic battles with portrait HP/rage cards and character cut-ins. Bonds, formation, Power upgrades, campaign stars, idle tips, the 30-floor Tower, daily gifts and capped read-only Fuji Relics remain available. All 25 battle units use lane B’s illustrated puppets. No new game system, deployment, PR merge or live contract change was made.

Open `docs/cardrpg-a6/index.html` directly; the accompanying ten-line [Vietnamese guide](../../docs/cardrpg-a6/CHAY-DEMO.md) gives a five-minute judging route. Current artifact: **38,365,845 bytes / 40 MB**. Live app opt-in: `?a6=1`. The final artifact will be rebuilt after the published boss-helper repair is integrated.

## Before and after

| Screen | Paired screenshots | Visible change |
|---|---|---|
| Cafe | [Before / after](comparisons/home.webp) | Large original cats, warm HUD and clear patrol action |
| Recruit | [Before / after](comparisons/recruit.webp) | Full-screen Legendary art, rarity burst and clear nameplate |
| Map | [Before / after](comparisons/map.webp) | Illustrated winding street, landmarks, boss art and star chests |
| Battle | [Before / after](comparisons/battle.webp) | Illustrated puppets, closer staging, HP/rage portrait cards |

These are retained screenshots, paired without changing their contents. Review galleries use granted progress for coverage; they are separate from earned progression. [LOOK-SCORES.md](LOOK-SCORES.md) records both target sizes (1440×900 and 1280×720). Scores are agent judgement, not player testing. Journal (7.3/7.1) is the next visual polish target; three-live-helper visibility remains provisional until the published B P15 repair is checked in A6.

## What the measurements show

| Evidence | Result | Limit |
|---|---|---|
| Final simulation, 500 fresh seeds 60001–60500, run once | Normal/boss median **27.15 / 70.93 s**; 10 s median reward gap | Authored timeline, not browser time |
| Final simulation difficulty | First loss **10.37 min**; mean **3.52** losses; **45.8%** of accounts have 1–3 losses | First loss and loss count miss their targets |
| Final simulation recovery | **47.76%** same-seed hint recovery over 1,698 retries; normal-win HP median **98%** | Recovery and 20–60% HP targets missed |
| Browser pacing, Q13g | 10 normals: **22.13 s** median; 3 bosses: **77.33 s** | p90: 44.16 / 84.52 s; tutorial/lease crossings excluded |
| Same boss before / after pacing fix | **124.61 → 88.49 s**, unchanged 17 rounds, winner and HP | Paired fixture, not a population estimate |
| Final 30-minute UI run | In progress; retained browser/account and recording | Headless Chromium, real UI clicks, x1; no granted progress |

Q13f ended under the prescribed three-attempt fallback. Enemy budgets remain fixed; upgrades do not strengthen opponents. Earlier real UI play recorded 21 wins / 2 losses and two successful next-route fixes, but first loss at 6.59 minutes. The current misses remain explicit. The fresh final seed block is not being repeated to improve its reported result.

## Verification and remaining work

Full final E2E: **420/421 initially**. The failing idle test advanced its fake clock before the UI timer mounted; a test-only readiness wait passed three concurrent repetitions. This is not represented as a clean 421-test rerun. Integration has 43 passing focused tests; phase/HUD verification has 14; pacing has 8, with typecheck/lint passing for their changes.

The final 36-screen gallery and keyboard/reduced-motion checks at both sizes are inspected: no browser errors, broken images or horizontal overflow. The offline file passes at both sizes with HTTP(S) blocked and zero network attempts. Final UI results and two 60–90-second clips are pending. B P15 is published; its merge, affected visual review and offline rebuild follow the frozen run.

| Self-review category | Weight | Score / 10 |
|---|---:|---:|
| Appearance | 30% | Pending final integration |
| First ten minutes | 20% | Pending final run |
| Battle clarity and pacing | 20% | Pending helper visibility |
| Difficulty and upgrade pull | 15% | Partial; misses above |
| Lane B integration | 10% | Pending P15 check |
| Stability | 5% | Pending final run |

Target: 8.5. Final total remains pending. Detailed receipts: [Q14](Q14.md), [Q15](Q15.md), [FIXLOG](FIXLOG.md). This report is not yet the Q16 completion.
