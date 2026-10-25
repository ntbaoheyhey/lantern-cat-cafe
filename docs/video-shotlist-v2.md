# Cat RPG v2 Demo Video Shot List & Production Plan

> [!NOTE]
> Video production plan for hackathon submission (Card A27b). Based on scenes from `docs/demo-script-v2.md` and the pitch outline in `docs/pitch-outline.md`.
> Target video duration: **2 to 3 minutes** (120–180 seconds).

---

## 1. Recording Setup & Quality Checklist

Before recording any footage, verify the capture environment against this checklist:

1. **Resolution & Aspect Ratio**:
   - Record at **1920 × 1080** (1080p, 16:9) or **1280 × 720** (720p).
   - Maintain 60 FPS capture for smooth sprite animation and combat movement.
2. **Browser Environment**:
   - Use a dedicated clean browser profile or private/incognito window.
   - Hide the bookmarks toolbar, navigation extensions, and URL suggestions.
   - Set zoom level to **100%** (standard) or **125%** (for enhanced pixel-art and font contrast).
   - Mute all OS notifications, popups, and sound effects.
3. **Security & Secrets**:
   - Ensure zero seed phrases, private keys, or personal API tokens appear on screen.
   - Use a dedicated throwaway testnet wallet address containing only Avalanche Fuji test AVAX.
4. **Motion Takes**:
   - Record the main walkthrough with standard animations enabled.
   - Record a 10-second supplemental cut with `prefers-reduced-motion: reduce` enabled to demonstrate accessible instant state updates.

---

## 2. Shot-by-Shot Timeline (Total ~2.5 Minutes / 150 Seconds)

| Shot # | Time | Build Mode | On-Screen Visual | Spoken Narration Script | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Shot 1** | 0:00–0:20 (20s) | Demo mode | Full browser window on main stage (`Chapter 1: Living Room`). Highlight the presentational HUD (`LevelXpBar`, `ProgressChip`, `StacksBar`, `PowerChip`) and animated cat hero. | *"Judges, Taskbar Hero v2 transforms our ambient browser game into a rich dungeon crawler called Cat Café Quest. Running quietly while you browse, your cat explores 5 chapters, defeats waves of monsters, and earns loot with zero gas friction."* | **AFTER V16-V19** |
| **Shot 2** | 0:20–0:40 (20s) | Demo mode | Open the ClassPicker modal. Highlight class archetypes (Warrior, Rogue, Witch, etc.), select **Warrior**, and confirm. Show Twig Sword equipped. | *"Players choose from 7 distinct cat classes, each with unique weapons and combat passives. Our Warrior wields a Sword and splashes 50% damage every 3 hits with Cleave. Choosing a class immediately awards its starter weapon."* | **AFTER V16-V19** |
| **Shot 3** | 0:40–1:05 (25s) | Demo mode | Open the Bag tab. Highlight 9 equipment slots, character stats, and the 200-item bag limit. Click **Equip best** to show immediate stat gains. | *"Loot drops across 9 equipment slots. Players can inspect gear stat deltas, lock prized items from salvage, and click 'Equip best' to instantly optimize their build and boost overall Power."* | **AFTER V16-V19** (Isolated components READY NOW) |
| **Shot 4** | 1:05–1:25 (20s) | Demo mode | Open the Forge tab. Craft an Uncommon item using Fish, Yarn, and Fluff Tufts. Switch to Salvage sub-tab to demonstrate ~25% material recovery. | *"In the Forge, players craft guaranteed rarities matching their highest cleared stage. Salvaging returns roughly 25% of materials, ensuring craft-then-salvage cycles cannot be exploited."* | **AFTER V16-V19** (Isolated components READY NOW) |
| **Shot 5** | 1:25–1:55 (30s) | Demo mode | Open Boss Gate panel at Round 10. Point out the 1 Cat Key cost and boss stats. Click **Fight**. Show Phaser arena combat replay, boss slams, victory, and the **First-Clear Chest** modal awarding 1 Moon Pearl. | *"At Round 10, face the chapter boss Yarn Giant in a server-verified battle. Defeating the boss spends a Cat Key and unlocks the First-Clear Chest, awarding guaranteed Moon Pearls, gear, and access to the next chapter. If you lose, your key is refunded and you take a brief 60-second catnap."* | **AFTER V16-V19** |
| **Shot 6** | 1:55–2:15 (20s) | Live build | Switch to live site on Avalanche Fuji. Open Forge -> Relic tab. Combine 30 Yarn and 1 Moon Pearl. Trigger wallet pop-up (Core / MetaMask) and mint the daily Relic NFT. Show Fuji explorer transaction. | *"Every day, combine materials to forge an exclusive daily Relic. The server verifies your milestone and signs an EIP-712 voucher, allowing you to mint an authentic ERC-1155 NFT on Avalanche Fuji for zero platform fees."* | **AFTER CUT-OVER** |
| **Shot 7** | 2:15–2:30 (15s) | Live build / Demo | Open the in-game **Help** tab. Show responsive mobile layout at 390px. Concluding wrap-up slide. | *"With instant zero-gas RPG progress, deep crafting economies, and verifiable on-chain digital collectibles on Avalanche, Taskbar Hero makes Web3 gaming effortless. Thank you!"* | **AFTER V16-V19** |

---

## 3. Shot Status Legend

- **`READY NOW`**: Components and unit logic exist on `main` and can be tested in isolation (Forge panel, Bag panel, Help tab).
- **`AFTER V16-V19`**: Requires V16 (Stage + HUD wiring) and V19 (Phaser Boss Arena) to be merged on `main`.
- **`AFTER CUT-OVER`**: Requires V29 cut-over flag flip on production to capture live Avalanche Fuji wallet transaction confirmation.
