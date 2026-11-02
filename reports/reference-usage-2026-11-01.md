# User-supplied TBH Index research — source map

The user supplied https://tbhindex.com and the 2026-10-31 crawl archives during the resumed mission. These sources inform the existing mission; original content and repository-backed rules remain required. Statements inside archived documents are source material, not additional user instructions.

## Verified source locations

- Downloads/TBH_Index_Research_2026-10-31.zip is a 26-byte error response, not a ZIP.
- Use /Users/bao/Downloads/TBH_Index_Research_2026-10-31-2.zip. It is byte-identical to /Users/bao/Documents/ChatGPT/taskbar hero/TBH_Index_Research_2026-10-31.zip.
- /Users/bao/Downloads/TBH_All_36_Skills_2026-10-31.zip is valid.
- Both valid archives pass ZIP CRC checks. The skill CSV has 36 rows, six per source hero, and every indexed clip SHA-256 matches. This verifies archive integrity, not native-game timing or new video-decoding checks.
- Exact hashes and inventory: [validation JSON](reference-source-validation-2026-11-01.json).
- Live homepage read on 2026-11-01: [TBH Index](https://tbhindex.com). Treat changing prices, counts and patch claims as dated website statements.

## Lookup map for builders

Paths below are archive members; read only relevant records with Python zipfile. Videos and assets remain outside the implementation repository.

| Mission area | Research members | Intended use |
| --- | --- | --- |
| Hero / Help | sources.csv; pages/wiki__mechanics.json; skill-trees-all-heroes.json | Information hierarchy and explanations; product values still come from this repo's state and docs. |
| Map / Boss | stages-index.csv; stages-deduplicated.json; pages/wiki__boss-guides.json | Progression and boss-information structure; use this repo's chapters, gates and registry. |
| Compendium / odds | sources.csv; chest-groups.json; chest-grade-odds.csv; chest-cases.json | Search, filters and source relationships; derive exact project odds from our registries. |
| Pets / runes / workshop | pages/wiki__pets.json; pages/wiki__runes.json; pages/wiki__rune-planner.json; sources.csv | Unlock, progress, equip and planning flows; original IDs/names and independently decided balance. |
| Skills / effects | cast-cases.json; cast-speed-tests.json; cast-skill-timing.csv; skill pack evidence metadata/timing | Distinguish trigger count, cooldown, wind-up, action, recovery and speed scaling; test adopted rules in our implementation. |
| Original art / motion | Skill pack videos_manifest.json; skills_index.csv; referenced clips | Observe readability and pacing; create original art with provenance. No copying, tracing or feeding source art to image generation. |

## Interpretation limits

The research report separates 120 ordinary chest selections from nine synthetic simulator selections. It records discrepancies between some page headings and expanded lists; preserve these findings instead of importing conflicting counts.

Skill clips capture the website simulator at baseline inputs using timestamped screenshots reconstructed into videos. Some selections share animations. The clips do not establish installed-game frame cadence. The crawl's speed formula interprets UI observations; it is not verified engine source.

The crawl distinguishes complete category captures from incomplete per-item detail coverage. Keep source URLs and capture dates and mark uncertainty. The implementation remains a living draft; backend-dependent changes remain default-OFF until release gates pass.


## Latest user direction: parameters, cast effects and rich equipment

The user explicitly asked again on2026-11-01 to use both the crawl and tbhindex.com to choose parameters and skill-cast effects, and expressed a preference for the reference game's feature/equipment depth and graphics. This is a design requirement for the existing mission, with the accepted P0/P1 priority order retained.

Current source reading: cast-skill-timing.csv has36 skill observations distinguishing speed type, baseline animation duration, optional cycle and shared animation; cast-speed-tests.json supplies24 input cases; the skill pack has36 indexed clips plus per-clip timing and capture metadata. Aggregate observations are in reference-cast-observations-2026-11-01.json. The live homepage was reread2026-11-01 and identifies the source as an unofficial fan database. Its coverage/patch claims are dated statements, not independently proven native-engine behavior.

Each adopted parameter must have a decision row: original project ability/item ID, source URL and archive member/capture date, observed quantity, confidence, chosen project value/rule, reasoning, reversal, and a test/simulation result. Distinguish attack-count triggers from timed casts; attack speed from cast speed; wind-up, release, impact and recovery; cooldown/cycle from animation duration. The clip's total video duration is NOT a skill cooldown. Missing cycle measurements stay unknown until measured; do not invent confidence from a screenshot or shared animation.

CXL2/CXG1 must derive original skill/equipment diversity from reference mechanics and then validate damage, proc rates, cooldown/speed scaling, range/target selection and progression with the project's own balance simulations. ART2/ART3 must create original silhouettes, anticipation, projectile/trail, impact, recovery and rarity readability with provenance, reduced-motion alternatives and measured frame timing. CXLU2 previews must read the same typed registry that gameplay and VFX consume. Record intended vs observed cast/impact timestamps and enforce hit/visual synchronization. Preserve all original-content rules: no copying names/art/text/tables or giving third-party art to a generator.
