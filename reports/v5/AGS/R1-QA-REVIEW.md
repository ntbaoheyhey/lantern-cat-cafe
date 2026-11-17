# REFILL-R1: Live QA Review on Milestone v5-m1 (Demo URL)

- **URL**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`
- **Commit/Tag**: `v5-m1` @ commit `b26cf0e3c2626c1f8a02e09e3cd447e4bf0507a3` (merged tip)
- **Capture UTC Range**: `2026-11-17T08:19:31Z` to `2026-11-17T08:19:59Z`
- **Viewports**: Desktop `1280x720` (deviceScaleFactor: 1) & Mobile `390x844` (deviceScaleFactor: 2, iPhone 14 standard)
- **Review Journey**: Landing (`Entrance.tsx`) -> Café Hub / Dashboard (`ui-v3`) -> Prepare Squad Modal -> Mid-Battle (WebGL 3D Arena) -> Battle Outcome & Victory Receipt

---

## 1. Executive Summary & Status

Fresh live automated QA was executed via Chrome CDP (`work/v5/AGS/qa_r1.mjs`) on debug port 6352 across both Desktop (1280x720) and Mobile (390x844) viewports.

- **Desktop Experience (1280x720)**: Fully functional. Navigation, squad formation, battle canvas, combat speed acceleration (4x), and victory outcome transition execute smoothly. Zero critical runtime crashes.
- **Mobile Experience (390x844)**: Blocked by open layout overflow bug (H2-F1). Primary "Fight" CTA sits at $x=628\text{ px}$, outside the 390px viewport bounds.
- **Blockchain Verification (All Viewports)**: Victory receipt lacks on-chain Avalanche transaction proof, explorer link, or gasless sponsorship badge (H2-F2).

---

## 2. Findings & Re-Verification Status Table

| ID | Severity | What a Judge Sees | Steps to Reproduce | Measured Telemetry | Status on `v5-m1` | Owner |
|:---:|:---:|---|---|---|:---:|:---:|
| **H2-F1** | **MAJOR** | **Mobile Café Hub Bottom Bar Overflow Hides Primary "Fight" CTA**: On 390px mobile viewport, primary action button "Fight: Your first adventure" (`.uv-patrol`) sits at `x: 628px`, `w: 220px`. The button is located entirely off-screen (`isPatrolVisibleInViewport: false`). A mobile judge cannot start a battle without horizontal panning. | 1. Open demo URL at 390x844.<br>2. Complete guest entrance to Café Hub.<br>3. Inspect bottom navigation bar.<br>4. Notice "Fight" CTA is at x=628px off-screen. | `patrolRect: { x: 628, y: 715, w: 220, h: 103 }`<br>`isPatrolVisibleInViewport: false`<br>`innerWidth: 390` | **OPEN (MAJOR)** | CXI |
| **H2-F2** | **MAJOR** | **Battle Receipt Lacks Avalanche Blockchain Proof (Tx Hash, Fuji Explorer, Gasless Badge)**: Completing a battle displays a victory modal with cat XP and loot, but contains zero visible Avalanche references (`hasTxHash: false, hasFuji: false, links: []`). In a web3 hackathon judging review, judges expect instant verifiable proof of blockchain activity. Without a Fuji transaction hash or Snowtrace explorer link, the game appears entirely off-chain. | 1. Open demo URL, enter battle, reach victory screen.<br>2. Inspect receipt modal.<br>3. Notice absence of tx hash, gas sponsor badge, or Fuji link. | `hasTxHash: false`<br>`hasFuji: false`<br>`hasGasFee: false`<br>`links: []` | **OPEN (MAJOR)** | CXI |
| **H2-F3** | **MINOR** | **Mobile Prepare Squad Modal Seats Compressed to 48.5px Width**: In the Prepare Squad modal on 390px mobile viewport, the 4 cat seat slots (`.c2-seat`) compress to 48.5px wide vertical slivers (`w: 48.55px, h: 140.17px`), causing hero portraits and names to crowd tightly. | 1. Open demo URL at 390x844.<br>2. Click "Fight" to open Prepare modal.<br>3. Inspect the 4 cat squad slots. | `seats: 4 slots`<br>`width: 48.55px`<br>`height: 140.17px` | **OPEN (MINOR)** | CXI |
| **H2-F4** | **MINOR** | **Cold Start Ellipsis Placeholder on Landing Stat Chips**: On initial landing before backend data resolves, counters display `…` placeholder dots ("… Deeds", "… YARN burned", "… Fused", "… Fuji tx"). | 1. Clean cache and load landing page.<br>2. Observe counter chips before API response. | `hasEllipsis: true`<br>`chips: ['… Deeds', '… YARN', ...]` | **OPEN (MINOR)** | CXI |

---

## 3. Fresh Visual Evidence

- **Desktop Contact Sheet (1280x720)**: `reports/v5/AGS/r1/desktop_sheet.jpg` (217 KB)
  - Panel 1: Landing screen with "Play free" CTA and stat chips.
  - Panel 2: Café Hub with full desktop navigation and visible Fight button (`x=1022px`).
  - Panel 3: Prepare Squad modal (4 cats selected, slot width = 189px).
  - Panel 4: WebGL combat arena (1280x720 canvas).
  - Panel 5: Victory outcome receipt.
- **Mobile Contact Sheet (390x844)**: `reports/v5/AGS/r1/mobile_sheet.jpg` (79 KB)
  - Panel 1: Mobile Landing screen.
  - Panel 2: Mobile Café Hub (proving `x=628px` overflow of Fight button outside 390px viewport).
  - Panel 3: Mobile Prepare Squad modal (48.5px slot width).
  - Panel 4: Mobile WebGL combat arena (270x190 canvas).
  - Panel 5: Mobile Victory outcome receipt.

Raw uncompressed PNGs stored in `work/v5/AGS/r1/`.  
Machine telemetry recorded in `reports/v5/AGS/r1/summary.json`.
