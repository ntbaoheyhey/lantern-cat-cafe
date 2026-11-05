# Patterns chosen for Taskbar Hero

Research date: 2026-11-05 UTC. Decisions are original synthesis, not claims that every reference uses every mechanic. Sources and confidence live in [RESEARCH.md](RESEARCH.md), [sources.json](sources.json), and [research-matrix.json](research-matrix.json). No reference art, layouts, icons, text or numerical tables are imported.

| Common mechanism | Decision | Taskbar Hero implementation / reason |
| --- | --- | --- |
| Distinct frontline, damage and support jobs | KEEP | Three cats: guardian, witch, alchemist. Each has a basic, two skills and an ultimate. |
| A compact readable battle state | KEEP | Numbered rounds, committed enemy intents, target rows, finite charge and cooldowns. B owns presentation. |
| Speed-driven action frequency | DROP | Integer initiative orders unacted actors inside a round only. No extra turn from speed. |
| Collectible character identity | KEEP | Twelve original cafe cats, three per rarity, visible roles, lore and flavour traits. |
| Huge initial roster | CHANGE | Twelve collectible role variants; three fully implemented kits. New independent kits need encounter and animation work, not renamed clones. |
| Basic party available without payment | KEEP | Mochi, Soot and Clover plus six starter pieces. The whole first campaign is playable immediately. |
| Equipment slots and preview | KEEP | Four named slots; explicit compatibility; before/after stats; swap/unequip and lock/favourite. |
| Main stat plus secondary stats | CHANGE | Predictable templates and chosen reforge, rather than random enhancement rolls. |
| Two/four-piece bonuses | KEEP | Three original craftable sets, additive thresholds, mixed-set choice. |
| Many rarity ladders | CHANGE | Existing common/rare/epic/legendary vocabulary only. Relic is an item category/design eligibility, not a fifth tier. |
| Rare item functional identity | KEEP | Legendary gear adds shelter, efficient ultimate cost or restorative skill behavior; equal properties do not stack. |
| Repeated upgrade failure | DROP | Enhancement always succeeds if affordable; published quadratic fish cost. |
| Crafting and recycling | KEEP | Guaranteed rare/epic pieces; chosen supplies; salvage returns threads and never refunds enhancement spend. |
| Random collection acquisition | CHANGE | Earned stamps only. Every output is soulbound; visible conditional odds and pity. No payment or transfer route. |
| Duplicate progression | CHANGE | Prefer missing members within the rolled rarity. Owned cats grant matching shards; five-star overflow has a capped essence sink. |
| Banner guarantees | KEEP | Separate, explicit pity groups; soft pity starts on 41, legendary by 60; featured miss guarantees next legendary. |
| Rewarded daily/weekly play | CHANGE | Two cafe service claims, six rewarded battles, currency/XP caps. No streak penalty or energy blocking practice. |
| Chapter goals and first clears | KEEP | Three-wave cafe campaign plus Yarn Giant; two further chapters designed and clearly marked unavailable. |
| Account and collection progression | KEEP | Account XP, cat levels/stars, codex and earned cosmetic badge. No hidden paid progression. |
| Team presets and Auto | CHANGE | One editable three-role team and two battle doctrines; Auto immediately available. Multiple saved teams and replay viewer later. |
| Social obligations / ranked spending race | DROP for MVP | No server, guild pressure, PvP ranking or friend borrowing in this local prototype. |
| Seasonal collectible scarcity | CHANGE | Fixed global/season design caps and deterministic effort recipes. Simulated eligibility is never a minted asset. |
| Inflationary cash-like reward production | DROP | No fungible asset, yield machine, liquidity pool, breeding-for-profit loop or promised return. |
| Calendar-based season pass | LATER | Earned points only if implemented; first validate a satisfying campaign loop. No fake pass UI. |

## Original cafe identity

1. **Opening Shift:** a complete three-cat team begins with the player. Recruiting another cat changes the worker's personality/flavour and long-term ceiling; it never removes a necessary starter role.
2. **Mending Basket:** worn gear becomes threads; threads mend pantry keys or support chosen tailoring. Resource recovery leads to a visible, chosen result instead of another hidden affix lottery.
3. **Guestbook Stamps:** the cafe welcomes a random visitor using earned participation points. The next-page odds and remaining guarantee are inspectable; a legendary visitor cannot become a speculative asset.
4. **Yarnkeeper Seals:** the first rewarded boss clear on each local day records effort. Several distinct days plus a fixed recipe produce a Relic design claim. Repeated unattended clears cannot manufacture claims in a single day.
5. **Warm Pantry:** chosen finite supplies are packed when the team leaves. A supply uses a cat's action; abandoning an expedition does not refund the packed supplies. This makes preparation and a turn's opportunity cost matter.

These combinations use familiar system building blocks. Originality is in the cafe vocabulary, authored roster, deterministic economy and how the loops connect; no claim of inventing equipment or pity is made.
