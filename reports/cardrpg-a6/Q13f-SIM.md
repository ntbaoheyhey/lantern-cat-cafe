# A6 simulation

100 seeds (1–100); 42.26 seconds.

| Gate | Measured | Target |
|---|---|---|
| G1 normal | 7 rounds; median 33.44 seconds; 90th percentile 49 seconds | 6–10 rounds; median 20–35 seconds; 90th percentile ≤45 seconds |
| G1 boss | median 95.31 seconds; 90th percentile 122.21 seconds | median 45–90 seconds; 90th percentile ≤110 seconds |
| G1 Tower | median 31.19 seconds; 90th percentile 37.83; floor medians 18.39–40.58 seconds | 20–50 seconds per floor |
| G2 ultimates | normal 15.79–57.89 percent; boss minimum 78.95 percent | each cat 35–70 percent normal; ≥90 percent boss |
| G3 first session | first loss725.79s;1–3loss accounts70%;mean2.9/max5losses;one-fix retry48.23%;median gap10s | first loss12–20min;1–3losses;retry within2tries;gap<=60s |
| G4 variety | 30 of 32 tested teams within five percentage points; highest top-20 cat presence 40 percent | ≥4 teams; no cat above 70 percent |
| G5 casual | daily progress 100 percent; Epic by day two 100 percent; pity budget by day six 100 percent; actual Legendary by day six 100 percent; idle cap 12 hours | daily progress; Epic by day two; regular pity by day six; idle cap 12 hours |
| G5 regular | daily progress 100 percent; Epic by day two 100 percent; pity budget by day six 100 percent; actual Legendary by day six 100 percent; idle cap 12 hours | daily progress; Epic by day two; regular pity by day six; idle cap 12 hours |

What this means: this compact run exposes pacing, first-session and economy gaps for iteration; simulated time does not establish browser performance or human enjoyment.

- Tower spreads 100 level-six, four-Epic fixture builds across thirty fixed floors; floor enemies and combat seeds remain fixed. Authored duration and per-floor summaries are separate from earned-player progress.
- G1 uses naturally earned first-session encounters, excluding the tutorial. Seconds are authored x1 timelines, excluding browser overhead; Q15 real-click timing is separate.
- G2 and G4 use level-six four-Epic fixtures with unlocked kits. New-player/economy accounts use earned public commands without fixture grants.
- Visible route points, earned boon choices and selected boons count as rewards alongside account currency, gear and Power.
- First-session defeats use the real recommendBuildV4/applyResultAdviceV4 hint. Same-seed retry is a counterfactual and grants no rewards.
- 32 fixed candidate teams (the four V5 crews plus evenly spaced mixed squads) each use every seed. This is not an exhaustive ranking of all 220 teams; tied top-20 teams use lexical order.
- Economy uses four-minute check-ins (at most one completed patrol), two or five per day; unfinished routes carry into the next visit. Epic means Epic or better.
