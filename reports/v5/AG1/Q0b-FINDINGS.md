# Q0b: Judge's-Eye Review of v5-m0 Build (Live Demo Route)

- **URL**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`
- **Commit/Tag**: CXI Preview build commit `a1816d42915b47f6cf3697b2d3ba30b5e0169e92` (built on milestone base `v5-m0` @ `e310ccd73`)
- **Capture UTC Range**: `2026-11-17T06:06:38Z` to `2026-11-17T06:07:04Z`
- **Viewports**: Desktop `1280x720` (deviceScaleFactor: 1) & Mobile `390x844` (deviceScaleFactor: 2, iPhone 14 standard)
- **Review Flow**: Landing (`Entrance.tsx`) -> Café Hub / Dashboard -> Prepare Squad Modal -> Mid-Battle (WebGL 3D Arena) -> Battle Outcome & Victory Receipt

---

## Findings Table

| ID | Severity | What a Judge Sees | Steps to Reproduce | Screenshot Path | Owner Session |
|:---:|:---:|---|---|---|:---:|
| **Q0b-F1** | **MAJOR** | **Mobile Café Hub Bottom Bar Overflow Hides Primary "Fight" CTA**: On 390px mobile viewport, the bottom action bar extends to 848px wide without wrapping or scroll-snap. The primary CTA "Fight: Your first adventure" (`.uv-patrol`) sits at `x: 628px` to `848px`, making it completely off-screen (`isVisibleInViewport: false`). A first-time mobile judge landing on the café cannot see or start a battle without blind horizontal panning. | 1. Open `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3` at 390x844.<br>2. Complete guest entrance to Café Hub.<br>3. Inspect the bottom navigation bar.<br>4. Observe "Fight" CTA is completely off-screen to the right. | `reports/v5/AG1/q0b/mobile_02_cafe_hub_2026-11-17T06-06-56-917Z.jpg` | CXI |
| **Q0b-F2** | **MAJOR** | **Combat Action Feedback Lacks Hit Impact (Hit-Stop, Screen Shake, Slash VFX)**: In the active WebGL combat arena, hero attacks and ability ticks resolve with low visceral feedback—floating damage numbers (`-15`, `-30`) are small and fade quickly with 0ms hit-stop freeze, no camera shake impulse, and no layered slash particle textures. For a 30s judge demo, combat feel appears floaty and passive. | 1. Open demo URL and click "Fight: Your first adventure".<br>2. Click "Fight" in Prepare modal.<br>3. Dismiss tutorial tip.<br>4. Observe combat ticks during live round. | `reports/v5/AG1/q0b/desktop_04_midbattle_2026-11-17T06-06-46-842Z.jpg` | CXV |
| **Q0b-F3** | **MINOR** | **Mobile Squad Prepare Seat Slots Horizontally Compressed (49px Width)**: In the Prepare Squad modal on 390px viewport, the 4 cat seat buttons (`.c2-seat`) compress to 49px wide vertical slivers (`w: 49px, h: 140px`), making hero names and portraits optical slivers. | 1. Open demo URL on 390x844 mobile viewport.<br>2. Click "Fight" CTA.<br>3. Inspect the 4 cat squad slots in Prepare modal. | `reports/v5/AG1/q0b/mobile_03_prepare_squad_2026-11-17T06-06-58-724Z.jpg` | CXI |
| **Q0b-F4** | **MINOR** | **Cold Start Ellipsis Placeholder on Landing Counters**: On initial landing page load before API responses arrive, live counters ("Deeds", "YARN burned", "Fused", "Fuji tx") display leading `…` dots rather than clean skeleton loaders or cached defaults. | 1. Load landing page with clean cache.<br>2. Observe counter chips before API response resolves. | `reports/v5/AG1/q0b/desktop_01_landing_2026-11-17T06-06-38-662Z.jpg` | CXI |

---

## Captured Evidence Index

### Desktop (1280x720)
- `desktop_01_landing_2026-11-17T06-06-38-662Z.jpg` (1.1 MB) - Landing Hero & Action CTA
- `desktop_02_cafe_hub_2026-11-17T06-06-41-852Z.jpg` (905 KB) - Café Hub with full bottom bar & Fight CTA
- `desktop_03_prepare_squad_2026-11-17T06-06-43-612Z.jpg` (923 KB) - Squad selection (Mochi, Panko, Soot, Clover)
- `desktop_04_midbattle_2026-11-17T06-06-46-842Z.jpg` (1.0 MB) - Active WebGL combat arena
- `desktop_05_receipt_2026-11-17T06-06-50-127Z.jpg` (981 KB) - Victory outcome receipt modal
- Contact Sheet: `reports/v5/AG1/q0b/desktop_sheet.jpg` (74 KB)

### Mobile (390x844)
- `mobile_01_landing_2026-11-17T06-06-53-662Z.jpg` (949 KB) - Mobile landing view
- `mobile_02_cafe_hub_2026-11-17T06-06-56-917Z.jpg` (992 KB) - Mobile Café Hub (demonstrating Fight CTA overflow)
- `mobile_03_prepare_squad_2026-11-17T06-06-58-724Z.jpg` (1.2 MB) - Mobile squad modal (49px slot compression)
- `mobile_04_midbattle_2026-11-17T06-07-02-010Z.jpg` (922 KB) - Mobile WebGL combat view (780x438 canvas)
- `mobile_05_receipt_2026-11-17T06-07-04-307Z.jpg` (1.2 MB) - Mobile Victory outcome receipt
- Contact Sheet: `reports/v5/AG1/q0b/mobile_sheet.jpg` (73 KB)

---

## Dispatched Requests (REQ) Summary
- `Q0b-F1` -> Dispatched REQ to `INBOX-CXI.md` (pin Fight CTA or add horizontal scroll/flex-wrap to `.uv-patrol-group` on `<= 390px` viewports).
- `Q0b-F2` -> Dispatched REQ to `INBOX-CXV.md` (integrate hit-stop [40-60ms] and camera impulse shake [8-12px, 180ms decay] from L2/R2/R4 into combat hit resolution).
