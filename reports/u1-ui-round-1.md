STATUS: DONE

# MISSION AGU1 — UI Round 1 Report

## 1. Overview
- **Mission**: MISSION AGU1 — UI round 1: stage idle at "Boss ready", right-panel layout, Forge, Bag, Boss, mobile footer.
- **Branch**: `ai/antigravity-u1-ui-round-1`
- **Base commit**: `6b2f8b4` (`origin/main`, after PR #220 "wallet-free test mode")
- **Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`
- **Deliverables**: Code changes across Tier 1 (and required Tier 2 test updates), 15 PNG screenshots in `reports/u1-ui-round-1/`, this report, and branch pushed to `origin/ai/antigravity-u1-ui-round-1`.

---

## 2. Implementation by Piece

### Piece 1 — Make the halted stage look intentional
- **Root Cause & Presentation Fix**:
  - Halted stage when `bossReady(state)` or `state.progress.gated` is intentional per game logic, but previously froze the scene with the hero and monster standing at contact distance with full HP bars and conflicting corner/banner text ("Boss ready — open Boss" vs "Chapter complete").
  - `apps/web/src/game/stage/StageScene.ts`: When `this.stopped()` is true, the hero maintains a calm idle cycle (breathing/idle animation). The monster is kept at distance (`this.homes[1]`) instead of fighting contact distance, and `drawGround()` clears and suppresses HP bars during halts.
  - `apps/web/src/game/stage/StageCanvas.tsx`: Added `onSelectTab` callback. When halted for boss-ready, the canvas banner displays a 44px primary action button `"Fight the boss"` which switches directly to the Boss tab (`onSelectTab('Boss')`). The preview text was unified from `'Chapter complete'` to `'Boss ready'`. When halted for `gated`, the banner renders `"Too strong — equip better gear"` and a button `"Open Bag"` (`onSelectTab('Bag')`), with preview text unified to `'Frontier blocked'`.
  - `apps/web/src/game/stage/stage.css`: Styled `.stage-banner-btn`, `.stage-banner-text`, and `.stage-moment.is-actionable`.
  - Normal fighting remains completely unchanged; motion respects `prefers-reduced-motion`.

### Piece 2 — Right panel tab bar clipping & mobile navigation
- **Desktop/Tablet Tab Bar**:
  - Converted `.v2-tabs .v2-tab` in `apps/web/src/layout/layout.css` from horizontal row layout with fixed width to a balanced vertical column layout (`flex: 1 1 0; min-width: 0; padding: 4px 2px; font-size: 11px;`). All 6 tabs (`Character`, `Bag`, `Boss`, `Forge`, `Market`, `Help`) fit comfortably side-by-side with zero horizontal scroll at $\ge 1024$ and at 1280. Accessible tablist role and exact tab names preserved.
- **Mobile Bottom Navigation**:
  - In `.v2-nav .v2-tab`: Adjusted font size, padding, and letter-spacing (`font-size: 11px; letter-spacing: -0.3px; padding: 4px 1px; min-width: 0; text-overflow: clip;`) so `"Character"` is cleanly displayed and never truncated to `"Characte..."` on 390px or 320px screens.

### Piece 3 — Panel headings and sticky areas
- **Single Heading per Panel**:
  - In `apps/web/src/layout/layout.css`, styled `.v2-tabpanel-title` as the canonical panel header for panels (`font-size: 1rem; color: var(--accent); padding: 8px 12px 0;`).
  - For Boss panel: `.v2-tabpanel:has(.boss-gate-panel) .v2-tabpanel-title { display: none; }` prevents duplicate headings and ensures the boss header and portrait are not pushed down or cropped under the panel top edge.
  - In `apps/web/src/layout/character/CharacterPanel.tsx`: Changed `"Mochi the cat"` from `<h2>` to `<div className="v2-character-name">`, leaving exactly one heading `"Character"` per panel.
  - In `apps/web/src/layout/forge/ForgePanel.tsx`: Removed the redundant duplicate header `<div className="forge-panel-title">Forge Workshop</div>`.

### Piece 4 — Forge tabs spacing, footnote, and notice placement
- **Footnote & Overlap**:
  - In `apps/web/src/layout/forge/ForgePanel.tsx`: Added `craftResult?: ReactNode; relicFooter?: ReactNode;` props. Wrapped Relic tab content in `<div className="forge-relic-scroll">` and placed the daily relic limit footnote below the action area inside the scroll container.
  - In `apps/web/src/layout/forge/ForgePanel.css`: Added mobile bottom padding (`calc(var(--nav-h, 56px) + env(safe-area-inset-bottom, 0px) + var(--sp-4, 16px))`) to `.forge-relic-scroll`, `.forge-craft-scroll`, and `.forge-items-list`. The footnote flows below content inside the scroll area and is reachable by scrolling.
- **Notice/Toast Placement**:
  - Moved `.v2-action-notice` inside the panel header in `StageLayout.tsx`, positioned above the panel tabs/content so it never covers buttons or obscures active inputs.
- **Relic & Odds Grid**:
  - Set `.forge-odds-list` to a balanced 4-column grid on desktop and 2-column grid on phone. Standardized card padding and spacing with `--sp-*` tokens.

### Piece 5 — Bag panel improvements
- **Equip Best Button & Status Note**:
  - In `apps/web/src/layout/bag/bag.css`: Converted `.bag-footer` to a flex column with proper padding. Styled `.bag-equip-best` as a standard 44px primary button. Positioned `.bag-equip-best-note` to wrap naturally below the button within the panel width.
- **Rarity Select**:
  - Styled `.sort-select` with a custom SVG arrow, `appearance: none`, border, box-shadow, and custom focus ring matching the retro aesthetic.
  - In `StageLayout.tsx`, removed `select` from the initial panel auto-focus query so the dropdown does not steal focus with a raw browser ring on tab switch.
- **Empty State**:
  - Tightened `.bag-empty` padding from 24px/16px to 12px/12px and icon size from 32px to 24px.

### Piece 6 — Boss panel and World Map
- **World Map Layout**:
  - In `apps/web/src/layout/boss/BossGatePanel.tsx`: Added `children?: ReactNode;` to `BossGatePanelProps` and rendered `{children}` inside `.boss-gate-scroll`.
  - In `apps/web/src/layout/StageLayout.tsx`: Nested `<ChapterMap ... />` inside `<BossGatePanel>`.
  - In `apps/web/src/map/ChapterMap.css`: Replaced the absolute desktop winding S-curve (which caused cards like "Cucumber Scare" to clip off-panel at 400px panel widths) with a clean vertical list (`display: flex; flex-direction: column; width: 100%;`). Hid the desktop SVG path (`.v2-map-path-svg { display: none; }`).
  - Enforced single-line unlock text with ellipsis on locked chapter cards (`.v2-map-locked-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`).
  - Dimmed locked cards clearly (`opacity: 0.55; filter: grayscale(0.6);`).
- **FIGHT Button Visibility**:
  - The FIGHT button is rendered in `.boss-gate-actions` (sticky/pinned at the bottom of `boss-gate-panel`, directly above the mobile navigation bar on phone viewports). It remains visible and reachable without scrolling past the World Map.

### Piece 7 — Top bar and stage framing
- **Top Bar Status Grouping**:
  - In `apps/web/src/layout/StageLayout.tsx`: Grouped the status notes (`.v2-mode-note` and `.v2-sync-status-slot`) into a unified `<div className="v2-topbar-status">` container next to `<div className="v2-wallet"><WalletButton />...</div>`.
  - In `apps/web/src/layout/layout.css`: Styled `.v2-topbar-status` with clean badge framing (`background: var(--surface-2); border: 1px solid var(--border); border-radius: 4px; padding: 4px 8px;`). On mobile, positioned `.v2-topbar-status` cleanly next to the wallet icon button.
- **Stage Framing**:
  - In `apps/web/src/layout/layout.css`: Updated `.v2-stage` background from pitch-black `var(--bg-canvas, #150f1d)` to `var(--bg, #1a1220)` (the theme backdrop color), eliminating dark bands above and below the canvas at 1280x720 and seamlessly letterboxing the 16:9 canvas.
- **Responsive Viewport Verification**:
  - Verified across `1280x720`, `1024x600`, `390x844`, `320x568`, and `844x390`. Zero horizontal document scroll, zero console errors.

---

## 3. Test Cases (T1 – T11)

| Test Case | Description | Result | Evidence |
|:---|:---|:---:|:---|
| **T1** | Demo `bossReadyStrong` 1280x720: hero in idle (no weapon swing cue for 3 s via `data-stage-impact` remaining unset); banner shows "Fight the boss"; clicking it selects Boss tab | **PASS** | Verified via Playwright: `canvas.getAttribute('data-stage-impact')` was null across 3 s of observation; `.stage-banner-btn` text is `"Fight the boss"`; click switches `aria-selected` to Boss tab. |
| **T2** | Gated fixture (`bossReadyWeak` at level 1 on chapter 2): banner "Too strong — equip better gear", button opens Bag | **PASS** | Verified via Playwright: banner text contains `"Too strong"`; clicking `"Open Bag"` selects Bag tab (`aria-selected="true"`). |
| **T3** | Fresh fixture: hero attacks and `data-stage-impact` appears (normal fight unchanged) | **PASS** | Verified via Playwright: `data-stage-impact` attribute appears within 1.3 s (`"240"`), confirming attack animations fire. |
| **T4** | All six tabs visible with no horizontal scroll in tablist at 1280x720, 1024x600, 390x844 (bottom bar) | **PASS** | Verified at all 3 viewports: `scrollWidth <= clientWidth + 1`. On 390x844, `"Character"` label text is complete and not truncated to `"Characte..."`. |
| **T5** | Document has no horizontal scroll and no vertical page scroll at 1280x720, 390x844, 320x568, 844x390 for every tab | **PASS** | Verified via `node tools/ui-audit.mjs` across all 4 viewports and 6 tabs. Output: `"no automatic findings"`. |
| **T6** | Forge Relic at 390x844: footnote not overlapped, last element reachable by scrolling the panel | **PASS** | Verified via Playwright: `.forge-note` scrolls into view without overlap; `noteBox.y + noteBox.height <= navBox.y + 1`. |
| **T7** | Bag Equip best button height equals other buttons, label inside the panel width | **PASS** | Verified via Playwright: button height $\ge 44\text{px}$ (exact: 44px); note text wraps within panel width bounds. |
| **T8** | Boss panel World Map has no horizontal scroll, FIGHT visible on 390x844 | **PASS** | Verified via Playwright: `.v2-chapter-map` has `scrollWidth <= clientWidth + 1`; `.boss-fight-btn` is visible in viewport without scrolling. |
| **T9** | Existing a11y spec (`e2e/a11y.spec.ts`) passes, tab roles/names unchanged | **PASS** | `e2e/a11y.spec.ts` passed completely in both 390px and 1280px modes. Tab roles and names remain exact. |
| **T10** | Classic build (`VITE_GAME_V2=0`) and classic Playwright project pass | **PASS** | `VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build` passed cleanly; classic Playwright suite passed 38/38 tests. |
| **T11** | Full shared-rules suite incl. `pnpm test:e2e` green | **PASS** | `pnpm test:e2e` passed 235/235 tests across `v2-server`, `v2-loop`, `classic`, and `stage-layout`. |

---

## 4. Tier 2 Changes & Rationale

Per shared rules, test updates outside the immediate zone are permitted only when strictly required by card requirements, with old $\to$ new documented:

### 1. `apps/web/src/game/stage/StageCanvas.test.tsx`
- **Reason**: Assertion updated to reflect Piece 1 requirement replacing ambiguous corner preview text `"Chapter complete"` with `"Boss ready"` / `"Frontier blocked"`.
- **Diff**:
```diff
- expect(screen.getByText('Chapter complete')).toBeTruthy();
+ expect(screen.getByText('Boss ready')).toBeTruthy();
```

### 2. `apps/web/e2e/ui/g2-shell.spec.ts`
- **Reason**: In lines 132, 218, 257, and 308, tests clicked the Boss tab and targeted the panel's primary action button with `getByRole('button', { name: /Fight|Rematch/i })`. Before this mission, the stage canvas had no button. Piece 1 added a canvas banner button `"Fight the boss"`, creating a Playwright strict-mode violation (2 matching buttons) for loose regex `/Fight|Rematch/i`. Anchored the regex to `/^(Fight|Rematch)$/i` to target the panel action button.
- **Diff**:
```diff
- const fightBtn = page.getByRole('button', { name: /Fight|Rematch/i });
+ const fightBtn = page.getByRole('button', { name: /^(Fight|Rematch)$/i });
```

---

## 5. Problems Found and Fixed During the Run

1. **ui-audit executable path failure on macOS**:
   - `apps/web/tools/ui-audit.mjs` hardcoded `/opt/pw-browsers/chromium` which exists on Linux sandbox environments but not macOS. Added fallback to Playwright's installed chromium binary.
2. **Double headings in panel views**:
   - `ActivePanel` rendered an orange `<h2 className="v2-tabpanel-title">`, while panels (`ForgePanel`, `CharacterPanel`) rendered duplicate internal headings ("Forge Workshop", "Mochi the cat"). Configured `.v2-tabpanel-title` as the canonical panel header and removed internal duplicates, while hiding `.v2-tabpanel-title` on Boss panel where the boss name is already the header.
3. **World Map horizontal overflow at desktop widths**:
   - `ChapterMap.css` had an absolute desktop winding layout (`left: 82%`) with `min-height: 520px` that applied whenever window width $> 680\text{px}$. Inside a 400px side panel at 1280px screen resolution, cards bled off the right edge and chapter names clipped to "Cucumb...". Changed default map layout to a responsive vertical list without the SVG path.
4. **FIGHT button pushed below viewport by World Map**:
   - `<ChapterMap>` was originally rendered after `<BossGatePanel>`, causing the map to push or hide the fight button. Moved `ChapterMap` inside `BossGatePanel`'s scroll area as `children`, keeping the FIGHT button sticky in `.boss-gate-actions` at the bottom of the panel above the phone navigation bar.
5. **Craft result notice visibility in QA suite**:
   - In `e2e/qa/s3-walkthrough.spec.ts:107`, crafting expected `.v2-action-notice` to appear. Added `setNotice` call on craft completion in `StageLayout.tsx`.

---

## 6. Verification Logs Summary

- **`CI=true pnpm install --frozen-lockfile`**: Lockfile up to date, resolution skipped, 0 errors.
- **`pnpm gen:deno && git diff --exit-code -- supabase/functions`**: Wrote 18 Edge Function import maps, git diff clean.
- **`pnpm typecheck`**: Passed across all 6 workspace packages (auth, chain, game-rules, api-contract, supabase/tests, apps/web).
- **`pnpm lint`**: Passed across all workspace packages.
- **`pnpm test`**: Passed all workspace packages (104 files passed, 1,246 tests passed in `apps/web`).
- **`pnpm build`**: Built production bundle in 4.8 s with 0 errors.
- **`VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build`**: Classic production build succeeded in 375 ms.
- **`cd apps/web && pnpm test:e2e`**: 235 passed in 54.1 s across all 4 Playwright projects (`v2-server`, `v2-loop`, `classic`, `stage-layout`).
- **`node tools/ui-audit.mjs` (demo & signed-in)**: Zero automatic findings, zero document scrolls across 1280x720, 390x844, 320x568, and 844x390.

---

## 7. Other UI Problems Observed (For Future UI Rounds)

During manual inspection and visual audit across all screens and viewports, the following issues were noted for subsequent UI polish waves:

1. **Market Tab Empty / Unconnected State**:
   - When viewing Market without a wallet connected, the panel displays a generic text message with minimal visual hierarchy or guidance on what Relics can be traded.
2. **Help Tab Content Density on Phone (320x568)**:
   - On 320x568, the Cat Café Guide text blocks have slightly tight vertical line heights and headings could use clearer section dividers.
3. **Boss Card Power Bar Scale at Very High Power**:
   - In `BossGatePanel`, when the player's power exceeds 10,000 while the boss power is 0 (ready state), the "Boss" power bar drops to near-zero width, which could be stylized with an explicit "Cleared / Ready" badge rather than an empty bar.
4. **Item Detail Comparison Card in Bag on 320px**:
   - The Bag item detail comparison card at the bottom of the inventory grid takes substantial vertical space on very short mobile screens (320x568), requiring scrolling to see both the bag grid and the full comparison box. A collapsible detail sheet or drawer would improve ergonomics.
5. **HUD Level-Up / XP Bar Animation Smoothing**:
   - On fast claim increments, the HUD XP progress bar jumps abruptly rather than animating with a brief linear fill transition.
6. **Class Picker Portrait Frame Alignment on Tablet (600–1023px)**:
   - When resized between 600px and 720px width, the three class selection cards in `ClassPicker` wrap awkwardly into 2+1 rows instead of a responsive 3-column or single-column stack.

---

## 8. Git Diff Stat & Screenshots

### Git Diff Stat
```
 apps/web/e2e/ui/g2-shell.spec.ts                 |   8 +-
 apps/web/src/game/stage/StageCanvas.test.tsx     |   4 +-
 apps/web/src/game/stage/StageCanvas.tsx          |  43 +++++-
 apps/web/src/game/stage/StageScene.ts            |   4 +-
 apps/web/src/game/stage/stage.css                |   7 +-
 apps/web/src/layout/StageLayout.tsx              | 160 ++++++++++++-----------
 apps/web/src/layout/bag/bag.css                  |  61 +++++++--
 apps/web/src/layout/boss/BossGatePanel.tsx       |   6 +-
 apps/web/src/layout/character/CharacterPanel.tsx |   2 +-
 apps/web/src/layout/forge/ForgePanel.css         |  31 +++--
 apps/web/src/layout/forge/ForgePanel.tsx         |  17 ++-
 apps/web/src/layout/layout.css                   |  87 ++++++++++--
 apps/web/src/map/ChapterMap.css                  |  91 +++++--------
 apps/web/tools/ui-audit.mjs                      |  23 +++-
 14 files changed, 349 insertions(+), 195 deletions(-)
```

### Screenshots in `reports/u1-ui-round-1/`
15 PNG files captured via `tools/ui-audit.mjs` (all $<200\text{KB}$):
- `home-1280x720.png` (66 KB) — Halted stage at Boss ready with "Fight the boss" primary button, topbar grouping, backdrop framing.
- `character-1280x720.png` (66 KB) — Character panel with single heading, all 6 tabs visible without scroll.
- `bag-1280x720.png` (60 KB) — Bag panel with styled sort select and standard 44px "Equip best" button.
- `boss-1280x720.png` (65 KB) — Boss panel with uncropped portrait, vertical World Map, and FIGHT button.
- `forge-craft-1280x720.png` (69 KB) — Forge Craft tab with consistent spacing and toast placement.
- `forge-salvage-1280x720.png` (86 KB) — Forge Salvage tab.
- `forge-relic-1280x720.png` (95 KB) — Forge Relic tab with 4-column odds grid and flowed footnote.
- `market-1280x720.png` (45 KB) — Market tab.
- `help-1280x720.png` (110 KB) — Cat Café Guide.
- `home-390x844.png` (43 KB) — Phone portrait home stage with 16:9 canvas and unclipped "Character" bottom nav tab.
- `character-390x844.png` (43 KB) — Phone Character panel with bottom nav clearance.
- `bag-390x844.png` (42 KB) — Phone Bag panel with full-width Equip best button and wrapped note.
- `boss-390x844.png` (32 KB) — Phone Boss panel with sticky FIGHT button above bottom nav and vertical chapter cards.
- `forge-craft-390x844.png` (46 KB) — Phone Forge Craft tab.
- `forge-relic-390x844.png` (58 KB) — Phone Forge Relic tab with 2-column odds grid and unoverlapped footnote.
