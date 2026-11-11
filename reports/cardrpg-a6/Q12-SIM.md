# A6 simulation

500 seeds (1–500); 65.56 seconds.

| Gate | Measured | Target |
|---|---|---|
| G1 normal | 6 rounds; median 24.35 seconds; 90th percentile 33.59 seconds | 6–10 rounds; median 20–35 seconds; 90th percentile ≤45 seconds |
| G1 boss | median 76.91 seconds; 90th percentile 85.25 seconds | median 45–90 seconds; 90th percentile ≤110 seconds |
| G1 Tower | median 38.9 seconds; 90th percentile 45.83; floor medians 26.05–47.99 seconds | 20–50 seconds per floor |
| G2 ultimates | normal 50.4–69.17 percent; boss minimum 91.2 percent | each cat 35–70 percent normal; ≥90 percent boss |
| G3 first session | median gap 10 seconds; losses by 10 minutes: mean 0, worst 0; by 30 minutes: mean 0, worst 0; hint retry not observed (no losses) | gap ≤90 seconds; zero early losses; ≤2 total losses; retry wins ≥80 percent |
| G4 variety | 24 of 32 tested teams within five percentage points; highest top-20 cat presence 50 percent | ≥4 teams; no cat above 70 percent |
| G5 casual | daily progress 100 percent; Epic by day two 100 percent; pity budget by day six 100 percent; actual Legendary by day six 100 percent; idle cap 12 hours | daily progress; Epic by day two; regular pity by day six; idle cap 12 hours |
| G5 regular | daily progress 100 percent; Epic by day two 100 percent; pity budget by day six 100 percent; actual Legendary by day six 100 percent; idle cap 12 hours | daily progress; Epic by day two; regular pity by day six; idle cap 12 hours |

What this means: this compact run exposes pacing, first-session and economy gaps for iteration; simulated time does not establish browser performance or human enjoyment.

- Tower spreads 500 level-six, four-Epic fixture builds across thirty fixed floors; floor enemies and combat seeds remain fixed. Authored duration and per-floor summaries are separate from earned-player progress.
- G1 uses naturally earned first-session encounters, excluding the tutorial. Seconds are authored x1 timelines, excluding browser overhead; Q15 real-click timing is separate.
- G2 and G4 use level-six four-Epic fixtures with unlocked kits. New-player/economy accounts use earned public commands without fixture grants.
- Visible route points, earned boon choices and selected boons count as rewards alongside account currency, gear and Power.
- First-session defeats use the real recommendBuildV4/applyResultAdviceV4 hint. Same-seed retry is a counterfactual and grants no rewards.
- 32 fixed candidate teams (the four V5 crews plus evenly spaced mixed squads) each use every seed. This is not an exhaustive ranking of all 220 teams; tied top-20 teams use lexical order.
- Economy uses four-minute check-ins (at most one completed patrol), two or five per day; unfinished routes carry into the next visit. Epic means Epic or better.
