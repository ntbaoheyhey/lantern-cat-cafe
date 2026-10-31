# Rune and Skill Lab (static demo)

Open `index.html` in any browser (double-click). One file, no network, no build. Fonts fall back to system fonts.

**All numbers, names and glyphs are DEMO placeholders, not game rules.** Copy no numbers; original art only. Real values need sign-off (`../design.md` section 6). Planned art: `../art/MANIFEST.md`.

Top bar: level +/- (changes points available), Pause animation, 1280/1600 viewport size.

| Screen (left rail) | Mechanic it shows | Try this | Design |
|---|---|---|---|
| Skills | Active skills: rank 1-5, cooldown, per-hit and total damage, animated effect preview, tags, synergy | Pick a skill, click ranks, drag the CDR slider (cap 75%) | design.md s2, s5 |
| Passives | 3 paths x 4 tiers, a tier opens after N points on that path, free refund | Add points to Claw until tier 2 opens | s2, s3 |
| Runes | Socket runes in gear, upgrade 3 to 1 with shown odds and mercy (a failure returns a rune), fuse two types into a twin rune | Select a rune, click a socket, then upgrade | s2, s3, s6 |
| Drops | Per-chapter loot tables, exact odds and "1 in N", seeded simulator with 95% band, dry-streak counter (no pity) | Run 1000 kills on chapter 3 | s5, s6 |
| Stages | Chapters, monsters, elite, boss; stepped reward table beside the smooth curve | Compare the two columns | s2, s6 |
| Gear | Rarity ladder, bonus line roll ranges, stat-stacking formula and caps | Change rarity and re-roll | s5 |
| Pets | Companions unlock by hunting goals, treats level them, equip two, passive bonuses only | Feed a treat, equip | s2 (Pets in) |
| Workshop | Shared crafting level, ladder of unlocks, public 9-to-1 blend odds | Run a blend | s2, s6 |
| Quests | Quests, achievements, events; small Rune Dust / Etch Ink rewards | Claim a quest | s6 (if time) |
| Codex | Search every entry; links jump between entries | Search "purr" | s2 |
| Planner | Two builds side by side using the published formula | Switch class, edit both builds | s5 |
| Notes | Coverage, what changed vs the reference, items needing sign-off | Read the table | s6 |

Mapping to code: see `../design.md` section 3 (data model sketch) and section 4 (how it maps onto `packages/game-rules` without changing it).
