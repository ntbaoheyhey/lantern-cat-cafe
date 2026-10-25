STATUS: DONE
STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda

# Card G7 (A25 / V27i) Report: Full A11y Re-Audit of V16/V19 Stage

## 1. Summary
Performed a comprehensive accessibility and keyboard audit of the integrated V16/V19 Cat RPG v2 stage layout against `ai/codex-v16-stage`. Added a new 15-test audit suite under `apps/web/src/layout/a11y/v2-stage.a11y.test.tsx` verifying:
1. Standard landmark regions (banner, game stage, character, game panel, cat status HUD) and controls with accessible names and zero positive `tabIndex`.
2. Desktop tabs with roving focus and circular wrapping (ArrowLeft/ArrowRight, Home/End).
3. Mobile (390px) bottom navigation, bottom sheet lifecycle (`hidden={!sheetOpen}`), Escape key dismissal, and focus return to initiating nav tabs.
4. Stage canvas accessible placeholder on first run (`classId === null`) and canvas mounting once class is selected.
5. First-run ClassPicker radio group keyboard navigation and authoritative class selection.
6. Full boss combat flow: BossGatePanel -> BossArena overlay with accessible health (`aria-label="Fight health"`) and live announcements (`role="status"`) -> victory/defeat outcomes -> ChestReveal modal (`role="dialog" aria-modal="true"`).
7. BossArena "Skip fight" button accessibility: explicit accessible name, operable via keyboard, and automatically disabled once the fight ends.
8. Reduced motion propagation to stage canvas, arena, and chapter map (disabling pulse animations).
9. Modal and sheet focus return mechanisms.

All 15 new tests passed cleanly alongside the existing 38 a11y tests (53 passed across `src/layout/a11y`).

## 2. Gate Output
```text
$ git log origin/main..origin/ai/codex-v16-stage --oneline | head -5
fd318c4 docs: record verified v16 stack and stage screenshots
6971b3e test(e2e): seed midGame save in character-bag spec
a9bc9a7 fix: read mock storage key from source in e2e spec
2402b89 test: type injected server mock in storeV2 test
16911ac docs: record verified v19 arena report and screenshots

$ git branch --show-current
ai/antigravity-v27i-a11y-stage
```

## 3. Test Verification
```text
$ pnpm --filter @taskbar-hero/web exec vitest run src/layout/a11y/
 ✓ src/layout/a11y/v2-loot.a11y.test.tsx (18 tests) 170ms
 ✓ src/layout/a11y/v2-components.a11y.test.tsx (20 tests) 193ms
 ✓ src/layout/a11y/v2-stage.a11y.test.tsx (15 tests) 1954ms

 Test Files  3 passed (3)
      Tests  53 passed (53)
   Duration  2.61s
```
- `pnpm gen:deno`: 18 Edge Function import maps checked, 0 drift.
- `pnpm typecheck`: 0 errors across all workspace packages.
- `pnpm lint`: 0 errors across all workspace packages.
- `pnpm build`: Clean production build.

## 4. Findings & Recommendations for Post-Cutover Polish
- **Finding A25a-1 (Previously identified in G1)**: `BossGatePanel.tsx` line 186 passes `title="Cat Key"` to `<PixelIcon>`, rendering `<svg role="img" aria-label="Cat Key">` instead of `aria-hidden="true"`, causing screen readers to announce "Cat Key" twice adjacent to `<span>Keys: N</span>`. Recommendation: Remove `title="Cat Key"` so `<PixelIcon>` defaults to decorative `aria-hidden="true"`.
- **Finding A25i-1 (Mobile Sheet Initial Focus)**: When tapping a nav tab on mobile (390px), focus remains on the tapped nav tab rather than moving into the opened sheet (e.g., to the close button or the tabpanel header). When the sheet is dismissed, focus returns cleanly to the nav tab. Recommendation: Add an `autoFocus` or `ref.current.focus()` to the sheet close button or tabpanel on open to improve screen reader orientation for mobile assistive technologies.

## 5. Files Touched
- `apps/web/src/layout/a11y/v2-stage.a11y.test.tsx`: 15 comprehensive accessibility and keyboard audit tests for StageLayout, BossArena, and ChestReveal.
- `reports/v27i-a11y-stage.md`: This report.
