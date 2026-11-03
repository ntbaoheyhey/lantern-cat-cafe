# Taskbar Hero (Cat RPG v2) — 5-Minute Judge Walkthrough

## Security in 2 minutes

Guest progress is local browser data. Authenticated progress uses wallet sign-in, verified player identity and server-computed rewards; a wallet signature does not authorize another player's rows. Local tests exercise RLS/grants, request-ID retry/ownership, per-player budgets and voucher replay/recovery. V2 budgets fail closed if their counter store is unavailable; per-IP and human-uniqueness protections remain gaps.

Open Help → On-chain proof to read the public Fuji contracts (43113). Code/linkage/events are read-only evidence, not a transaction receipt or an independent audit. The [security overview](security-overview.md) links exact source tests and explains the distinction.

PR #244 is still blocked by the missing complete deployed function backup and tested restore path. This session has not deployed the backend, changed flags/settings or completed fresh funded mint/list/buy proof. The walkthrough below is older media guidance; screen names/timings and transaction claims require the upcoming submission-pack refresh. Three starter classes are currently offered on first entry, with the broader class registry available through Hero.

## Historical gameplay walkthrough (refresh pending)

A structured, step-by-step evaluation guide for contest judges testing **Taskbar Hero (Cat RPG v2: Cat Café Quest)**.

- **Target Evaluation Time:** ~5 minutes
- **Environment:** Any modern desktop browser (Chrome, Brave, or Edge recommended)
- **Prerequisites for Part 1:** Zero. Runs locally in browser demo mode (`MockGameApiV2`) with zero crypto configuration, zero gas, and zero wallet extensions needed.
- **Prerequisites for Part 2:** Core or MetaMask browser extension connected to Avalanche Fuji testnet (Chain ID 43113) with a small amount of test AVAX from a public faucet.
- **Mechanics Reference:** For technical formulas, stat pipeline, server authority, and bounds, see [docs/mechanics-v2.md](mechanics-v2.md).

---

## Part 1: Zero-Wallet Evaluation Walkthrough (~5 Minutes)

Follow these numbered steps to experience the complete core RPG loop entirely offline in demo mode:

### Step 1: Open the Application & Onboarding
1. Navigate to the live demo URL ([https://taskbarhero-eight.vercel.app](https://taskbarhero-eight.vercel.app) or local `http://localhost:4174`).
2. Observe the dark plum "cozy cat cafe at night" aesthetic (`--bg`, `--surface`, pixel frames).
3. The **"How to play"** modal appears automatically on first visit, introducing Mochi the cat, currency loops (Fish, Yarn, Cat Keys), and the daily Relic milestone.
4. Click **Start playing** (or press `Escape`) to dismiss the onboarding modal.

### Step 2: Choose Your Hero Class
1. The **Choose Your Class** panel (`ClassPicker`) appears on screen.
2. Browse through the **7 feline classes**:
   - **Warrior** (Melee, Cleave passive)
   - **Guardian** (Melee, Bonk passive delaying enemy attacks)
   - **Rogue** (Melee, Twin Strike double attack passive)
   - **Hunter** (Reach, Mark Prey bonus damage & material find)
   - **Archer** (Ranged, Volley multi-arrow passive)
   - **Witch** (Ranged, Burn AoE splash & burn passive)
   - **Alchemist** (Ranged, Poison DoT & kill heal passive)
3. Select **Warrior** (or your preferred class) to view its stat multipliers and weapon proficiency.
4. Click **Choose Warrior** at the bottom, then click **Confirm** in the confirmation prompt.
5. The picker closes, and your cat immediately equips its matching starter weapon (the Twig Sword).

### Step 3: Experience the Ambient Stage & Live HUD
1. Look at the top **HUD bar**:
   - **Level & XP**: Shows Level 1 and a dynamic experience progress bar.
   - **Chapter & Round**: Displays `Chapter 1 · Round 1 · 0/6` (6 monster kills required per round).
   - **Currencies**: Counters for Fish (gold), Yarn (shards), and Cat Keys (max 5).
   - **Power Rating**: Live calculated rating derived from your active class and equipment.
2. Watch the large **Stage Canvas**:
   - Your cat hero animates in Chapter 1 (Living Room).
   - Regular monsters (Dust Bunny, Loose Yarn, Sock Puppet) cycle automatically with attack cadence.
   - Damage numbers float upward on hit, and defeated monsters award Fish, Yarn, and crafting materials.
   - Progress auto-claims every 30 seconds without requiring tedious manual clicks.

### Step 4: Manage Inventory & Optimize Equipment
1. Click the **Inventory** tab below the stage.
2. Inspect the **Character Panel** on the left:
   - Shows your cat portrait, active class, power rating, and **9 equipment slots** (5 main: Weapon, Helmet, Armor, Gloves, Boots; 4 accessories: Collar, Earring, Ring, Charm unlocking at Levels 5, 10, and 20).
3. Inspect the **Bag Panel** on the right:
   - Displays current bag capacity (`Bag X / 200`).
   - Items display pixel frames color-coded by rarity (Common, Uncommon, Rare, Epic, Legendary).
4. Click any item in the bag grid:
   - The comparison card at the bottom evaluates the selected piece against your currently equipped slot, displaying green positive stat deltas (+HP, +ATK, +DEF).
5. Click **Equip best** in the bag footer:
   - The game runs an instantaneous optimization algorithm, automatically equipping the highest-power combination for your class. Notice your HUD power rating increase immediately.

### Step 5: Test the Forge Workshop (Crafting & Salvaging)
1. Click the **Forge** tab.
2. Under the **Craft** subtab:
   - Select an equipment slot: **Weapon (Sword)**, **Helmet**, **Armor**, **Gloves**, or **Boots**.
   - Select a target rarity: **Common**, **Uncommon**, **Rare**, **Epic**, or **Legendary**.
   - Review the recipe cost ratio (e.g., Yarn, Fluff Tuft, Fish).
   - Click **Craft**, then click **Confirm Craft** to forge the piece. Notice the newly crafted item added to your inventory with item level scaled to your frontier stage.
3. Switch to the **Salvage** subtab:
   - Check the box next to any unwanted item.
   - Notice the guaranteed ~25% crafting material recovery yield (and 0 Fish, preventing infinite crafting exploit loops).
   - Click **Salvage Selected** and confirm to reclaim materials.
4. Switch to the **Relic** subtab:
   - Notice the daily milestone recipe: **30 Yarn + 1 Moon Pearl**.
   - Review the transparent on-chain rarity odds (Common 60%, Rare 25%, Epic 12%, Legendary 3%).

### Step 6: Explore the World Chapter Map & Boss Gate
1. Click the **Boss** tab.
2. Scroll to the **World Map** component:
   - Features 5 quest environments along a winding cobblestone path:
     - **Chapter 1: Living Room** (cleared badge or active node)
     - **Chapter 2: Kitchen** (active pulsing node)
     - **Chapter 3: Bathroom** (locked behind Ch2)
     - **Chapter 4: Basement** (locked behind Ch3)
     - **Chapter 5: Night Rooftops** (locked behind Ch4)
3. Check the **Boss Gate** card:
   - Displays the Chapter 1 Boss: **Yarn Giant**.
   - Compares your cat's power rating against the boss requirement.
   - Shows Cat Key cost (1 Cat Key). Note: Cat Keys are consumed only upon victory.

### Step 7: Enter the Boss Arena & Reveal the First-Clear Chest
1. Click the **Fight** button on the Boss Gate.
2. The **Boss Arena** launches:
   - Features real-time combat between Mochi and the Yarn Giant.
   - Live health progress bars: Cat HP vs. Boss HP.
   - Boss telegraphs standard attacks every 1,500 ms and heavy slams dealing 2.5x damage every 6,000 ms.
3. Click **Skip fight** (or watch the battle simulate to conclusion).
4. Upon defeat, the **First clear chest!** dialog opens against the chapter backdrop:
   - Click **Skip** (or watch rewards pop in sequentially).
   - Notice the rewards: **4,600 Fish**, **25 Yarn**, **5 Fluff Tuft**, gear drops, and **1 Moon Pearl** (the guaranteed daily Relic ingredient).
   - Click **Collect**. Notice Chapter 2 unlocks on the World Map!

### Step 8: Verify Browser Session Persistence
1. Refresh the page (`Cmd+R` on Mac or `F5` on Windows).
2. Observe that your cat's selected class, level, equipped gear, bag contents, currencies, and cleared chapter progress persist seamlessly from browser `localStorage` (`taskbar-hero:v2-demo:1`).

---

## Part 2: Avalanche Fuji Wallet Integration (Extra 3 Steps)

### On-chain in 3 minutes (Zero-wallet instant verification)

If you do not have a Web3 browser extension or testnet AVAX on hand, you can independently verify our entire Avalanche Fuji integration in under 5 seconds with a single terminal command:

```bash
node scripts/fuji-proof.mjs
```

This read-only script queries the public Fuji RPC (`https://api.avax-test.network/ext/bc/C/rpc`) to inspect our verified `RelicNFT` and `RelicMarket` contracts, query ERC-1155 metadata and token supplies, and fetch real `RelicForged`, `Listed`, and `Bought` transaction receipts with direct Routescan explorer links. For full step-by-step verification, sample output, contract source links, and the EIP-712 voucher architecture diagram, see [docs/avalanche-integration.md](avalanche-integration.md#verify-it-yourself-in-3-minutes).

---

To verify the real on-chain contracts and digital ownership interactively inside the web app:

### Extra Step 1: Connect Injected Browser Wallet
1. Ensure your browser has the **Core** or **MetaMask** extension installed and set to **Avalanche Fuji Testnet** (Chain ID: `43113`, RPC: `https://api.avax-test.network/ext/bc/C/rpc`).
2. Ensure your address has test AVAX for gas (available freely from the official [Avalanche Faucet](https://core.app/tools/testnet-faucet/)).
3. Click the **Get a browser wallet** / **Connect Wallet** button in the top right header.
4. Approve the connection. The mode indicator transitions from `"Demo · saved in this browser"` to `"Signed in · saved to your account"`.

### Extra Step 2: Forge & Mint Your ERC-1155 Relic NFT
1. Ensure you have beaten a chapter boss to obtain **1 Moon Pearl** and collected **30 Yarn**.
2. Navigate to the **Forge** tab and select the **Relic** subtab.
3. Click **Forge Relic**:
   - The backend checks your off-chain materials and generates an EIP-712 typed mint voucher signed with the server's private key.
4. The **MintPanel** appears displaying the voucher details (Relic ID, rarity tier, unique nonce, expiry).
5. Click **Mint to wallet**:
   - Your wallet extension prompts you to confirm the transaction to the verified `RelicNFT` contract ([`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`](https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D)).
6. Confirm the transaction. In approximately 1–2 seconds, Avalanche Fuji finalizes the block!
7. The application reconciles the transaction receipt, detects the `RelicForged` event, and confirms your Relic is permanently minted to your wallet.

### Extra Step 3: List & Trade on the RelicMarket Escrow
1. Click the **Market** tab.
2. Your newly minted Relic is displayed with its on-chain token ID, custom pixel artwork, and rarity border.
3. Enter a listing price in test AVAX (e.g., `0.05 AVAX`) and click **List for sale**.
4. Confirm the approval and deposit transaction in your wallet:
   - Your token is transferred to the autonomous `RelicMarket` contract ([`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`](https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93)).
5. The listing appears on the decentralized marketplace board. Other players can purchase it trustlessly; proceeds are credited directly to the seller in test AVAX with zero platform fees.
