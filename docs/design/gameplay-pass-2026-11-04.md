# Gameplay pass design note
2026-11-04 · Candidate build, not live · References: reports/gameplay/RESEARCH.md (R1–R10), visual ART-BIBLE and approved UI redesign.

## Core loop and goal ladder
`Choose a class → watch automatic fights → receive acknowledged Fish/XP/materials/gear → compare offence vs survival → equip or save for a recipe → reach chapter gate → watch deterministic boss fight → chest / fair retry → next room`.

Always-visible goal horizons: **Now** inspect a genuine upgrade or clear the current round; **Soon** reach the actual chapter boss gate, acquire a key or finish cooldown; **Later** unlock the next room and collect the real Relic recipe. Never call a power wall “boss ready”. A goal routes to an existing action; no invented quests or daily pressure. Onboarding is a dismissible inline three-step coach for new guests only. No overlay, focus trap or disabled game input. Existing guests keep their dismissal. Manual Help remains available.

## First ten minutes (hypothesis; actual measurements in report)
| Minute | Intended experience | Honest boundary |
|---:|---|---|
| 0 | Pick Warrior/Guardian/Rogue, see expressive Mochi and first enemy, learn auto-battle. | No wallet requirement or forced tutorial. |
| 1 | Early acknowledged reward; open Bag, recognize slot and rarity shape. | Gear rolls remain random; starter is labelled starter, not a drop. |
| 2 | Compare offence vs survival, equip a real drop or inspect recipe cost. | Do not fabricate an affordable craft. |
| 3 | Watch elite windup/defeat, see chapter progress and next boss. | Ambient mouse cues grant no bonus; a combo feature is deferred. |
| 4 | See whether gear/class choice resolves a wall; save materials if not. | Recommendations describe their metric and limitations. |
| 5 | Attempt boss when gate/key allow; distinguish normal and heavy telegraphs. | Earlier practice cannot spend keys or grant rewards. |
| 6 | Clear result: victory, close call, perfect, or loss with key retained. | Result badges derive from replay HP; no invented dodge skill. |
| 7 | Inspect chest and compare new equipment, lock keeper. | No accidental salvage of locked/equipped gear. |
| 8 | Choose craft slot/rarity from real costs and guaranteed rarity. | No fake pity bar; bonus ranges disclose actual randomness. |
| 9 | Anticipation → impact → settle; special high-roll presentation if qualified. | Quality is descriptive, not a new loot outcome. |
| 10 | Know the next room/Relic ingredient goal; leave with honest idle cap. | Offline progress retains existing cap/efficiency. |

## Boss vocabulary
Default authoritative mechanics are regular attacks and periodic heavy attacks, with automatic stat-based dodge. Give each chapter a distinct household personality (vacuum suction, oven heat, bath splash, basement clutter, rooftop wind) through poses, labels and colour-safe markers. Windup is anticipation; the ground marker remains visible until the corresponding impact; heavy attacks use a double boundary and text. “Pressured” at low boss HP is presentation, not an invented damage multiplier. Default player input can skip playback, never alter its outcome.

Any new active dodge/shield/add/enrage rule must be isolated behind a default-OFF Sample, use no persistent economy, and not enter the verification path. Prefer finishing the real replay's readability over leaving a partially wired combat fork. A loss keeps the key and states the real cooldown. A perfect result means no HP lost in replay; close call means remaining HP at or below the configured fraction. These badges grant nothing.

## Item taxonomy and comparison
Preserve existing weapon types and nine equipment slots; no new items are justified yet. Weapon silhouettes: blade, maul, twin knives, spear, bow, staff, flasks. Wearables: cap, coat, mitts, boots, collar, earring, ring, charm. Use 3–4 tones per material and upper-left highlight. At 32px, silhouette takes priority over decoration. Rarity combines text, symbol and frame: Common dot; Uncommon triangle; Rare diamond; Epic four-point star; Legendary sunburst. Mythic is a labelled design sample only.

Selected gear shows up to three useful primary stats, with directional arrows against the actual equipped slot. Offence lens summarizes ATK and attack interval; survival lens summarizes HP/defence. Full bonuses follow in secondary detail. Recommendations are not a promise of victory: class passives, enemy matchups and bonus caps matter. Lock remains prominent, sorting/filtering retained, and new markers refer to unseen local inventory IDs. Ordinary gear cannot be marketed as a Relic. Relic art and name come from the existing /relics/{id}.json flow; display Cat Relic #id provenance without a contract change.

## Feel, resources and proof
Keep the approved dusk café shell. Coordinate attack anticipation/impact/recovery, 60ms cosmetic crit pause, ≤2 rendered-pixel shake, bounded particles and labels, chip HP trail and a short finite reward reveal. No repeated flash during reduced motion. Stop cosmetic clocks when hidden; never catch up a backlog of visual rewards. The global config owns new timing/cap thresholds. Capture real before/after screens, animation strips, a real ten-minute guest run and a five-minute performance soak. Self-scores are subjective and targets remain open unless actual evidence supports them.
