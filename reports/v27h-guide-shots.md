STATUS: DONE
STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda

# Card G6 (A24b) Report: Real v2 Screenshots & Demo Script Refresh

## 1. Summary
Captured the complete set of authentic Cat RPG v2 screenshots in demo mode (`VITE_GAME_V2=1`) using Playwright against the live Phaser stage, HUD, and arena stack on `ai/codex-v16-stage`. Embedded the screenshots into `docs/play-v2.md` and refreshed `docs/demo-script-v2.md` to remove all `(pending V16/V19)` placeholders now that every interactive walkthrough flow has been verified end-to-end.

## 2. Gate Output
```text
$ git log origin/main..origin/ai/codex-v16-stage --oneline | head -5
fd318c4 docs: record verified v16 stack and stage screenshots
6971b3e test(e2e): seed midGame save in character-bag spec
a9bc9a7 fix: read mock storage key from source in e2e spec
2402b89 test: type injected server mock in storeV2 test
16911ac docs: record verified v19 arena report and screenshots

$ git branch --show-current
ai/antigravity-v27h-guide-shots
```

## 3. Captured Screenshots (`docs/screenshots/v2/`)
Captured 40 screenshots at 1280x720 (desktop) and 390x844 (phone) across both dark and light modes:
- **Class Picker**: `class-picker-1280-dark.png`, `class-picker-1280-light.png`, `class-picker-390-dark.png`, `class-picker-390-light.png`
- **Stage with HUD**: `stage-hud-1280-dark.png`, `stage-hud-1280-light.png`, `stage-hud-390-dark.png`, `stage-hud-390-light.png`
- **Bag Panel**: `bag-1280-dark.png`, `bag-1280-light.png`, `bag-390-dark.png`, `bag-390-light.png`
- **Character Panel**: `character-1280-dark.png`, `character-1280-light.png`, `character-390-dark.png`, `character-390-light.png`
- **The Forge**: `forge-1280-dark.png`, `forge-1280-light.png`, `forge-390-dark.png`, `forge-390-light.png`
- **Chapter Map**: `map-1280-dark.png`, `map-1280-light.png`, `map-390-dark.png`, `map-390-light.png`
- **Boss Gate Panel**: `boss-gate-1280-dark.png`, `boss-gate-1280-light.png`, `boss-gate-390-dark.png`, `boss-gate-390-light.png`
- **Phaser Boss Arena**: `arena-1280-dark.png`, `arena-1280-light.png`, `arena-390-dark.png`, `arena-390-light.png`
- **Chest Reveal**: `chest-reveal-1280-dark.png`, `chest-reveal-1280-light.png`, `chest-reveal-390-dark.png`, `chest-reveal-390-light.png`
- **Help Tab**: `help-tab-1280-dark.png`, `help-tab-1280-light.png`, `help-tab-390-dark.png`, `help-tab-390-light.png`
- **Canonical Aliases**: Copied canonical short aliases (`class-picker.png`, `stage-livingroom.png`, `inventory-equip.png`, `boss-battle.png`, `boss-win.png`, `forge-craft.png`, `bag-warning.png`, `chapter-map.png`) to support existing pitch documentation.

## 4. Documentation Updates
1. **`docs/play-v2.md`**:
   - Synced base text from `ai/antigravity-v27g-guide-text`.
   - Embedded screenshots under Class Picker, HUD Bar, Help Tab, Mobile Layout, 9 Equipment Slots, Bag Management, Boss Arena, Boss Gate, Chest Reveal, The Forge, and Light Mode theme sections.
2. **`docs/demo-script-v2.md`**:
   - Updated table Steps 2, 5, 6, 7, 8 from `*(pending V16/V19)*` to `Verified (V16/V19 stack)`.
   - Removed `(pending V16/V19)` tags from Scene narration headings in Section 3.
   - Updated Section 4 demo storage key to `taskbar-hero:v2-demo:1` (`MOCK_V2_STORAGE_KEY`).

## 5. Verification
- `node scripts/check-links.mjs docs/play-v2.md`: 47 links/paths checked, 0 errors.
- `node scripts/check-links.mjs docs/demo-script-v2.md`: 24 links/paths checked, 0 errors.
- `pnpm gen:deno`: 18 Edge Function import maps verified, 0 drift.
- `pnpm typecheck`: 0 errors across all 6 workspace projects.
- `pnpm lint`: 0 errors across all 6 workspace projects.
- `pnpm test`: 1060 unit tests passed.
- `pnpm build`: Clean production build in 4.0s.
- `pnpm --filter @taskbar-hero/web test:e2e`: 85 Playwright tests passed (including classic mode, stage layout, and screenshot capture suite).

## 6. Files Touched
- `apps/web/e2e/layout/v2-screenshots.spec.ts`: Automated Playwright spec to capture the complete 40-screenshot matrix at 1280/390 in dark/light.
- `docs/screenshots/v2/*`: Captured screenshot assets and aliases.
- `docs/play-v2.md`: Embedded screenshot markdown image tags.
- `docs/demo-script-v2.md`: Updated step statuses, narration headers, and demo storage key.
- `reports/v27h-guide-shots.md`: This report.
