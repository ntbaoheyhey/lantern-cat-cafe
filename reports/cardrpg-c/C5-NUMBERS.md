# A6 simulation

250 seeds (70251–70500); 169.87 seconds.

| Gate | Measured | Target |
|---|---|---|
| Normal duration | 34.5s median / 46.24s p90 | 20–35s median |
| Boss duration | 69.16s median / 82.16s p90 | 45–90s median; p90<=110s |
| First loss | 11.61min among accounts with losses; 17/250 never lose | 12–20min |
| Loss count | 88% have1–3 in30min | >=60% |
| Hint recovery | 83.67% / 398 retries | >=70% |
| Normal win HP | 94% median | 55–80% |
| All12cat ultimates | 1–1 median casts; 74.19–96.36% each have1–2 | 1–2casts per normal |
| Team variety | 30/32 within5points; top20maxpresence40% | >=4near-best; no cat>70% |

What this means: this compact run exposes pacing, first-session and economy gaps for iteration; simulated time does not establish browser performance or human enjoyment.

- Tower spreads 500 level-six, four-Epic fixture builds across thirty fixed floors; floor enemies and combat seeds remain fixed. Authored duration and per-floor summaries are separate from earned-player progress.
- G1 uses naturally earned first-session encounters, excluding the tutorial. Seconds are authored x1 timelines, excluding browser overhead; Q15 real-click timing is separate.
- G2 and G4 use level-six four-Epic fixtures with unlocked kits. New-player/economy accounts use earned public commands without fixture grants.
- Visible route points, earned boon choices and selected boons count as rewards alongside account currency, gear and Power.
- First-session defeats use the real recommendBuildV4/applyResultAdviceV4 hint. Same-seed retry is a counterfactual and grants no rewards.
- 32 fixed candidate teams (the four V5 crews plus evenly spaced mixed squads) each use every seed. This is not an exhaustive ranking of all 220 teams; tied top-20 teams use lexical order.
- Economy uses four-minute check-ins (at most one completed patrol), two or five per day; unfinished routes carry into the next visit. Epic means Epic or better.
