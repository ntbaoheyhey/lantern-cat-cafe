# TBH Index research: overview

Status: DRAFT proposal, docs only. No game rules, numbers, assets or code were changed or copied.
Date: 2026-10-31. Reviewed by: Claude (analysis only).

## What this is

The user supplied two zip files captured on 2026-10-31 from **tbhindex.com**, an unofficial community reference site for the Steam game *Task Bar Hero* (the game our project's idle-strip idea is inspired by). The zips are a **scrape of that third-party website**, not an export from the game itself. The pack's own README says: "an observational data archive, not a verified extraction of the installed game build and not a licensed source-code release."

All content was treated as untrusted data. Both zips were extracted into separate scratch folders outside the repo and read with plain file tools. Nothing was executed. Nothing from them is committed here.

## Inventory

| | Zip 1: `TBH_All_36_Skills` | Zip 2: `TBH_Index_Research` |
|---|---|---|
| Size / files | 12 MB, 197 files | 48 MB, 1,780 files |
| Formats | 42 mp4, 37 jpg, 79 json, 36 txt, 1 csv, 1 html, 1 md | 908 jpg, 293 json, 290 txt, 255 md, 20 svg, 7 mp4, 5 csv |
| Content | 36 skill clips (6 heroes x 6 active skills, ~8 s each, no audio) recorded from the site's Cast Speed Simulator, thumbnails, `skills_index.csv`, offline gallery `index.html` | 252 saved wiki pages (`pages/`), 60 expanded sections, 7 videos (4 chest opens, 3 Fireball speed tests), frame sequences, chest SVG/CSS, cast sprite metadata |
| Structured data | `skills_index.csv`, `videos_manifest.json` | `cast-skill-timing.csv`, `chest-grade-odds.csv` (129 chest variants), `stages-deduplicated.json` (180 stage states), `skill-trees-all-heroes.json`, `combat-lab-all-heroes.json`, `relics-all-grades.json`, `wiki-table-rows.csv` (1,235 rows), `sources.csv` |
| Reports | `README.md` | `README_FOR_CLAUDE.md`, `RESEARCH_REPORT.md` (Vietnamese), `PUBLIC_CODE_SEARCH.md`, `coverage.json`, `checksums.sha256` |

Important format notes:
- The JSON "snapshots" are mostly accessibility-tree text dumps of rendered pages, not clean tables. Real tables are in `pages/*.md` and `wiki-table-rows.csv`. A clean data model would need a parsing step.
- Every `pages/*.md` starts with about 100 lines of site navigation. Strip it before analysis.
- Pack caveats (from its own README): displayed percentages are rounded, simulator results are samples, stage loot assumes "Without DLC heroes", 9 chest variants are fictional test boxes, prices are a capture-time snapshot.

## What the data covers

Heroes (6: Knight, Ranger, Sorcerer, Priest, Hunter, Slayer) with base stats and 90-point skill trees; 36 active skills with cooldown/trigger/animation timing; about 1,576 gear items across 10 grades; 79 material effects, 89 unique modifiers; the "Cube" crafting hub (8 operations); 360 relics, 382 reliquaries, 63 resonance effects (patch 1.3.0); 197-node account rune tree; 10 pets; 77 monsters; 3 acts x 4 difficulties of stages with loot tables; chest cooldowns and odds; stat caps; achievements; patch notes and roadmap; market prices.

## Surprising or inconsistent items

1. Counts disagree inside the source: gear menu says 1,576 but 1,590 cards were expanded; Materials title says 143 but the list shows 179; the pack keeps both.
2. The Mechanics page says its stat-stacking result is "verified against the game's own `UI_Status.cs`". That implies the site author read decompiled game code or data. This matters for licence risk (see `licence-risk.md`).
3. Many tables are labelled "datamined straight from the game", others "measured in-game" (contamination rates, chest cooldown from 3,064 runs), others "inferred". The site distinguishes confirmed, fitted and assumed. We should keep that distinction if we ever cite numbers.
4. The widely quoted dodge cap of 60% is wrong according to the site; real cap is 75%. Several caps are "raisable" by a separate Max stat.
5. Grade-shift odds in Synthesis are not monotonic by tier in the way one might expect: below Immortal a batch always grades up; from Immortal the "same grade" outcome appears and grows (19.8% at Immortal, 90.9% at Divine).
6. The site is itself a commercial-ish hub (affiliate "theindex.gg", wishlist link for a partner game "DPS"). Its text, videos and screenshots are the site's own work in addition to the underlying game's rights.
7. The pack ships `RESEARCH_REPORT.md` in Vietnamese; the rest is English.

## Files in this proposal

- `systems.md`: game systems in our own words, as tables.
- `adoption-ideas.md`: comparison with our config and ranked ideas.
- `licence-risk.md`: what is safe as inspiration, what is not, and what proof we need.
