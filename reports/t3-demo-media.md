STATUS: DONE

# MISSION T3: Demo Build Verification, Media Kit & Submission Documentation

## 1. Per-Piece Status Summary

| Piece | Scope | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Piece 1** | Rebuild static v2 demo from today's main & smoke test | **PASS** | Base commit: `6d493b0a9a7ef811df215c980603a94d8b94116b`. Build composite hash: `8585fa1a5792cbe3d7ef4732bccb6818dcbb6dbceb895bf0cb745d725cdb3b0b`. Smoke-tested locally in headless Chromium: first-run onboarding, class selection, idle combat loop, bag/inventory, forge, boss gate/arena, and victory loot reveal. |
| **Piece 2** | Media kit in `reports/t3-demo-media/` | **PASS** | 12 screenshots (8 desktop at 1600x900, 4 mobile at 390x844), all dark theme, no debug overlays, no empty states. PNG sizes: 12 KB to 60 KB (compressed with `pngquant`, well under 200 KB/300 KB limits). 2 animated GIFs (1.0 MB and 1.3 MB) + 2 MP4 clips (184 KB and 275 KB) generated via `ffmpeg` (well under 5 MB limit). |
| **Piece 3** | Written pieces (`submission.md`, `demo-script-v2.md`, `judge-walkthrough.md`, `pitch-outline.md`) | **PASS** | Updated with exact v2 mechanics (7 classes, 5 chapters, Relic 30 Yarn + 1 Moon Pearl recipe, EIP-712 vouchers on Avalanche Fuji testnet). `node scripts/check-links.mjs` exits 0 (0 broken links across 51 markdown files and 718 checked links). |

---

## 2. Problems Found & Fixed

### A. Product Bugs Discovered (Listed per Rule — NOT Fixed in Source)
1. **Outdated Copy in `HowToPlay.tsx` Modal Dialog**:
   - **File**: `apps/web/src/onboarding/HowToPlay.tsx`
   - **Observed**:
     - Step 4 reads: *"Forge a Relic with 30 Yarn and 1 Cat Key to earn on-chain collectibles."* In v2 game rules (`packages/game-rules/src/v2/config.ts`), the Relic recipe is strictly **30 Yarn + 1 Moon Pearl** (`FORGE_RELIC_YARN_COST = 30`, `FORGE_RELIC_MOON_PEARL_COST = 1`).
     - Step 2 reads: *"Defeat Chapter Bosses to earn Moon Pearls (5 fights a day)."* In v2, boss fights are gated by **Cat Keys** (1 key consumed per win, preserved on loss with 60s cooldown), not a flat 5 fights/day limit.
   - **Evidence**: Visible in [01-title.png](t3-demo-media/01-title.png).
   - **Action**: Listed for owner/developer patch; source left untouched per Tier 3 rules.

2. **Overlay Click Interception on High-Stats Instant Boss Resolution**:
   - **File**: `apps/web/src/v2/BossTab.tsx` / `LootChestRevealDialog.tsx`
   - **Observed**: If a save profile enters a boss arena with high damage power, combat finishes almost instantly. The `.loot-backdrop` modal opens immediately, overlaying the arena buttons before the player or automation can click "Skip fight".
   - **Action**: Handled gracefully in automated capture script by checking dialog visibility; documented as an edge-case UI transition.

### B. Documentation Inconsistencies Fixed
1. **Outdated Relic Recipe Claims**:
   - Fixed claims in `docs/submission.md` and `docs/pitch-outline.md` stating Relics required Cat Keys. Corrected to 30 Yarn + 1 Moon Pearl.
2. **Backticked Filename Linking in `scripts/check-links.mjs`**:
   - `check-links.mjs` treats any inline backticked filename ending in `.png` or `.gif` as a relative path to disk. In `docs/demo-script-v2.md` and `docs/pitch-outline.md`, backticked filenames inside links were causing 34 link resolution failures. Converted all link labels to clean Markdown links (`[01-title.png](../reports/t3-demo-media/01-title.png)`).
   - Link check now exits 0 with 0 broken links.

---

## 3. Tier 2 Changes

**None.** No files outside the assigned zone (`docs/**`, `reports/**`) were modified.

---

## 4. Git Diff

### `git diff --stat origin/main...HEAD`
```text
 docs/demo-script-v2.md                    | 162 ++++++-----------
 docs/judge-walkthrough.md                 | 137 +++++++++++++++
 docs/pitch-outline.md                     | 281 +++++++++---------------------
 docs/submission.md                        | 107 +++++++-----
 reports/t3-demo-media.md                  | 269 ++++++++++++++++++++++++++++
 reports/t3-demo-media/01-title.png        | Bin 0 -> 40789 bytes
 reports/t3-demo-media/02-class-pick.png   | Bin 0 -> 30593 bytes
 reports/t3-demo-media/03-idle-loop.png    | Bin 0 -> 39105 bytes
 reports/t3-demo-media/04-bag.png          | Bin 0 -> 37181 bytes
 reports/t3-demo-media/05-forge-reveal.png | Bin 0 -> 30809 bytes
 reports/t3-demo-media/06-chapter-map.png  | Bin 0 -> 30806 bytes
 reports/t3-demo-media/07-boss-arena.png   | Bin 0 -> 38456 bytes
 reports/t3-demo-media/08-result.png       | Bin 0 -> 61792 bytes
 reports/t3-demo-media/09-phone-stage.png  | Bin 0 -> 16643 bytes
 reports/t3-demo-media/10-phone-bag.png    | Bin 0 -> 14459 bytes
 reports/t3-demo-media/11-phone-boss.png   | Bin 0 -> 12170 bytes
 reports/t3-demo-media/12-phone-forge.png  | Bin 0 -> 12996 bytes
 reports/t3-demo-media/13-idle-loop.gif    | Bin 0 -> 1029931 bytes
 reports/t3-demo-media/13-idle-loop.mp4    | Bin 0 -> 188091 bytes
 reports/t3-demo-media/14-boss-fight.gif   | Bin 0 -> 1337269 bytes
 reports/t3-demo-media/14-boss-fight.mp4   | Bin 0 -> 281278 bytes
 21 files changed, 610 insertions(+), 346 deletions(-)
```

### `git diff --name-only origin/main...HEAD`
```text
docs/demo-script-v2.md
docs/judge-walkthrough.md
docs/pitch-outline.md
docs/submission.md
reports/t3-demo-media/01-title.png
reports/t3-demo-media/02-class-pick.png
reports/t3-demo-media/03-idle-loop.png
reports/t3-demo-media/04-bag.png
reports/t3-demo-media/05-forge-reveal.png
reports/t3-demo-media/06-chapter-map.png
reports/t3-demo-media/07-boss-arena.png
reports/t3-demo-media/08-result.png
reports/t3-demo-media/09-phone-stage.png
reports/t3-demo-media/10-phone-bag.png
reports/t3-demo-media/11-phone-boss.png
reports/t3-demo-media/12-phone-forge.png
reports/t3-demo-media/13-idle-loop.gif
reports/t3-demo-media/13-idle-loop.mp4
reports/t3-demo-media/14-boss-fight.gif
reports/t3-demo-media/14-boss-fight.mp4
reports/t3-demo-media.md
```

---

## 5. Verification Outputs

### pnpm and Node Version
```text
$ pnpm --version && node --version
10.28.0
v26.11.1
```

### Dependency Installation (`CI=true pnpm install --frozen-lockfile`)
```text
$ CI=true pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 381ms using pnpm v10.28.0
```

### Deno Generation Drift Check
```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
(exit code: 0, zero drift)
```

### Static v2 Demo Build
```text
$ VITE_GAME_V2=1 VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" pnpm --filter @taskbar-hero/web build
> @taskbar-hero/web@0.1.0 build /Users/bao/taskbar-hero/apps/web
> tsc -b && vite build

vite v5.4.14 building for production...
transforming...
✓ 195 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.63 kB │ gzip:  0.37 kB
dist/assets/index-D7G9wX9u.css     24.78 kB │ gzip:  5.43 kB
dist/assets/index-CLhWw_t1.js     342.12 kB │ gzip: 98.49 kB
✓ built in 312ms
```

- **Base Commit Hash**: `6d493b0a9a7ef811df215c980603a94d8b94116b`
- **Output Directory**: `apps/web/dist`
- **Output Files SHA-256 Hashes**:
  - `dist/index.html`: `d1ba8611ea062637955ce76f9273573c9c991e5c3eefeeecb281f6211e4f40d3`
  - `dist/assets/index-D7G9wX9u.css`: `9fb3997db127e2832ea5c2005047b7fe95df4a4bf855b8efccba36fe711e58ea`
  - `dist/assets/index-CLhWw_t1.js`: `a9e6ea344d5d34190b20536ef01fb0847dd5b3318f7a83db67bc4767ba053916`
- **Composite Output Hash**: `8585fa1a5792cbe3d7ef4732bccb6818dcbb6dbceb895bf0cb745d725cdb3b0b`

### Link and Path Check (`node scripts/check-links.mjs`)
```text
$ node scripts/check-links.mjs
Checked 51 markdown files and 718 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.
```

### Full Test Suite
`full suite skipped: docs only` (all changes are confined to `docs/` and `reports/`).

---

## 6. Items NOT Verified

1. **Vercel / Hosting Deployment**:
   - The demo was built and verified locally on `http://localhost:4174`. The agent did NOT trigger `vercel deploy`, nor alter production hosting configurations or site audiences.
2. **Production Fuji Transaction Execution**:
   - Live transactions invoking `RelicNFT.sol` and `RelicMarket.sol` on Avalanche Fuji testnet using owner private keys were not broadcast. Verified via contract bytecode, ABIs, and local contract testing.
3. **Live Supabase Production Database Operations**:
   - No migrations were applied to live Supabase databases; server state logic was verified via deterministic game rule simulation in demo mode.

---

## 7. Human Decisions & Owner Deployment Instructions

### How the Owner Must Publish the Static Demo & Keep It Owner-Only

The static v2 demo artifact is located in `apps/web/dist`. To publish this demo safely for judges while keeping it restricted:

#### Step 1: Deploy to Vercel (or Cloudflare Pages)
1. In the Vercel dashboard, create a new project or deployment pointing to the repository branch `ai/antigravity-t3-demo-media` (or the merged branch).
2. Set the build configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `.`
   - **Build Command**: `VITE_GAME_V2=1 VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" pnpm --filter @taskbar-hero/web build`
   - **Output Directory**: `apps/web/dist`
   - **Install Command**: `pnpm install`

#### Step 2: Restrict Access to Owner / Judges Only
To ensure the demo remains private and protected prior to submission:
- **Option A (Vercel Password Protection)**:
  1. In the Vercel project, go to **Settings > Deployment Protection**.
  2. Toggle **Password Protection** to `Enabled`.
  3. Set a secure passphrase for judges (e.g. provide the password in the contest submission text).
- **Option B (Vercel Authentication)**:
  1. Toggle **Vercel Authentication** to `Enabled` so only team members with Vercel accounts can view.
  2. *Note*: For contest judges, Option A (Password Protection) or a private unlisted deployment URL is strongly recommended so judges do not require a Vercel team invite.

#### Steps the Agent Could NOT Verify
- The agent cannot access the owner's Vercel dashboard or configure Vercel Deployment Protection settings. The owner must perform the deployment clicks in the dashboard directly.

---

## 8. Media Kit File Inventory (`reports/t3-demo-media/`)

All files created from the local v2 build at commit `6d493b0a9a7ef811df215c980603a94d8b94116b`:

| Filename | Type | Dimensions | Size | Description |
| :--- | :---: | :---: | :---: | :--- |
| `01-title.png` | PNG | 1600x900 | 40 KB | First-run onboarding modal ("How to play") over dark Living Room stage |
| `02-class-pick.png` | PNG | 1600x900 | 30 KB | Hero selection interface displaying all 7 feline classes and passives |
| `03-idle-loop.png` | PNG | 1600x900 | 38 KB | Ambient stage canvas with active combat, floating numbers, HUD stats |
| `04-bag.png` | PNG | 1600x900 | 36 KB | 9 equipment slots, character stats, populated bag, "Equip best" button |
| `05-forge-reveal.png` | PNG | 1600x900 | 30 KB | Forge Workshop with slot selector, rarity picker, recipes, material costs |
| `06-chapter-map.png` | PNG | 1600x900 | 30 KB | World Map across 5 chapters, cleared markers, Boss Gate card |
| `07-boss-arena.png` | PNG | 1600x900 | 38 KB | Boss Arena canvas with Yarn Giant telegraphs, health bars, battle log |
| `08-result.png` | PNG | 1600x900 | 60 KB | First-Clear Chest reward dialog with loot breakdown and Moon Pearl drop |
| `09-phone-stage.png` | PNG | 390x844 | 16 KB | Mobile viewport: responsive Living Room stage, HUD bar, bottom navigation |
| `10-phone-bag.png` | PNG | 390x844 | 14 KB | Mobile viewport: responsive character equipment card and inventory bag |
| `11-phone-boss.png` | PNG | 390x844 | 12 KB | Mobile viewport: responsive boss gate card and chapter progression |
| `12-phone-forge.png` | PNG | 390x844 | 13 KB | Mobile viewport: responsive equipment forge workshop and recipes |
| `13-idle-loop.mp4` | MP4 | 1280x720 | 184 KB | Animated idle combat loop showing continuous damage numbers & timer |
| `13-idle-loop.gif` | GIF | 640x360 | 1.0 MB | Compact animated GIF loop of idle stage combat (12 fps) |
| `14-boss-fight.mp4` | MP4 | 1280x720 | 275 KB | Animated boss encounter from gate entrance to victory chest reveal |
| `14-boss-fight.gif` | GIF | 640x360 | 1.3 MB | Compact animated GIF of full boss fight sequence (12 fps) |

*Compression details*:
- PNGs: Quantized and stripped using `pngquant --quality 70-85 --strip`. All PNGs are well under the 200 KB / 300 KB budget.
- Animations: Captured via Playwright Chromium video recording, converted to H.264 MP4 and 2-pass palette-optimized GIF via `ffmpeg`. All files are well under the 5 MB budget.

---

## 9. Reproduction Instructions

1. **Check out branch**:
   ```bash
   git fetch origin +main:refs/remotes/origin/main
   git checkout ai/antigravity-t3-demo-media
   ```
2. **Build static v2 demo**:
   ```bash
   VITE_GAME_V2=1 VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" pnpm --filter @taskbar-hero/web build
   ```
3. **Verify build hash**:
   ```bash
   find apps/web/dist -type f -exec shasum -a 256 {} + | sort -k 2 | shasum -a 256
   # Result: 8585fa1a5792cbe3d7ef4732bccb6818dcbb6dbceb895bf0cb745d725cdb3b0b
   ```
4. **Preview locally**:
   ```bash
   pnpm --filter @taskbar-hero/web exec vite preview --port 4174
   ```
5. **Run link verification**:
   ```bash
   node scripts/check-links.mjs
   ```
