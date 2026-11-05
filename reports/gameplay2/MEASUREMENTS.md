# Measured gameplay evidence

Normal-clock receipts preserve all events/actions and both boundary gaps. Main rows count accepted positive claims; Sample rows count rewards or available choices. A scripted action is not a human judgment. Rules were frozen for all walks; final presentation fixes do not change these numbers.

| Loop / style / seed | First reward s | Max gap s | Gaps >8s | Changed/meaningful scripted choices | First boss s | Wins/attempts | Items found | End room |
|---|---:|---:|---:|---:|---:|---|---:|---:|
| before / idle / 11 | 10.050 | 30.199 | 21 | 1 | 300.158 | 0/1 | 3 | 1 |
| after / idle / 11 | 10.049 | 18.026 | 34 | 1 | 298.318 | 0/1 | 0 | 1 |
| sample / idle / 11 | 8.184 | 11.265 | 29 | 5 | 120.379 | 1/4 | 17 | 2 |
| before / active / 29 | 10.072 | 30.012 | 21 | 2 | 300.431 | 0/1 | 2 | 1 |
| after / active / 29 | 10.075 | 18.018 | 34 | 4 | 298.293 | 0/1 | 3 | 1 |
| sample / active / 29 | 0.847 | 15.822 | 28 | 96 | 112.102 | 3/4 | 25 | 4 |
| before / minmax / 47 | 10.052 | 30.163 | 21 | 3 | 300.493 | 0/1 | 2 | 1 |
| after / minmax / 47 | 10.049 | 18.013 | 34 | 5 | 298.331 | 0/3 | 3 | 1 |
| sample / minmax / 47 | 0.837 | 15.948 | 31 | 98 | 112.310 | 4/4 | 30 | 5 |

Sample active has one fight still running at the cutoff, so 3/4 is wins/attempts, not a completed-fight win rate. Main min-max logged three attempts but only one completed boss receipt; do not treat that as three completed defeats. Baseline modal-dismissal failures and unavailable craft attempts are retained, making the main action-count comparison weak. Counts above do not include autonomous journal updates as player decisions.

| Sample style | First visible decision s | First changed input s | Action systems touched | Not interacted with in the ten-minute policy |
|---|---:|---:|---|---|
| idle | 0.001 | 120.379 | boss, rooms | away, difficulty, encounters, forge, gear, journal, mastery, tours |
| active | 0.001 | 0.249 | encounters, gear, forge, boss, rooms | away, difficulty, journal, mastery, tours |
| minmax | 0.001 | 0.169 | mastery, encounters, forge, gear, boss, rooms | away, difficulty, journal, tours |

Idle receives finds and journal progress automatically, but its first chosen input is a boss attempt at 120s. Thus the visible-opportunity target passes; a literal first human/input decision within 60s is not demonstrated for idle. Return/tour/difficulty/journal screens are covered separately by focused walkthroughs and E2E.

## Five-seed balance

Seeds 11, 29, 47, 71, 101; each style simulates 1,200 seconds. These are deterministic model minutes, not more real-time browser play.

| Style | Room-one first-attempt wins | Room-two first-attempt wins | Room-two duration range s | Rooms reached |
|---|---|---|---|---|
| idle | 5/5 | 0/5 | 58–58 | 2, 2, 2, 2, 2 |
| active | 5/5 | 5/5 | 50–57 | 5, 5, 5, 5, 5 |
| minmax | 5/5 | 5/5 | 25–31 | 5, 5, 5, 5, 5 |

Min-max room-two duration and counter count demonstrate multiple cycles, not that a skilled human finds it hard. The unattended starter clears room one and stalls in room two; assistance does not erase the need to equip a new kit.

| Equal room-two Fine kit, one stitch | Hands-free wins | With counters + recovery Pounce | Active duration s |
|---|---|---|---|
| ember | 0/5 | 5/5 | 19–22 |
| moss | 3/5 | 5/5 | 42–49 |
| star | 0/5 | 5/5 | 42–49 |

Moss is a more forgiving build, not a guaranteed idle win: only 3/5 unattended equal-kit seeds clear room two. Star increases local patch income/quality; it is not a third distinct combat rotation.

## Observed power at room entry

| Style | Room | Time s | Damage/s | HP | Brace | Set |
|---|---:|---:|---:|---:|---:|---|
| idle | 1 | 0.00 | 25 | 307 | 35% | ember 2/4, moss 2/4 |
| idle | 2 | 144.93 | 25 | 316 | 35% | ember 2/4, moss 2/4 |
| active | 1 | 0.00 | 25 | 307 | 35% | ember 2/4, moss 2/4 |
| active | 2 | 125.52 | 22 | 321 | 47% | moss 4/4 |
| active | 3 | 289.33 | 29 | 340 | 51% | moss 4/4 |
| active | 4 | 464.22 | 35 | 356 | 55% | moss 4/4 |
| minmax | 1 | 0.00 | 25 | 307 | 35% | ember 2/4, moss 2/4 |
| minmax | 2 | 121.66 | 25 | 220 | 39% | ember 4/4 |
| minmax | 3 | 266.11 | 43 | 228 | 39% | ember 4/4 |
| minmax | 4 | 410.90 | 49 | 246 | 39% | ember 4/4 |
| minmax | 5 | 559.01 | 64 | 251 | 39% | ember 4/4 |

Full per-event reward/decision/dead-time logs: `timelines.json`; individual `before-*`, `after-*`, `sample-*` receipts. Full five-seed stats/actions/battles: `balance.json`. No human emotion, retention or independent grading is inferred from these files.
