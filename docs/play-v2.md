# Cat RPG v2 Player Guide

> [!NOTE]
> Draft until the v2 cut-over (V29).

Welcome to **Cat RPG v2**! This guide covers classes, idle progress, gear, chapter bosses, crafting, and daily Relics.

---

## 1. What the Game Is

Taskbar Hero is an ambient idle RPG where your cat battles household monsters while your browser tab stays open. As you work or browse, your cat explores 5 chapters, defeats waves of enemies, conquers chapter bosses, collects crafting materials, and equips powerful gear. Once each day, combine materials to forge an exclusive daily Relic and mint it as an NFT on Avalanche Fuji.

---

## 2. Getting Started: Pick a Class

Start by picking 1 of 7 cat classes. Each class favors a weapon type and has a unique passive skill. Switch classes anytime outside boss fights. Switching grants the class's free Common starter weapon if you do not already own one.

| Class | Weapon | Role | Passive |
| :--- | :--- | :--- | :--- |
| **Warrior** | Sword | Melee striker | **Cleave**: Every 3rd attack splashes 50% damage to next monster. |
| **Guardian** | Hammer | Melee tank | **Bonk**: Delays target attack by 500 ms. |
| **Rogue** | Daggers | Crit striker | **Twin Strike**: 2 hits per attack; 25% crit, 10% dodge. |
| **Hunter** | Spear | Reach tracker | **Mark Prey**: Target takes +20% damage; +10% find. |
| **Archer** | Bow | Ranged sniper | **Volley**: Every 5th shot fires 3 arrows (50% extra). |
| **Witch** | Staff | Area burner | **Burn**: 40% splash; burns 30% over 3s. |
| **Alchemist** | Flasks | Poisoner | **Poison**: 50% poison over 4s; heals 3% HP on kill. |

---

## 3. Idle Progress: Kills, Rounds, Chapters, and Levels

Your cat explores and fights automatically:

- **Chapters & Rounds**: 5 chapters (Living Room, Kitchen, Bathroom, Basement, Night Rooftops), 10 rounds each. Chapter 1 needs 6 kills per round (5 regular + 1 Elite); Chapters 2–5 need 10 kills (9 regular + 1 Elite).
- **Walk Pacing**: Your cat pauses 1,000 ms between monsters.
- **Levels & XP**: Max level is 60. XP to next level follows `60 * 1.12^(level - 1)`.
- **What "Gated" Means**: When an enemy is too tough, progress gates. Your cat automatically retreats to farm the highest safe round for Fish, Yarn, and materials until you level up or equip better gear.
- **Offline Time & Caps**: Away from the tab, the first 5 minutes (300 seconds) run at **100% full online speed**, and remaining time runs at **50% efficiency**. Offline time caps at **8 hours (28,800 seconds)** per claim. A claim processes up to 4,096 rounds. Active tabs claim automatically every 30 seconds.

---

## 4. Gear: Slots, Rarities, and Bag Management

Gear boosts your cat's stats and power:

### 9 Equipment Slots

- **Main Slots** (drawn on cat, unlock at Level 1): Weapon (ATK), Helmet (HP, DEF), Armor (HP, DEF), Gloves (ATK, Crit), Boots (HP, Attack Speed).
- **Accessory Slots** (not drawn, secondary stats only): Collar (Level 1), Earring (Level 5), Ring (Level 10), Charm (Level 20).

### Rarities & Bonus Lines

- **Rarities**: Common (1.0x stats, 0 bonus lines, max Lv 10), Uncommon (1.3x, 1 line, max Lv 20), Rare (1.7x, 2 lines, max Lv 30), Epic (2.3x, 3 lines, max Lv 40), Legendary (3.2x, 4 lines, max Lv 50).
- **Bonus Lines**: Roll secondary stats (Crit Chance, Crit Damage, Dodge, Attack Speed, HP Regen, Fish Bonus, XP Bonus, Material Find, Boss Damage).
- **Hard Caps**: Crit Chance 75%, Dodge 60%, Attack Speed bonus 100% (minimum 200 ms attack interval), HP Regen 5%.

### Equip Best & Bag Space

- **Equip Best**: Equips the highest-power items for your class weapon across unlocked slots.
- **Bag Limit (200 items)**: Bag holds 200 items (warning at 180 / 90%). When full, new drops auto-salvage into materials. Crafting is blocked when full.

---

## 5. Bosses: Keys, Cooldowns, and Chests

Round 10 hosts the chapter boss: Yarn Giant (Ch1), Cucumber Scare (Ch2), Bathtub Tyrant (Ch3), Vacuum Beast (Ch4), or Laser Dot Phantom (Ch5).

- **Cat Keys**: Fighting costs 1 key, spent only on a win. Losing keeps your key.
- **Key Sources & Cap**: 1 free key on your first claim each day; cleared chapter kills have a 1 in 150 (~0.67%) key drop chance. Key cap is 5.
- **Key wall hint**: When a boss is blocked only by a missing key, the Boss panel shows "Cat Keys: n / max" and lists where keys come from (daily claim key, the rare drop in cleared chapters, and the first-clear chest line only when the first clear gives keys). The Help tab lists the same sources. All values are read from the game config, not typed.
- **Loss Cooldown**: A loss triggers a single 60-second cooldown across all chapters for your cat.
- **First-Clear Chests**: Awards 1 Moon Pearl (100%), scaled Fish (300–500 in Ch1 up to 4,800–8,000 in Ch5; mean 400 to 6,400), Yarn (15–25 in Ch1 up to 240–400 in Ch5; mean 20 to 320), materials, and gear (100% main, 50% accessory), unlocking the next chapter.
- **Rematches**: Cleared bosses can be refought anytime with a key. Repeat chests grant scaled rewards with a 30% Moon Pearl chance, 70% main gear chance, and 25% accessory gear chance.

---

## 6. The Forge: Crafting, Salvage, and Locking

The Forge crafts guaranteed rarities matching your highest cleared stage. Salvage returns approximately 25% of materials and 0 Fish, ensuring craft-then-salvage always loses value.

| Recipe | Rarity | Fish | Materials | Salvage Return |
| :--- | :--- | :--- | :--- | :--- |
| `rcp.common` | Common | 50 Fish | 10 Yarn, 4 Fluff Tuft | 1 Yarn, 2 Fluff Tuft |
| `rcp.uncommon` | Uncommon | 150 Fish | 25 Yarn, 8 Fluff Tuft, 1 Shiny Button | 3 Yarn, 4 Fluff Tuft |
| `rcp.rare` | Rare | 500 Fish | 60 Yarn, 10 Fluff Tuft, 6 Shiny Button | 8 Yarn, 2 Shiny Button |
| `rcp.epic` | Epic | 1,500 Fish | 150 Yarn, 6 Shiny Button, 3 Catnip Crystal | 20 Yarn, 1 Catnip Crystal |
| `rcp.legendary` | Legendary | 5,000 Fish | 400 Yarn, 6 Catnip Crystal, 2 Starlight Scale | 50 Yarn, 1 Starlight Scale |

Click an item in your bag and press **Lock** to protect it from salvage. Locked items can still be equipped freely. Click **Unlock** to dismantle them.

---

## 7. The Daily Relic: Forging on Avalanche Fuji

Every day, forge a daily Relic using **30 Yarn + 1 Moon Pearl**. Limit: 1 Relic per account per day (midnight UTC+7 reset), shared between v2 and classic v1. Forging produces an EIP-712 voucher to mint an ERC-1155 NFT on Avalanche Fuji (Chain ID 43113). Avalanche Fuji is a test network (testnet); minting uses free testnet AVAX and costs no real money. For wallet details, see the in-game Help tab and [auth.md](auth.md).

---

## 8. Demo Mode vs. Signed-In Mode

Taskbar Hero supports two play modes:
- **Demo Mode**: Play immediately in your browser without a wallet. Progress and items are saved locally (`localStorage`). Demo vouchers cannot mint on-chain.
- **Signed-In Mode**: Sign in with an Ethereum-compatible wallet via SIWE. Progress syncs to the server database, persists across devices, and enables minting Relic NFTs on the Avalanche Fuji testnet (free testnet, costs no real money).

---

## 9. Frequently Asked Questions (FAQ)

### 1. Why did my claim give nothing?
Claims need 10 seconds between requests. Claiming within 10 seconds returns zero gains. Offline progress also caps at 8 hours.

### 2. Why can't I fight the boss?
You need 10 rounds completed, 1 Cat Key, and no active 60-second loss cooldown.

### 3. Where did my dropped item go?
If your 200-slot bag is full, new drops auto-salvage into materials (Yarn and tier materials).

### 4. Can I change classes later?
Yes, switch anytime outside boss fights. You get a free Common starter weapon if needed.

### 5. What does "gated" mean?
Your cat's stats cannot defeat the next monster. Your cat farms the highest safe round until you upgrade.

### 6. Why does salvaging return less?
Salvaging yields ~25% of materials and no Fish to prevent infinite recycling loops.

### 7. How do I get Moon Pearls?
Guaranteed (100%) in First-Clear boss chests; 30% drop chance in repeat chests.

### 8. Will demo progress transfer to my wallet?
No, demo progress stays in browser storage. Wallets connect to your cloud save.

---

## Sources & References

Every number, cost, cap, and statistic in this guide is derived directly from the codebase:

1. **Class stats, weapons, passives**: `packages/game-rules/src/v2/content/classes.ts`, `docs/content-v2.md`
2. **Equipment slots and unlock levels**: `packages/game-rules/src/v2/content/slots.ts`
3. **Gear rarities, multipliers, stat caps, bag limit**: `packages/game-rules/src/v2/content/rarities.ts`, `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.caps`, `V2_CONFIG.bag`)
4. **Material stack caps**: `packages/game-rules/src/v2/content/materials.ts`
5. **Chapters, rounds, and rosters**: `packages/game-rules/src/v2/content/chapters.ts`, `packages/game-rules/src/v2/content/monsters.ts`
6. **Idle timing, offline efficiency, offline cap**: `packages/game-rules/src/config.ts` (`CONFIG.idle`), `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.idle`), `packages/game-rules/src/v2/idle/claim.ts`
7. **Forge recipes, salvage returns, relic recipe**: `packages/game-rules/src/v2/content/recipes.ts`
8. **Boss chest drop rates and keys**: `packages/game-rules/src/v2/content/chests.ts`, `docs/drop-rates-v2.md`
9. **Boss cooldown and fight limits**: `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.boss`), `packages/game-rules/src/v2/state/apply.ts`, `packages/game-rules/src/v2/state/state.test.ts`, `docs/proposals/schema-v2.md`
10. **API and endpoints**: `docs/api-v2.md`, `apps/web/src/api/GameApiV2.ts`
11. **UI screens and labels**: `apps/web/src/layout/StageLayout.tsx`, `apps/web/src/layout/bag/BagPanel.tsx`, `apps/web/src/layout/forge/ForgePanel.tsx`, `apps/web/src/layout/classpicker/ClassPicker.tsx`
