# Cat RPG v2 Player Guide

> [!NOTE]
> Draft until the v2 cut-over (V29).

Welcome to **Cat RPG v2**! This guide covers classes, the on-screen HUD, ambient idle progression, gear slots, server-side chapter bosses, crafting in the Forge, daily Relic minting on Avalanche Fuji, and the in-game Help tab.

---

## 1. What the Game Is

Taskbar Hero is an ambient idle RPG where your cat battles household monsters while your browser tab stays open. As you work or browse, your cat explores 5 chapters, defeats waves of enemies, conquers chapter bosses, collects crafting materials, and equips powerful gear. Once each day, combine materials to forge an exclusive daily Relic and mint it as an NFT on Avalanche Fuji.

---

## 2. Getting Started: Pick a Class, Read the HUD & Help Tab

### Pick a Class
Start by picking 1 of 7 cat classes. Each class favors a weapon type and has a unique passive skill. Switch classes anytime outside boss fights via the Class Picker (`apps/web/src/layout/classpicker/ClassPicker.tsx`). Switching grants the class's free Common starter weapon if you do not already own one.

| Class | Weapon | Role | Passive |
| :--- | :--- | :--- | :--- |
| **Warrior** | Sword | Melee striker | **Cleave**: Every 3rd attack splashes 50% damage to next monster. |
| **Guardian** | Hammer | Melee tank | **Bonk**: Delays target attack by 500 ms. |
| **Rogue** | Daggers | Crit striker | **Twin Strike**: 2 hits per attack; 25% crit, 10% dodge. |
| **Hunter** | Spear | Reach tracker | **Mark Prey**: Target takes +20% damage; +10% find. |
| **Archer** | Bow | Ranged sniper | **Volley**: Every 5th shot fires 3 arrows (50% extra). |
| **Witch** | Staff | Area burner | **Burn**: 40% splash; burns 30% over 3s. |
| **Alchemist** | Flasks | Poisoner | **Poison**: 50% poison over 4s; heals 3% HP on kill. |

### The HUD Bar
At the top of the adventure stage, the presentational HUD bar (`apps/web/src/layout/hud/HudBar.tsx`) keeps essential status information visible at a glance:
- **Level & XP Bar (`LevelXpBar`)**: Displays your cat's level badge (e.g. `Lv 12`), an animated progress fill, and explicit XP numbers (`xp / xpToNext XP`).
- **Progress Chip (`ProgressChip`)**: Shows your current chapter, round, and kill progress (`Chapter N · Round R · K/KillsPerRound`) with full screen-reader descriptions.
- **Stacks Bar (`StacksBar`)**: Shows your current wallet counts for Fish, Yarn, and Cat Keys (`keys / maxStack`, where maximum key capacity is dynamically loaded from `v2.MATERIALS` catKey `maxStack`, currently 5).
- **Power Chip (`PowerChip`)**: Shows your calculated gear power (`Power N`). When your progression is gated by enemy strength, an italicized warning appears: *"Needs about N power: upgrade your weapon"*.

### In-Game Help Tab
For in-depth explanations anytime during play, select the **Help** tab in the navigation bar (`apps/web/src/layout/HelpTab.tsx`). It features dedicated guides covering game mechanics, class passives, gear rarities, boss gate requirements, and step-by-step instructions for connecting an Ethereum wallet and adding Avalanche Fuji testnet.

---

## 3. Idle Progress: Kills, Rounds, Chapters, and Levels

Your cat explores and fights automatically without requiring active clicks:

- **Chapters & Rounds**: 5 chapters (Living Room, Kitchen, Bathroom, Basement, Night Rooftops), each featuring 10 rounds. Pacing is controlled by config leaf `V2_CONFIG.chapters.killsPerRound` (currently 6 kills in Chapter 1 [5 regular + 1 Elite], and 10 kills in Chapters 2–5 [9 regular + 1 Elite]).
- **Walk Pacing**: Your cat pauses between monsters according to `V2_CONFIG.idle.walkTimeMs` (currently 1,000 ms).
- **Levels & XP**: Maximum cat level is governed by `V2_CONFIG.cat.maxLevel` (currently level 60). Required experience to next level scales according to `V2_CONFIG.cat.xpBase * (V2_CONFIG.cat.xpGrowth ^ (level - 1))` (currently `60 * 1.12^(level - 1)`).
- **What "Gated" Means**: When an enemy monster's damage or defense exceeds your cat's current survivability, progress gates. Your cat automatically falls back to farm the highest safe round for Fish, Yarn, and crafting materials until you level up or equip better gear.
- **Offline Time & Caps**: When you close or leave the game tab, the initial period defined by `CONFIG.idle.onlineWindowSeconds` (currently 300 s / 5 minutes) runs at 100% full online speed. Subsequent offline time earns rewards at `CONFIG.idle.offlineEfficiency` (currently 50% efficiency), up to a ceiling of `CONFIG.idle.offlineCapSeconds` (currently 28,800 s / 8 hours). A single claim processes up to `V2_CONFIG.idle.maxRoundsPerClaim` (currently 4,096 rounds). Active tabs claim automatically every 30 seconds.

*(Note: Pacing and progression numbers reflect current values in `packages/game-rules/src/v2/config.ts`; values are not signed yet and pending numbers sign-off Decision D4).*

---

## 4. Gear: Slots, Rarities, and Bag Management

Gear boosts your cat's attributes (Attack, Hit Points, Defense) and overall Power:

### 9 Equipment Slots
- **Main Drawn Slots** (rendered on your cat sprite, unlocked at Level 1): Weapon (ATK), Helmet (HP, DEF), Armor (HP, DEF), Gloves (ATK, Crit), Boots (HP, Attack Speed).
- **Accessory Slots** (jewelry items granting secondary bonuses): Collar (unlocked at Level 1), Earring (Level 5), Ring (Level 10), Charm (Level 20).

### Rarities & Bonus Lines
- **Rarities**: Common (1.0x stats, 0 bonus lines, max Lv 10), Uncommon (1.3x, 1 line, max Lv 20), Rare (1.7x, 2 lines, max Lv 30), Epic (2.3x, 3 lines, max Lv 40), Legendary (3.2x, 4 lines, max Lv 50).
- **Bonus Lines**: Random secondary rolls (Crit Chance, Crit Damage, Dodge, Attack Speed, HP Regen, Fish Bonus, XP Bonus, Material Find, Boss Damage).
- **Hard Caps**: Stacked stat caps protect battle balance via `V2_CONFIG.caps`:
  - `V2_CONFIG.caps.critChance` (currently 75%)
  - `V2_CONFIG.caps.dodge` (currently 60%)
  - `V2_CONFIG.caps.attackSpeed` (currently 100% extra speed, enforcing `V2_CONFIG.caps.minAttackIntervalMs` of 200 ms)
  - `V2_CONFIG.caps.hpRegen` (currently 5% max HP per second)

### Equip Best & Bag Space
- **Equip Best**: Instantly equips the highest-power weapon matching your class and best armor across all currently unlocked slots.
- **Bag Limit & Auto-Salvage**: Capacity is capped at `V2_CONFIG.bag.limit` (currently 200 items), with a warning trigger at `V2_CONFIG.bag.nearFullRatio` (90% / 180 items). When full, newly dropped items automatically salvage into raw materials. Crafting new items is blocked while the bag is full.

---

## 5. Bosses: Server-Side Combat, Gate States, Keys, and Chests

Chapter bosses reside at Round 10: Yarn Giant (Ch1), Cucumber Scare (Ch2), Bathtub Tyrant (Ch3), Vacuum Beast (Ch4), and Laser Dot Phantom (Ch5).

### Server-Side Battle Engine (`v2-boss-fight`)
All boss combat is authoritatively simulated and verified on the server via the `v2-boss-fight` Edge Function (`supabase/functions/v2-boss-fight/index.ts`):
- **Server Verification**: The server verifies that your cat has chosen a class, holds at least `V2_CONFIG.boss.keyCost` (1 Cat Key), has completed round 10 of the chapter (or cleared it previously), and is not currently on a loss cooldown.
- **Action Timeline & Combat Replay**: The server returns an event-by-event combat log with specialized telemetry flags:
  - `big`: Marks telegraphed heavy attacks (such as the boss heavy attack occurring every `V2_CONFIG.boss.bigEveryMs` [6,000 ms] with `V2_CONFIG.boss.bigMultiplier` [2.5x damage]).
  - `dodged`: Marks attacks successfully evaded by your cat (e.g. Rogue passive or dodge stat rolls).
- **Costs & Catnap Cooldown**:
  - **Victory**: Spends `V2_CONFIG.boss.keyCost` (1 key), marks the chapter cleared, and opens the victory chest.
  - **Defeat**: **Zero keys are lost** (you keep your Cat Key). Instead, a player-wide catnap cooldown begins for `V2_CONFIG.boss.lossCooldownSeconds` (currently 60 seconds) before another boss fight can be initiated.

### Boss Gate Panel States
The Boss Gate Panel (`apps/web/src/layout/boss/BossGatePanel.tsx`) clearly informs you of your readiness across 5 distinct states:
1. **`gated`**: Displayed when your power is too low to challenge the boss safely. Explains: *"Needs about N power: upgrade your weapon or armor to keep going. Then clear N more rounds and K more monsters to reach the boss."*
2. **`no_key`**: Displayed when you have reached the boss encounter but hold 0 Cat Keys: *"You need a Cat Key. You get one each day from your first claim, and sometimes from monsters in cleared chapters."*
3. **`cooldown`**: Displayed while recovering from a boss loss: *"Catnap: m:ss"* (live countdown until `V2_CONFIG.boss.lossCooldownSeconds` expires).
4. **`not_reached`**: Displayed before clearing earlier chapter waves: *"Clear N more rounds and K more monsters to reach the boss."* (or *"Beat the chapter N-1 boss first."*).
5. **`ready` / `rematch`**: The **Fight** (or **Rematch**) button is enabled. On rematches, indicates: *"Rematch: the chest is smaller than the first clear."*

### Chests & Rematches
- **First-Clear Chest**: Awards guaranteed 1 Moon Pearl (100%), substantial Fish, Yarn, crafting materials, and gear (100% main armor, 50% accessory), unlocking the subsequent chapter.
- **Rematches**: Cleared bosses may be challenged repeatedly by spending a Cat Key. Rematch chests offer scaled repeatable loot (30% Moon Pearl chance, 70% main armor, 25% accessory).

> [!IMPORTANT]
> **Coming with the numbers sign-off (Decision D1)**:
> In the upcoming signed numbers balance (Decision D1, Option S-B), one Cat Key will be awarded in every **FIRST-clear** boss chest (`V2_CONFIG.boss.firstClearKeys = 1`, none on rematch, `V2_CONFIG.idle.dailyKeys <= 3`). This guarantees keys to push into next chapters upon victory. On main today, `firstClearKeys` is currently 0 awaiting the user's sign-off on `docs/proposals/numbers-v2.md`.

---

## 6. The Forge: Crafting, Salvage, and Locking

The Forge (`apps/web/src/layout/forge/ForgePanel.tsx`) crafts guaranteed rarities matching your highest cleared chapter stage. Salvaging returns approximately 25% of crafting materials and 0 Fish, ensuring craft-then-salvage cycles cannot be exploited:

| Recipe | Rarity | Fish | Materials | Salvage Return |
| :--- | :--- | :--- | :--- | :--- |
| `rcp.common` | Common | 50 Fish | 10 Yarn, 4 Fluff Tuft | 1 Yarn, 2 Fluff Tuft |
| `rcp.uncommon` | Uncommon | 150 Fish | 25 Yarn, 8 Fluff Tuft, 1 Shiny Button | 3 Yarn, 4 Fluff Tuft |
| `rcp.rare` | Rare | 500 Fish | 60 Yarn, 10 Fluff Tuft, 6 Shiny Button | 8 Yarn, 2 Shiny Button |
| `rcp.epic` | Epic | 1,500 Fish | 150 Yarn, 6 Shiny Button, 3 Catnip Crystal | 20 Yarn, 1 Catnip Crystal |
| `rcp.legendary` | Legendary | 5,000 Fish | 400 Yarn, 6 Catnip Crystal, 2 Starlight Scale | 50 Yarn, 1 Starlight Scale |

Click any item in your bag and press **Lock** to safeguard it against accidental salvage. Locked items can still be equipped and unequipped freely. Press **Unlock** if you later choose to salvage them.

---

## 7. The Daily Relic: Forging on Avalanche Fuji

Every day, combine **30 Yarn + 1 Moon Pearl** in the Forge's Relic tab to create a daily Relic.
- **Daily Limit**: 1 Relic per account per day (resets at midnight UTC+7), shared between v2 and classic v1.
- **On-Chain Minting**: Forging produces a cryptographically signed EIP-712 voucher. In signed-in mode, submit this voucher to mint an authentic ERC-1155 NFT on Avalanche Fuji (Chain ID 43113). Detailed wallet instructions and contract addresses are available in the in-game Help tab and [auth.md](auth.md).

---

## 8. Demo Mode vs. Signed-In Mode

Taskbar Hero provides two distinct operating modes:
- **Demo Mode**: Play immediately in your browser without requiring a crypto wallet. Your cat progression, bag inventory, and game state are saved locally in browser storage (`localStorage`). Vouchers generated in demo mode are simulations and cannot mint on-chain.
- **Signed-In Mode**: Sign in with any EVM-compatible browser wallet via Sign-In with Ethereum (SIWE). Progress syncs to the Supabase cloud database, safely persists across browsers and devices, and allows minting genuine Relic NFTs on Avalanche Fuji.

---

## 9. Frequently Asked Questions (FAQ)

### 1. Why did my claim give nothing?
Claims require at least 10 seconds between requests (`MIN_CLAIM_INTERVAL_SECONDS`). Requesting a claim sooner than 10 seconds returns zero gains. Offline progress is also subject to the 8-hour cap (`CONFIG.idle.offlineCapSeconds`).

### 2. Why can't I fight the boss?
Check the status text displayed on the Boss Gate Panel:
- **`not_reached`**: You must clear through Round 10 and defeat the round's elite monster.
- **`gated`**: Your cat's Power is too low; upgrade your weapon, armor, or level up.
- **`no_key`**: You need at least 1 Cat Key (`V2_CONFIG.boss.keyCost`). Claim your daily reward or farm cleared chapters.
- **`cooldown`**: You recently lost a boss battle. Wait for the 60-second Catnap timer (`V2_CONFIG.boss.lossCooldownSeconds`) to expire.

### 3. Did I lose my Cat Key when I lost the boss fight?
No! Under the v2 rules engine, losing a boss battle refunds your Cat Key (`V2_CONFIG.boss.keyCost` is only deducted on a win). You only take a brief 60-second Catnap cooldown.

### 4. Where did my dropped item go?
If your 200-slot bag is completely full (`V2_CONFIG.bag.limit`), incoming equipment drops automatically salvage into raw materials (Yarn and tier materials) to prevent item loss.

### 5. Can I change classes later?
Yes, you can freely switch between all 7 classes anytime outside of an active boss fight. If you do not possess a weapon for your new class, you receive a free Common starter weapon.

### 6. What does "gated" mean?
It means your cat's current stats (HP, ATK, DEF) are insufficient to defeat the next enemy. Your cat automatically falls back to farm the highest safe round until you forge or equip stronger gear.

### 7. Why does salvaging return less?
Salvage returns ~25% of crafting materials and 0 Fish to prevent infinite crafting/salvaging exploit loops.

### 8. How do I get Moon Pearls?
Moon Pearls drop with 100% certainty from every First-Clear boss chest, and have a 30% drop chance in repeat rematch chests.

### 9. Will demo progress transfer to my wallet?
No, demo mode progress is strictly contained within browser storage (`localStorage`). Connecting a wallet links your session to your cloud save on Supabase.

---

## Sources & References

Every rule, formula, UI label, and configuration key referenced in this guide is verified against origin/main:

1. **Class definitions, weapons, and passives**: `packages/game-rules/src/v2/content/classes.ts`, `docs/content-v2.md`
2. **Equipment slots and unlock progression**: `packages/game-rules/src/v2/content/slots.ts`
3. **Gear rarities, stat caps, bag limit**: `packages/game-rules/src/v2/content/rarities.ts`, `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.caps`, `V2_CONFIG.bag`)
4. **Material stack caps and key capacity**: `packages/game-rules/src/v2/content/materials.ts`
5. **Chapters, rounds, and monsters**: `packages/game-rules/src/v2/content/chapters.ts`, `packages/game-rules/src/v2/content/monsters.ts`
6. **Idle timing, offline efficiency, offline cap**: `packages/game-rules/src/config.ts` (`CONFIG.idle`), `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.idle`), `packages/game-rules/src/v2/idle/claim.ts`
7. **Forge recipes, salvage returns, relic recipe**: `packages/game-rules/src/v2/content/recipes.ts`
8. **Boss chest drop rates and keys**: `packages/game-rules/src/v2/content/chests.ts`, `docs/drop-rates-v2.md`
9. **Boss cooldown, keys, combat timing**: `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.boss`), `packages/game-rules/src/v2/state/apply.ts`, `packages/game-rules/src/v2/state/state.test.ts`
10. **Server-side boss combat Edge Function**: `supabase/functions/v2-boss-fight/index.ts`
11. **API contracts and endpoints**: `docs/api-v2.md`, `apps/web/src/api/GameApiV2.ts`
12. **UI layout, HUD components, BossGatePanel, and HelpTab**:
    - `apps/web/src/layout/StageLayout.tsx`
    - `apps/web/src/layout/hud/HudBar.tsx`
    - `apps/web/src/layout/boss/BossGatePanel.tsx`
    - `apps/web/src/layout/HelpTab.tsx`
    - `apps/web/src/layout/bag/BagPanel.tsx`
    - `apps/web/src/layout/forge/ForgePanel.tsx`
    - `apps/web/src/layout/classpicker/ClassPicker.tsx`
