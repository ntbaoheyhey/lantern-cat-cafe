# H2: Judge's-Eye QA Review of Milestone v5-m1 (Demo Route)

- **URL**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`
- **Commit/Tag**: `v5-m1` @ commit `b26cf0e3c2626c1f8a02e09e3cd447e4bf0507a3` (merged tip)
- **Capture UTC Range**: `2026-11-17T06:51:20Z` to `2026-11-17T06:51:51Z`
- **Viewports**: Desktop `1280x720` (deviceScaleFactor: 1) & Mobile `390x844` (deviceScaleFactor: 2, iPhone 14 standard)
- **Review Journey**: Landing (`Entrance.tsx`) -> Café Hub / Dashboard (`ui-v3`) -> Prepare Squad Modal -> Mid-Battle (WebGL 3D Arena) -> Battle Outcome & Victory Receipt

---

## Findings Table

| ID | Severity | What a Judge Sees | Steps to Reproduce | Evidence | Owner |
|:---:|:---:|---|---|---|:---:|
| **H2-F1** | **MAJOR** | **Mobile Café Hub Bottom Bar Overflow Hides Primary "Fight" CTA**: On 390px mobile viewport, the primary action button "Fight: Your first adventure" (`.uv-patrol`) sits at `x: 628px`, `w: 220px` inside an 848px wide bottom group. Because the viewport is 390px wide, the button is located entirely off-screen (`isPatrolVisibleInViewport: false`). A mobile judge cannot start a battle without horizontal panning. | 1. Open demo URL at 390x844.<br>2. Complete guest entrance to Café Hub.<br>3. Inspect bottom navigation bar.<br>4. Notice "Fight" CTA is located at x=628px off-screen. | `reports/v5/AGS/h2/mobile_sheet.jpg` (panel 2) | CXI |
| **H2-F2** | **MAJOR** | **Battle Receipt Lacks Avalanche Blockchain Proof (Tx Hash, Fuji Explorer, Gasless Badge)**: Completing a battle displays a victory modal with cat XP and loot, but contains zero visible Avalanche references (`hasTxHash: false, hasFuji: false, links: []`). In a web3 hackathon judging review, judges look for instant verifiable proof of blockchain activity. Without a Fuji transaction hash or Snowtrace explorer link, the game appears entirely off-chain. | 1. Open demo URL, enter battle, reach victory screen.<br>2. Inspect receipt modal.<br>3. Notice absence of tx hash, gas sponsor badge, or Fuji link. | `reports/v5/AGS/h2/desktop_sheet.jpg` (panel 5) & `mobile_sheet.jpg` (panel 5) | CXI |
| **H2-F3** | **MINOR** | **Mobile Prepare Squad Modal Seats Compressed to 48.5px Width**: In the Prepare Squad modal on 390px mobile viewport, the 4 cat seat slots (`.c2-seat`) compress to 48.5px wide vertical slivers (`w: 48.55px, h: 140.17px`), causing hero portraits and names to crowd tightly. | 1. Open demo URL at 390x844.<br>2. Click "Fight" to open Prepare modal.<br>3. Inspect the 4 cat squad slots. | `reports/v5/AGS/h2/mobile_sheet.jpg` (panel 3) | CXI |
| **H2-F4** | **MINOR** | **Cold Start Ellipsis Placeholder on Landing Stat Chips**: On initial landing before backend data resolves, counters display `…` placeholder dots ("… Deeds", "… YARN burned", "… Fused", "… Fuji tx"). | 1. Clean cache and load landing page.<br>2. Observe counter chips before API response. | `reports/v5/AGS/h2/desktop_sheet.jpg` (panel 1) | CXI |

---

## Captured Evidence Contact Sheets
- **Desktop (1280x720)**: `reports/v5/AGS/h2/desktop_sheet.jpg` (170 KB)
  - Panel 1: Landing Entrance & Play Free CTA
  - Panel 2: Café Hub with full desktop navigation (patrol CTA visible at x=1022px)
  - Panel 3: Prepare Squad selection (Mochi, Panko, Soot, Clover, width=189px)
  - Panel 4: WebGL combat arena (1280x720 canvas)
  - Panel 5: Victory outcome receipt
- **Mobile (390x844)**: `reports/v5/AGS/h2/mobile_sheet.jpg` (79 KB)
  - Panel 1: Mobile Landing view
  - Panel 2: Mobile Café Hub (demonstrating x=628px overflow of Fight button)
  - Panel 3: Mobile Prepare Squad (48.5px slot compression)
  - Panel 4: Mobile WebGL combat arena (270x190 canvas)
  - Panel 5: Mobile Victory outcome receipt

Raw uncompressed PNG captures preserved under `work/v5/AGS/h2/` (git-ignored).
Execution telemetry recorded in `reports/v5/AGS/h2/summary.json`.

---

## Dispatched Requests (REQ)
- **H2-F1 -> CXI**: Pin `.uv-patrol` CTA or add `flex-wrap: wrap` on viewports `<= 640px` so mobile judges can immediately start a battle without horizontal panning.
- **H2-F2 -> CXI**: Render an Avalanche Fuji transaction proof block on the battle receipt modal (simulated or gasless Fuji tx hash `0x...`, "Gas sponsored ($0.00)", and direct Snowtrace link).
