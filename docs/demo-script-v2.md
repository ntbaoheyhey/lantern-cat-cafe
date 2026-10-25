# Taskbar Hero — Cat RPG v2 Demo Script & Judge Walkthrough

> [!NOTE]
> Draft until the v2 cut-over (V29).

A comprehensive presentation guide for hackathon judges and code reviewers evaluating **Cat RPG v2** (Cat Café Quest). This walkthrough runs entirely in **demo mode** (no crypto wallet connection required, zero testnet gas needed, and zero configuration).

---

## 1. Quick Reference & Local Setup

### Local Run Command

During development prior to the v2 cut-over (V29), the v2 stage layout is enabled via the `VITE_GAME_V2` environment flag:

```bash
VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web dev
```

Once running, navigate to `http://localhost:5173` in any desktop browser (Chrome, Brave, Edge, or Firefox).

### Walkthrough Summary

- **Target Duration**: 3–5 minutes.
- **Audience**: Hackathon judges, protocol reviewers, and community testers.
- **Operating Mode**: Demo mode (`MockGameApi`, client-side local simulation).
- **Core Narrative**: Cat RPG v2 transforms the ambient taskbar idle game into a rich, chapter-based dungeon crawler with 7 feline hero classes, 9 equipment slots, deterministic combat simulations, deep crafting and auto-salvage economies, and daily Relic milestone minting on Avalanche Fuji.

---

## 2. Interactive Walkthrough: Step-by-Step

| Step | Time | Screen / Feature | Exact Action / Clicks | What the Viewer Should Notice | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | 0:00 - 0:30 | **App Shell & Game Stage** | Open `http://localhost:5173`. Point out top bar, HUD, and the main stage. | Stage renders Chapter 1 (Living Room). HUD displays Fish, Yarn, and Cat Keys. Cat sprite animates ambiently on the large canvas. | Live on main |
| **2** | 0:30 - 1:00 | **Class Selection** | Open ClassPicker. Select **Warrior** (or **Rogue**). Click **Choose Class** -> **Confirm**. | Class card displays weapon type, stat leanings, and passive (**Cleave** / **Twin Strike**). Starter weapon equips automatically. | *(pending V16/V19)* |
| **3** | 1:00 - 1:30 | **Ambient Idle Combat** | Watch combat on the main stage as rounds progress. | Cat engages regular monsters (Dust Bunny, Loose Yarn, Sock Puppet) and the Elite (Roomba Scout) at 6 kills per round. Attack cadence (1,000 ms) and passives animate cleanly. | Live on main |
| **4** | 1:30 - 2:05 | **Inventory & Bag Panel** | Click **Inventory** tab. Select an item in the bag. Click **Equip best**. | Character panel shows 9 slots (5 main unlocked at Lv 1, accessories unlocking at Lv 5, 10, 20). Bag counter reads `Bag X / 200`. Item compare displays exact stat deltas (+HP, +ATK). **Equip best** equips optimal upgrades instantly. | Live on main |
| **5** | 2:05 - 2:40 | **The Forge** | Click **Forge** tab. Select **Craft** -> Slot **Weapon** -> Rarity **Uncommon**. Click **Craft** -> **Confirm**. | Recipe cost displays 150 Fish, 25 Yarn, 8 Fluff Tuft, 1 Shiny Button. Crafted item gains guaranteed Uncommon rarity with item level from highest stage. Switch to **Salvage** to show ~25% material recovery. | *(pending V16/V19)* |
| **6** | 2:40 - 3:15 | **Boss Battle** | Click **Boss** tab at Round 10. Check 1 Cat Key requirement. Click **Fight**. | Chapter 1 Boss **Yarn Giant** appears. Boss telegraphs attacks every 1,500 ms (400 ms windup) and big slams every 6,000 ms (1,000 ms windup, 2.5x damage). | *(pending V16/V19)* |
| **7** | 3:15 - 3:50 | **Victory & Chest Opening** | Watch boss defeat animation. Open **First-Clear Chest**. | Exactly 1 Cat Key is consumed on victory. First-Clear Chest awards **1 Moon Pearl (100% drop)**, 400 Fish, 20 Yarn, materials, and guaranteed gear items. Frontier advances to Chapter 2. | *(pending V16/V19)* |
| **8** | 3:50 - 4:20 | **World Chapter Map** | Open the **Chapter Map**. Point out chapter progression nodes. | Chapter 1 shows a green checkmark (cleared & available for rematch). Chapter 2 (Kitchen) pulses as active. Chapters 3–5 show padlock frames. | *(pending V16/V19)* |
| **9** | 4:20 - 4:45 | **Session Persistence** | Press **Reload** (`Cmd+R` / `F5`) in the browser. | Game reloads instantly. Cat class, inventory items, currencies, and cleared chapter progress persist seamlessly from local storage. | Live on main |

*(pending V16/V19)*: These steps feature components whose UI integration into `apps/web/src/layout/StageLayout.tsx` is pending the V16/V19 layout and boss integration tasks.

---

## 3. Presenter Narration Script

### Scene 1: The Ambient RPG Vision (0:00 - 0:30)
- **Presenter Action**: Open the site running locally with `VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web dev`. Maximize the window.
- **Spoken Narration**:
  > *"Judges, Taskbar Hero v2 expands our zero-gas ambient RPG into a full-fledged chapter-based adventure called Cat Café Quest. Running comfortably in the browser while you work, your cat hero battles through 5 household chapters—from the Living Room to the Night Rooftops. Notice the top bar displaying our real-time HUD counters for Fish, Yarn, and Cat Keys, alongside the large pixel-art game stage."*

### Scene 2: Picking a Class (0:30 - 1:00) — *(pending V16/V19)*
- **Presenter Action**: Open the ClassPicker (`ClassPicker.tsx`). Highlight the Warrior and Rogue cards. Click **Choose Warrior**, then **Confirm**.
- **Spoken Narration**:
  > *"We start by selecting our hero's class from 7 distinct archetypes. Each class brings unique base stat leanings, dedicated weapon families, and passive combat traits. For instance, the Warrior wields a Sword and splashes 50% damage every 3 attacks with Cleave, while the Rogue strikes twice per attack with high crit. When we choose a class, the game immediately equips our matching starter weapon—the Twig Sword."*

### Scene 3: Ambient Idle Progress (1:00 - 1:30)
- **Presenter Action**: Direct attention to the active combat on the stage canvas.
- **Spoken Narration**:
  > *"On the stage, combat proceeds automatically without tedious clicking. Chapter 1 features 10 rounds of 6 monster kills each—cycling through Dust Bunnies, Loose Yarn, and Sock Puppets, before challenging the Roomba Scout Elite at the end of each round. If our cat encounters a monster it cannot defeat, the system marks us as 'gated' and safely farms the highest cleared round for Fish and Yarn without frustrating player deaths."*

### Scene 4: Inventory, Gearing, and Equip Best (1:30 - 2:05)
- **Presenter Action**: Click the **Inventory** tab. Show the Character Panel and Bag Panel (`BagPanel.tsx`). Select an item to show comparison deltas. Click **Equip best**.
- **Spoken Narration**:
  > *"In the Inventory tab, our Character Panel displays 9 equipment slots. Five main slots show directly on our cat's sprite, while four accessory slots unlock as our cat levels up to Level 5, 10, and 20. The Bag holds up to 200 items. Clicking 'Equip best' evaluates all gear in our bag against our active class weapon, automatically equipping the combination that maximizes our overall power rating."*

### Scene 5: The Forge & Smart Economy (2:05 - 2:40) — *(pending V16/V19)*
- **Presenter Action**: Switch to the **Forge** tab (`ForgePanel.tsx`). Select Craft, choose an Uncommon Armor piece, and confirm. Show the Salvage tab.
- **Spoken Narration**:
  > *"The Forge gives players deterministic progression. Rather than relying solely on random drops, we can spend Fish, Yarn, and tier materials to forge guaranteed rarities with item levels scaled to our highest cleared stage. In the Salvage tab, unwanted items can be dismantled for crafting materials. Salvaging returns approximately 25% of the crafting material cost and zero Fish, ensuring craft-then-salvage always loses value and prevents infinite economy exploits."*

### Scene 6: The Chapter Boss & Deterministic Combat (2:40 - 3:15) — *(pending V16/V19)*
- **Presenter Action**: Switch to the **Boss** tab at Round 10. Click **Fight**.
- **Spoken Narration**:
  > *"At Round 10, we unlock the chapter climax: the Yarn Giant. Boss fights require 1 Cat Key, but keys are consumed only if we win. The combat simulation runs deterministically: normal boss attacks land every 1,500 ms, punctuated by a telegraphed heavy slam every 6,000 ms dealing 2.5x damage. If we lose, our key is preserved and a single 60-second cooldown protects server sanity across all chapters."*

### Scene 7: Victory & First-Clear Chest Rewards (3:15 - 3:50) — *(pending V16/V19)*
- **Presenter Action**: Show the victory banner and open the First-Clear Chest.
- **Spoken Narration**:
  > *"Victory! Defeating the Yarn Giant consumes our Cat Key and opens the Chapter 1 First-Clear Chest. This guarantees 1 Moon Pearl—our prized daily Relic ingredient—along with 400 Fish, 20 Yarn, tier materials, and guaranteed gear drops. Even if our bag had been completely full at 200 items, the engine automatically salvages overflowing drops on the spot so rewards are never lost. Winning unlocks Chapter 2: The Kitchen."*

### Scene 8: The World Chapter Map (3:50 - 4:20) — *(pending V16/V19)*
- **Presenter Action**: Display the ChapterMap (`ChapterMap.tsx`).
- **Spoken Narration**:
  > *"The Chapter Map visualizes our journey across the 5 quest environments. Chapter 1 now shows a green checkmark, indicating it is cleared and ready for repeat boss rematches for bonus materials. Chapter 2 is active and pulsing, while Chapters 3 through 5 remain locked behind future boss conquests."*

### Scene 9: Session Persistence & Closing (4:20 - 4:45)
- **Presenter Action**: Reload the browser page (`F5` / `Cmd+R`).
- **Spoken Narration**:
  > *"Finally, we reload the browser page. Notice that all our earned levels, unlocked chapters, bag items, and currencies persist seamlessly in demo mode storage. In production, connecting an Avalanche wallet upgrades this profile to verified on-chain ownership, letting players forge and trade daily Relic NFTs on Avalanche Fuji. Thank you!"*

---

## 4. "If Something Goes Wrong" (Troubleshooting & Reset)

> [!WARNING]
> ### If Something Goes Wrong During Your Demo
>
> 1. **Resetting Demo Progress**:
>    If your local demo state gets into an unexpected state or you want to demonstrate a fresh first-time player experience:
>    - Open Developer Tools (`F12` or `Cmd+Option+I`).
>    - Open the **Application** (or **Storage**) tab -> select **Storage** in the sidebar -> click **Clear site data**.
>    - Alternatively, execute the following command in the DevTools Console:
>      ```javascript
>      localStorage.clear();
>      location.reload();
>      ```
> 2. **Demo Storage Key Name**:
>    Cat RPG v2 demo state storage key: `(see MockGameApiV2)` *(Note: MockGameApiV2 at apps/web/src/api/MockGameApiV2.ts is scheduled for implementation in V28; v1 demo mode uses in-memory defaults with `taskbar-hero.howToPlaySeen` in localStorage)*.
> 3. **UI Layout Mode**:
>    If the layout appears in compact strip mode instead of the full stage layout, click **Mini mode** in the top bar or verify that the window width is at least 1024px.
> 4. **Flag Check**:
>    If the v2 layout does not render, verify the dev server was started with `VITE_GAME_V2=1`.

---

## 5. Sources & References

Every number, timer, cost, cap, and label in this script is verified directly against the codebase:

1. **Classes and Weapon Profiles**: `packages/game-rules/src/v2/content/classes.ts`, `docs/content-v2.md`
2. **Equipment Slots and Unlock Levels**: `packages/game-rules/src/v2/content/slots.ts`
3. **Gear Rarities, Bag Limit (200), Warning (180)**: `packages/game-rules/src/v2/content/rarities.ts`, `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.bag`)
4. **Chapters, Rounds, and Monsters**: `packages/game-rules/src/v2/content/chapters.ts`, `packages/game-rules/src/v2/content/monsters.ts`
5. **Idle Progression and Pacing**: `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.idle`), `packages/game-rules/src/config.ts` (`CONFIG.idle`), `packages/game-rules/src/v2/idle/claim.ts`
6. **Boss Mechanics and Timers**: `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.boss`), `packages/game-rules/src/v2/state/apply.ts`, `docs/proposals/schema-v2.md`
7. **Forge Recipes and Salvage Rates**: `packages/game-rules/src/v2/content/recipes.ts`
8. **Chest Drop Rates and Scaling**: `packages/game-rules/src/v2/content/chests.ts`, `docs/drop-rates-v2.md`
9. **UI Components and Layout**: `apps/web/src/layout/StageLayout.tsx`, `apps/web/src/layout/bag/BagPanel.tsx`, `apps/web/src/layout/forge/ForgePanel.tsx`, `apps/web/src/layout/classpicker/ClassPicker.tsx`, `apps/web/src/map/ChapterMap.tsx`
10. **API Specifications**: `docs/api-v2.md`, `apps/web/src/api/GameApiV2.ts`
