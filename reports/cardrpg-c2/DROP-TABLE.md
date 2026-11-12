# B4b — source audit (before tuning)

Audited C2 at B2 HEAD3126240bf. Probabilities below are current code, not proposed targets. All repeated currency grants share Depth caps: fish420, threads90, stamps360, essence6 per day; XP has its own cap. Sources that return a useful claim later must preserve that claim when capped.

| Source / rule | Item or reward | Rarity / rate | Pity / limit | Duplicates / overflow |
|---|---|---|---|---|
| Normal win, `equipment.dropGear` | One chapter-eligible gear | Common65%, Rare30%, Epic5%, Legendary0% | Shared six gear drops/day; no gear pity | Keeps another instance; full shelf converts via capped threads, possibly zero (gap) |
| Elite win, same function | One chapter-eligible gear | Rare70%, Epic27%, Legendary3% | Same six/day | Same |
| Boss win / chest, same function | One chapter-eligible gear | Rare20%, Epic70%, Legendary10% | Same six/day | Same |
| Daily challenge | Route gear and settlement | Uses the same normal/elite/boss tables | One daily challenge settlement plus shared caps | Same gear handling |
| A6 Tower | Gear for victorious floor + settlement | Node kind uses the same gear table | Shared gear cap; once-only floor settlement | Same gear handling |
| Tower chests5/10/15/20/25/30 | Stamps50+2×floor; threads10+floor | Deterministic100% | One per chest | Claim waits when no reward fits |
| Route settlement | Win fish90/threads18/stamps40/essence2/XP60; loss30/6/10/0/XP20 | Deterministic100% | Six rewarded routes/day, daily currency/XP caps | No item duplicate |
| Mastery materials | 2×visited stops +5 on win | Deterministic100% |30/day from settlement | Stack; useful for awakening/tailoring |
| Boss seals | One seal for rewarded win | Deterministic100% |One/day | Stack; edition/tailoring sink |
| First chapter clear |80/100/120 mastery; fish120/stamps80/essence4 | Deterministic100% |Once/chapter; currency caps still apply | One-time entitlement |
| Daily task book | Five tasks; each stamps20 and fish30 or threads5 | Deterministic100% |One each/day, caps | Claims remain if zero room |
| Login gifts | Seven authored currency bundles | Deterministic100% |Seven gifts total, at most one/day | No random item |
| Weekly chests | At10/20/30 points: stamps4×points, threads=points | Deterministic100% |One each/week, caps | No random item |
| Passive tips | Per minute: fish1+0.08×stage, threads0.15+0.01×stage, stamps0.25+0.015×stage; floored | Deterministic100% |12h accrual cap; ≥10min claim; daily currency caps | No random item |
| Fast rewards | Same table for60min | Deterministic100% |Two/day, caps | No random item |
| Cat recruit / featured | Common60%, Rare30%, Epic9%, Legendary1% base | Conditional rarity distribution | Soft starts draw13, +7pp Legendary/draw; hard24; 30draws/day;60stamps each | Prefer unowned within chosen pool; duplicate gives2/5/12/25shards; featured50% then guaranteed after miss |
| Gear recruit | Common55%, Rare34%, Epic10%, Legendary1% base | Conditional rarity distribution | Same13/24 curve; separate counter;60stamps each | Prefer unowned template; duplicate stays as usable/salvageable gear; full batch rejected before spend |
| Welcome cat | One standard draw, stamp refund | Same current cat odds |Once; no selector mark; does advance recruit count | Same cat duplicate shards |
| Selector | Chosen cat/gear |100% chosen item |24 paid-draw marks; Legendary gear requires chapter mastery | Owned cats restricted until roster complete; gear usable/salvageable |
| Tailoring | Chosen common/rare/epic/legendary gear |100% chosen template; bounded affix rolls | Common/rare fish180+threads30; Epic120+180+essence5; Legendary500+100+20+materials20+seal1 and Pantry clear | Another gear instance; full shelf rejected |
| Reforge | Chosen valid replacement affix at tier minimum |100% |fish90+threads15 | Deterministic replacement |
| Salvage | Threads |Common2/Rare5/Epic12/Legendary25,100% |Unequipped pieces only | Direct salvage is not capped; full-shelf automatic conversion inconsistently is |
| Forge supply recipes | Chosen supplies/keys/ribbon/gear |100% selected recipe |Recipe costs, chapter and stack/shelf limits | Deterministic item/stack; local edition designs use separate ledger |
| Star rewards / journal / quest board | Authored currencies, ribbon, pantry key |100% |Once or daily/weekly according to objective; caps | Stack/claim guards preserve useful reward |

Open economy gaps before simulation: early Legendary routes include10% boss drops, cheap gear recruit,24-mark selectors and inexpensive Legendary tailoring. A30-day target must account for all of these, not just reduce one drop rate. Full-shelf drop conversion can be zero at the thread cap. Gross per-item creation must be measured before salvage; lane CHAIN decides tradability in its own `trade.ts`.

Research and acceptance targets: DECISIONS.md. Tuning,30-day outputs and final disclosed tables are pending B4 completion.
