# Gameplay decisions — 2026-11-05

Candidate build, not live. Base: PR282 / 7eb1ee7. The only existing gameplay tunable changed is claim cadence. The 10000ms first claim and all server reward, Relic, market and replay rules are unchanged. All new values below belong to the isolated, default-off Sample. Units: seconds unless a key ends in Ms; chances/reductions are fractions; quality is percentage-point probability as a fraction.

Initial Sample tuning (never shipped): room-two boss HP 850 → 2200 after equal-kit and natural progression runs made it too short. Final natural min-max clears take 25–31s over five seeds. Moss retains a hands-free survival route with a prepared kit; Ember rewards counter/Pounce timing. Full records are in the ledger balance.json. Tier quality was corrected to first-clear loot only, closing a free higher-quality craft exploit. Return persistence retains the first hide timestamp across duplicate browser events.

| Config path | Before | After | Reason |
|---|---|---|---|
| gameplay.claimIntervalMs | 30000 | 18000 | Close the 30-second empty gap. Anchor the timer after the 10000ms first claim to respect the server minimum. |
| features.cafeAdventure | absent | false | Explicit guest opt-in; no new verified rules are enabled by default. |
| cafe.version | absent (new Sample) | 1 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.seed | absent (new Sample) | 1105 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.tickMs | absent (new Sample) | 1000 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.maxStepSeconds | absent (new Sample) | 3600 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.saveEverySeconds | absent (new Sample) | 5 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.firstFindSeconds | absent (new Sample) | 8 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.encounterSeconds | absent (new Sample) | 16 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.decisionSeconds | absent (new Sample) | 8 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.bossGate | absent (new Sample) | 8 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.maxLog | absent (new Sample) | 80 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.maxItems | absent (new Sample) | 48 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.maxPatches | absent (new Sample) | 999 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.startingPatches | absent (new Sample) | 4 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.gatherPatches | absent (new Sample) | 2 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.riskPatches | absent (new Sample) | 5 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.riskChance | absent (new Sample) | 0.6 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.riskConsolation | absent (new Sample) | 1 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.encounters.swiftChance | absent (new Sample) | 0.5 | Different safe/study/risk trades for named encounters. |
| cafe.encounters.swiftPatches | absent (new Sample) | 7 | Different safe/study/risk trades for named encounters. |
| cafe.encounters.thiefChance | absent (new Sample) | 0.75 | Different safe/study/risk trades for named encounters. |
| cafe.encounters.thiefPatches | absent (new Sample) | 4 | Different safe/study/risk trades for named encounters. |
| cafe.encounters.hazardChance | absent (new Sample) | 0.4 | Different safe/study/risk trades for named encounters. |
| cafe.encounters.hazardPatches | absent (new Sample) | 7 | Different safe/study/risk trades for named encounters. |
| cafe.encounters.hazardInsight | absent (new Sample) | 2 | Different safe/study/risk trades for named encounters. |
| cafe.encounters.armorBonus | absent (new Sample) | 1 | Different safe/study/risk trades for named encounters. |
| cafe.luckyCapPerTour | absent (new Sample) | 6 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.luckyExtra | absent (new Sample) | 2 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.itemEvery | absent (new Sample) | 2 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.maxInsight | absent (new Sample) | 3 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.insightDamage | absent (new Sample) | 0.08 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.encounterXp | absent (new Sample) | 2 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.bossXp | absent (new Sample) | 12 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.questXp | absent (new Sample) | 6 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.questPatches | absent (new Sample) | 2 | Bounded Sample pacing, storage or resource progression; no server grant changes. |
| cafe.hero.hp | absent (new Sample) | 160 | Bounded starter survival with a timed active damage option. |
| cafe.hero.damage | absent (new Sample) | 13 | Bounded starter survival with a timed active damage option. |
| cafe.hero.guard | absent (new Sample) | 0.35 | Bounded starter survival with a timed active damage option. |
| cafe.hero.guardCap | absent (new Sample) | 0.7 | Bounded starter survival with a timed active damage option. |
| cafe.hero.regenCap | absent (new Sample) | 5 | Bounded starter survival with a timed active damage option. |
| cafe.hero.pounceMultiplier | absent (new Sample) | 2.4 | Bounded starter survival with a timed active damage option. |
| cafe.hero.pounceCooldown | absent (new Sample) | 8 | Bounded starter survival with a timed active damage option. |
| cafe.gear.baseDamage | absent (new Sample) | 2 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.baseHp | absent (new Sample) | 6 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.chapterDamage | absent (new Sample) | 1 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.chapterHp | absent (new Sample) | 3 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.levelDamage | absent (new Sample) | 1 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.levelHp | absent (new Sample) | 4 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.maxLevel | absent (new Sample) | 3 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.keenDamage | absent (new Sample) | 3 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.cushionedHp | absent (new Sample) | 18 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.steadyGuard | absent (new Sample) | 0.04 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.luckyPatches | absent (new Sample) | 1 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.fineChance | absent (new Sample) | 0.28 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.brightChance | absent (new Sample) | 0.08 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.fineMultiplier | absent (new Sample) | 1.2 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.gear.brightMultiplier | absent (new Sample) | 1.4 | Legible affixes, chapter growth and three safe upgrade levels. |
| cafe.sets.two | absent (new Sample) | 2 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.three | absent (new Sample) | 3 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.four | absent (new Sample) | 4 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.emberDamage | absent (new Sample) | 0.18 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.emberCooldown | absent (new Sample) | 2 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.emberExposure | absent (new Sample) | 0.5 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.mossHp | absent (new Sample) | 0.2 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.mossRegen | absent (new Sample) | 2 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.mossGuard | absent (new Sample) | 0.12 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.starPatches | absent (new Sample) | 1 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.sets.starLuck | absent (new Sample) | 0.1 | Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices. |
| cafe.forge.craftCost | absent (new Sample) | 8 | Chosen set/slot and disclosed, non-destructive upgrade risk with item-bound pity. |
| cafe.forge.steadyCost | absent (new Sample) | 6 | Chosen set/slot and disclosed, non-destructive upgrade risk with item-bound pity. |
| cafe.forge.sparkCost | absent (new Sample) | 3 | Chosen set/slot and disclosed, non-destructive upgrade risk with item-bound pity. |
| cafe.forge.sparkChance | absent (new Sample) | 0.55 | Chosen set/slot and disclosed, non-destructive upgrade risk with item-bound pity. |
| cafe.forge.sparkLevels | absent (new Sample) | 2 | Chosen set/slot and disclosed, non-destructive upgrade risk with item-bound pity. |
| cafe.forge.pityMisses | absent (new Sample) | 3 | Chosen set/slot and disclosed, non-destructive upgrade risk with item-bound pity. |
| cafe.boss.hp.0 | absent (new Sample) | 480 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.hp.1 | absent (new Sample) | 2200 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.hp.2 | absent (new Sample) | 3400 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.hp.3 | absent (new Sample) | 4800 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.hp.4 | absent (new Sample) | 6600 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.damage.0 | absent (new Sample) | 25 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.damage.1 | absent (new Sample) | 38 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.damage.2 | absent (new Sample) | 49 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.damage.3 | absent (new Sample) | 63 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.damage.4 | absent (new Sample) | 78 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.variance | absent (new Sample) | 0.08 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.shieldReduction | absent (new Sample) | 0.55 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.phaseThresholds.0 | absent (new Sample) | 0.67 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.phaseThresholds.1 | absent (new Sample) | 0.34 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.phaseDamage.0 | absent (new Sample) | 1 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.phaseDamage.1 | absent (new Sample) | 1.12 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.phaseDamage.2 | absent (new Sample) | 1.25 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.windupSeconds | absent (new Sample) | 3 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.finalWindupSeconds | absent (new Sample) | 2 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.recoverySeconds | absent (new Sample) | 2 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.enrageSeconds | absent (new Sample) | 55 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.enrageDamage | absent (new Sample) | 1.7 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.maxSeconds | absent (new Sample) | 90 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.correctExposureSeconds | absent (new Sample) | 2 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.exposureDamage | absent (new Sample) | 0.4 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.retrySeconds | absent (new Sample) | 3 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.closeCallFraction | absent (new Sample) | 0.2 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.firstRewardPatches | absent (new Sample) | 8 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.boss.repeatRewardPatches | absent (new Sample) | 2 | Readable three-phase cadence, capped encounters and a meaningful chapter-two wall. |
| cafe.tiers.0.hp | absent (new Sample) | 1 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.tiers.0.damage | absent (new Sample) | 1 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.tiers.0.quality | absent (new Sample) | 0 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.tiers.1.hp | absent (new Sample) | 1.25 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.tiers.1.damage | absent (new Sample) | 1.15 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.tiers.1.quality | absent (new Sample) | 0.1 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.tiers.2.hp | absent (new Sample) | 1.55 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.tiers.2.damage | absent (new Sample) | 1.35 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.tiers.2.quality | absent (new Sample) | 0.2 | Opt-in pressure; quality premium applies only to first-clear boss loot. |
| cafe.assist.afterLosses | absent (new Sample) | 2 | Transparent, opt-out help after repeated losses. |
| cafe.assist.damageReduction | absent (new Sample) | 0.15 | Transparent, opt-out help after repeated losses. |
| cafe.assist.hpReduction | absent (new Sample) | 0.1 | Transparent, opt-out help after repeated losses. |
| cafe.mastery.xpPerLevel | absent (new Sample) | 40 | Small capped permanent perks with free respec. |
| cafe.mastery.maxLevel | absent (new Sample) | 5 | Small capped permanent perks with free respec. |
| cafe.mastery.damagePerLevel | absent (new Sample) | 0.02 | Small capped permanent perks with free respec. |
| cafe.mastery.hpPerLevel | absent (new Sample) | 0.03 | Small capped permanent perks with free respec. |
| cafe.mastery.scoutPatches | absent (new Sample) | 1 | Small capped permanent perks with free respec. |
| cafe.tour.unlockClears | absent (new Sample) | 3 | Previewed optional reset; bounded bonus and retained collections. |
| cafe.tour.maxBonusTours | absent (new Sample) | 3 | Previewed optional reset; bounded bonus and retained collections. |
| cafe.tour.damagePerTour | absent (new Sample) | 0.05 | Previewed optional reset; bounded bonus and retained collections. |
| cafe.away.minSeconds | absent (new Sample) | 60 | Honest local-only catch-up, no offline fights or tradable rewards. |
| cafe.away.capSeconds | absent (new Sample) | 7200 | Honest local-only catch-up, no offline fights or tradable rewards. |
| cafe.away.secondsPerPatch | absent (new Sample) | 120 | Honest local-only catch-up, no offline fights or tradable rewards. |
| cafe.away.maxPatches | absent (new Sample) | 30 | Honest local-only catch-up, no offline fights or tradable rewards. |
| cafe.quests.patrol | absent (new Sample) | 6 | Persistent short goals without calendar pressure; each reward pays once. |
| cafe.quests.variety | absent (new Sample) | 4 | Persistent short goals without calendar pressure; each reward pays once. |
| cafe.quests.counters | absent (new Sample) | 3 | Persistent short goals without calendar pressure; each reward pays once. |
| cafe.quests.crafts | absent (new Sample) | 2 | Persistent short goals without calendar pressure; each reward pays once. |
| cafe.quests.boss | absent (new Sample) | 1 | Persistent short goals without calendar pressure; each reward pays once. |
| cafe.quests.perfect | absent (new Sample) | 1 | Persistent short goals without calendar pressure; each reward pays once. |
| cafe.quests.tour | absent (new Sample) | 1 | Persistent short goals without calendar pressure; each reward pays once. |
| cafe.debug.seconds | absent (new Sample) | 60 | Explicit development-only reviewer controls, absent from production. |
| cafe.debug.patches | absent (new Sample) | 80 | Explicit development-only reviewer controls, absent from production. |

Presentation reuses CONFIG.gameplay.juice limits (no change). The 4s breathe animation, CSS layout dimensions, symbols, room counts and array indices are presentation/structure, not reward or combat tunables. No backend, contract, DB or migration changes. All authority remains in the existing server path.
