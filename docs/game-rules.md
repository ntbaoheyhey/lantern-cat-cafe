# Game rules (`@taskbar-hero/game-rules`)

> **DRAFT: numbers need team sign-off.**

Pure TypeScript, shared by client (prediction) and server (truth). No network, DB or `Date.now()`; time is passed in as seconds; every roll takes an explicit uint32 seed (mulberry32 PRNG in `src/rng.ts`). Every tunable number lives in `packages/game-rules/src/config.ts` (`CONFIG`).

## API

- `computeIdleGains(state, elapsedSeconds, seed, {offline?})` -> `{gold, shards, drops[], countedSeconds}`; elapsed is clamped to the offline cap.
- `heroPower(gear[])`, `gearStat(gear)`, `goldPerSecond(power)`, `upgradeCost(gear)`
- `simulateBoss(power, bossLevel, seed)` -> `{won, log[], bossMaxHp, heroMaxHp}` (1 round = 1 s; log events `hero_hit`, `boss_hit`, `end`)
- `rollRelicRarity(seed)`, `relicOdds()`
- `canForge(state, today)`, `forgeBlock(state, today)`, `canClaimBossKey(state, today)`, `dayIndex(unixSeconds)`
- `simulateActivePlay(seed, seconds)`, `powerAfter(seed, seconds)`: reference starter policy used by the tuning test.

## Tuning target

A new player beats boss level 1 with probability >= 50% by 15 minutes of active play (reference policy: equip better drops, spend gold on best stat-per-gold upgrade). Current simulation: about 34% at 10 min, 52% at 12 min, 69% at 15 min. Proven in `src/index.test.ts`.

## Numbers in `config.ts`

| Key | Value | What it does |
| --- | --- | --- |
| `slots` | weapon, helm, armor, ring | Gear slots (one counted per slot). |
| `rarities` | common, rare, epic, legendary | Rarity tiers, lowest to highest. |
| `hero.basePower` | 10 | Power of a hero with no gear. |
| `hero.hpPerPower` | 12 | Hero HP in boss fights per power. |
| `hero.damagePerPower` | 1 | Hero damage per second per power. |
| `hero.critChance` | 0.15 | Chance of a crit each boss round. |
| `hero.critMultiplier` | 2 | Damage multiplier on crit. |
| `gear.baseStat` | weapon 8, helm 4, armor 5, ring 3 | Power of a level 1 Common item per slot. |
| `gear.rarityMultiplier` | 1 / 1.6 / 2.6 / 4.2 | Stat multiplier per rarity. |
| `gear.levelGrowth` | 0.12 | Extra stat per level above 1 (fraction of base). |
| `gear.maxLevel` | 30 | Highest item level. |
| `gear.upgradeBaseCost` | 25 | Gold to upgrade level 1 to 2. |
| `gear.upgradeCostGrowth` | 1.3 | Upgrade cost multiplier per level. |
| `gear.upgradeRarityCostMultiplier` | 1 / 1.5 / 2.5 / 4 | Upgrade cost multiplier per rarity. |
| `idle.baseGoldPerSecond` | 1 | Gold per second at zero power. |
| `idle.goldPerSecondPerPower` | 0.1 | Extra gold per second per power. |
| `idle.secondsPerKill` | 4 | Seconds per enemy; drops roll once per kill. |
| `idle.offlineCapSeconds` | 28800 (8 h) | Max seconds counted per claim. |
| `idle.offlineEfficiency` | 0.5 | Share of rewards earned while offline. |
| `idle.gearDropChance` | 0.05 | Per-kill chance of a gear drop. |
| `idle.shardDropChance` | 0.1 | Per-kill chance of shards. |
| `idle.shardsPerDrop` | 1 | Shards per shard drop. |
| `idle.maxDropsPerClaim` | 40 | Max gear items returned per claim (best kept). |
| `idle.dropRarityWeights` | 70 / 22 / 7 / 1 | Relative gear drop rarity weights. |
| `boss.basePower` | 62 | Boss level 1 power. |
| `boss.powerGrowth` | 1.5 | Boss power multiplier per level. |
| `boss.hpPerPower` | 14 | Boss HP per boss power. |
| `boss.damagePerPower` | 1 | Boss damage per second per boss power. |
| `boss.damageSpread` | 0.2 | Boss damage varies +/- this fraction per round. |
| `boss.maxRounds` | 60 | Fight is lost after this many rounds. |
| `boss.maxLevel` | 50 | Highest boss level. |
| `relic.shardCost` | 60 | Shards to forge a Relic. |
| `relic.bossKeyCost` | 1 | Boss Keys to forge a Relic. |
| `relic.rarityOddsBp` | 6000 / 2800 / 1000 / 200 | Relic rarity odds in basis points (sum 10000): 60% / 28% / 10% / 2%. |
| `time.secondsPerDay` | 86400 | Length of a forge / key day. |
| `time.dayOffsetSeconds` | 25200 | Day resets at midnight Vietnam time (UTC+7). |
| `tuning.targetMinSeconds` | 600 | Start of the tuning window (10 min). |
| `tuning.targetMaxSeconds` | 900 | End of the tuning window (15 min). |
| `tuning.minWinProbability` | 0.5 | Required boss 1 win chance by end of window. |

Limits: one Boss Key and one Relic per account per day, enforced via `lastBossKeyDay` / `lastForgeDay`.
