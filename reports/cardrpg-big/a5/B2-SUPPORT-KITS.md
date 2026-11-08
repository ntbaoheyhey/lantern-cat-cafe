# A5 B2 — support kits after removing energy

Status: read-only TRAIN diagnosis; no support kit adopted.

The registered probe replays 1,088 common-fixture cells, covering every triple with Sorrel, Inkcap or Cinnamon across eight scenes and TRAIN seeds 1–50. All 54,400 outcomes equal the original receipt; first-seed full replays also match. Each cat appears in 22,000 battles. These cohorts overlap.

|Cat|Win rate|Actions|Most used skill|Uses|Battles containing a fall|
|---|---:|---:|---|---:|---:|
|Sorrel|52.31%|339,514|Cold brew|183,109|12,900|
|Inkcap|54.47%|301,843|Ink thread|222,930|11,897|
|Cinnamon|83.63%|403,323|Comfort cup|286,445|4,177|

Cinnamon uses Comfort cup in 71.02% of its actions. It has no cooldown. Removing energy costs therefore permits immediate 80-point healing plus Cozy on consecutive own turns. That is a candidate explanation for sustained rescue strength, not yet a causal effect on wins. Clean apron appears 64,202 times and its one-time revival 4,835 times. A prospective trial will add one intervening own turn to Comfort cup while preserving its rescue amount, cleanse and revival identities.

Inkcap uses Quiet spores 11,392 times and Paper decoy 802 times. Quiet spores targets `foe`, which prevents suppression of an unmarked rear healer or summoner while a front enemy remains. A separate trial will allow that suppression skill to reach any living foe; it will not change damage, resistance or the evaluator. Low use alone does not establish that more use would help.

Sorrel uses Decanted moon 6,920 times. Its 413,037 shield events total 6,226,044 shield and its 214,244 heal events total 5,594,309 HP. Those totals include multiple skills, gear and status ticks; they do not isolate transfer or justify increasing it. No Sorrel change is selected from these counts.

Every count comes from [audited summary](b2/support-kit-probe-08/summary.json) and [raw results](b2/support-kit-probe-08/results.json), under the [pre-run registration](b2/support-kit-probe-08/REGISTERED-METHOD.md). Fell-in-battle includes cats later revived. Counts are descriptive, not ablated win contributions. No acceptance seeds, production changes or human-playtest claim.

## Rescue cooldown trial10

The registered rescue-rest arm completes all1,840cells/92,000TRAIN outcomes. Cinnamon falls83.63%→74.70% (474paired improvements/2,438worsenings in22,000Cinnamon battles), but selected-crew advantage rises31.00→33.25pp. Soot falls44.16→41.42%, Sorrel52.31→50.31% and Inkcap54.47→52.86%. Every cat still has a top-pick cell; the aggregate cat/set/crew gates remainMISS. The same best crew is selected before and after. A bounded rescue cooldown fits Cinnamon’s own range but does not close team balance, so it is not adopted alone.

[Independent paired audit](b2/support-kits-10/rescue-rest/summary.json) · [all cells](b2/support-kits-10/rescue-rest/results.json). Quiet-reach continues separately on the unchanged registered source. No fresh acceptance or production change.

## Rear suppression reach trial10

The independent quiet-reach arm completed all 1,840 cells. Inkcap falls 54.47%→53.22% (44 paired improvements, 320 worsenings). The detailed rates and every negative pair are in [the audit](b2/support-kits-10/quiet-reach/summary.json). Crew advantage remains 31.00pp. Rear reach alone is not adopted. This trial retains the original resolver that turns a Hushed heal/shield signature into damage; the separately registered suppression15 correction tests that cause without combining this reach change.

## Semantic kit fixture14

The prospectively declared assignments complete all 1,840 cells / 92,000 TRAIN outcome entries. The 3,200 homogeneous-set controls remain exact. The original starter budget, enemies, AI and skills stay fixed. This is a fixture diagnostic, not a kit change in the game or acceptance revision.

|Cat|Original role gear|Declared eligible gear|
|---|---:|---:|
|Mochi|71.83%|75.08%|
|Soot|44.16%|54.03%|
|Clover|60.81%|64.14%|
|Panko|68.63%|75.92%|
|Mallow|63.82%|70.21%|
|Sorrel|52.31%|56.25%|
|Biscuit|71.54%|74.36%|
|Inkcap|54.47%|56.50%|
|Cinnamon|83.63%|86.40%|
|Brioche|61.05%|64.62%|
|Velvet|66.10%|68.60%|
|Marigold|72.69%|75.10%|

Soot improves 3,427 paired cases and worsens 1,255, still below55%; Black cup remains unused. Crew advantage drops31.00→26.75pp, still above25%; the selected crew stays Mallow/Biscuit/Cinnamon. Every scene has at least four triples within5pp, but best teams remain saturated. Cat and set ranges still miss. Do not attribute a cat's whole gain to its own gear: allied assignments also changed.

[Registration](b2/kit-fit-14/REGISTERED-METHOD.md) · [all paired results](b2/kit-fit-14/summary.json). The fixture retains the original harmful Hush resolver; no suppression correction or Cinnamon cooldown is combined here.

## Eligible-kit and rescue-rest interaction17

Both prospectively registered arms completed all 1,840 TRAIN1–50 cells. They share kit14's eligible gear assignments and the Hush utility-turn correction15; only the rest arm adds trial10's one intervening turn between Comfort cups. Their original source, fixed eight scenes and all five comparison sources remain in [the paired audit](b2/eligible-suppression-17/comparison.json).

|Measure|Eligible kit + Hush|Same + rescue rest|Target|
|---|---:|---:|---|
|Soot|57.25%|55.17%|55–75%|
|Sorrel|57.78%|56.09%|55–75%|
|Inkcap|60.40%|58.95%|55–75%|
|Cinnamon|87.13%|79.76%|55–75%|
|Selected-crew advantage|26.00pp|27.50pp|10–25pp|
|Near-best distinct crews, minimum over eight scenes|38|27|At least 4|

Rescue rest changes 393 team battles from loss to win and 2,014 from win to loss, all in the Cinnamon-containing comparisons; these overlap the per-cat aggregates and must not be counted again. Cinnamon remains above75%; Mochi, Panko and Biscuit also remain above75%. All eight homogeneous set aggregates are identical between the two arms; three remain below35%, and several declared niches still lack a valid carrier. Every scene's best team remains100%, limiting the diversity result.

Do not adopt the cooldown or call this balance closure. Correcting kit eligibility and suppression explains part of the bottom-cat gap, while this cooldown does not meet the full cat/crew targets. This diagnostic uses the original common-fixture runtime plus guard/Hush15, not anchored60 or the later Hush-credit22 correction. Those combinations and fresh acceptance remain unmeasured; no new samples were run for this report.
