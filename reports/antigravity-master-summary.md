# Antigravity Master Summary: Cat RPG v2 Remaining Queue

## Start state (origin/main @ 3379777)

### 1. `git log origin/main --oneline | head -30`
```
3379777 feat(web): v2 Help tab content (A23 / V27e) (#169)
5faabb1 feat(web): boss gate gated/no_key/rematch states (A21 / V19d) (#168)
665cab4 feat(web): presentational HUD pieces for v2 stage (A20) (#167)
67cd5ed feat(web): arena cue builder and fixtures (C14 / V19) (#166)
c95f0ce feat(functions): v2-boss-fight Edge Function and timeline big/dodged flags (C12 / V10) (#165)
cdcb0cf feat(game-rules): config-driven chapter pacing, boss strength and first-clear keys (C5d / V6e) (#164)
befd8eb docs: draft v2 pitch slide outline (card A27a) (#163)
7c99d80 docs: add class reference request sheet and screenshots (card A26) (#162)
6d7e7d8 docs: add V29 cut-over runbook (card A22) (#161)
a42765c feat(web): wire specific item icons into loot and forge, add chest room backdrop (v19c) (#157)
6ea287d C7 V11 forge functions (#158)
2ae5f7e test: raise remaining sim test timeouts to 180s (they sit at 40-60s, near the 60s limit under load) (#160)
c559e45 feat(sim): diagnose V6d rebalance and document remaining blockers (#159)
4dd8e68 C6 V9 state functions (#155)
d8a97ab test: raise sim determinism test timeout (runs take ~21s, limit was 20s) (#156)
443f307 feat(sim): document bounded V6c rebalance fallback (#154)
9ea63de A17 V24g backdrop view + map thumbnails (#153)
544263a feat(web): wire specific item icons into bag and character panels (v17b) (#152)
7eb6da5 test: add deterministic v2 demo save fixtures (#151)
1970318 test(a11y): add accessibility and reduced-motion audit for v2 components (v27d) (#150)
31689de C5 V6 balance sim + numbers proposal (#148)
3bf17cb C4 V12 demo API + v2 views (#146)
e55b8e8 feat(art): chapter backdrops pixel art format, rooms, and tests (v24f) (#143)
e0227f6 feat(boss): add v2 boss gate panel with portrait and status logic (v19b) (#142)
9e6985a A13 V19a loot components (#147)
cb6f543 feat(art): add 24 armor and accessory pixel icons with tests and report (v25c) (#149)
6aa9d25 feat(web): add isolated v2 game loop and API switch (#145)
41c5370 Add v2 Supabase browser adapter and session guard (#144)
24a3e27 docs(v2): player guide and judge demo script (V27c) (#141)
2a5825a R0: boss keyCost and lossCooldownSeconds in V2_CONFIG (#140)
```

### 2. `git ls-remote --heads origin 'ai/*'`
```
ai/antigravity-b3-ag2
ai/antigravity-b3-ag3
ai/antigravity-b5-ag6
ai/antigravity-pitch-v2
ai/antigravity-v16-hud
ai/antigravity-v17b-icons-wiring
ai/antigravity-v18-classpicker
ai/antigravity-v19a-loot
ai/antigravity-v19b-boss-gate
ai/antigravity-v19c-loot-icons
ai/antigravity-v19d-boss-gate-states
ai/antigravity-v20-forgeui
ai/antigravity-v21-map
ai/antigravity-v22-class-refs
ai/antigravity-v23-gear
ai/antigravity-v24a-ch1
ai/antigravity-v24b-ch2
ai/antigravity-v24c-ch3
ai/antigravity-v24d-ch4
ai/antigravity-v24e-ch5
ai/antigravity-v24f-backdrops
ai/antigravity-v24g-backdrop-view
ai/antigravity-v25-icons
ai/antigravity-v25b-frames
ai/antigravity-v25c-item-icons
ai/antigravity-v27a-content-docs
ai/antigravity-v27b-docs
ai/antigravity-v27c-guide
ai/antigravity-v27d-a11y
ai/antigravity-v27e-help
ai/antigravity-v29-runbook
ai/codex-b3-cx2
ai/codex-b3-cx3
ai/codex-b5-cx6
ai/codex-check-live-v2
ai/codex-s1-state
ai/codex-s1-state-r2
ai/codex-s2-bag
ai/codex-s2-bag-r2
ai/codex-v10-boss-fn
ai/codex-v11-functions
ai/codex-v12-demo
ai/codex-v16a-loop
ai/codex-v19-cues
ai/codex-v26a-fixtures
ai/codex-v3-idle
ai/codex-v4-loot
ai/codex-v4b-lootcheck
ai/codex-v5-forge
ai/codex-v6-balance
ai/codex-v6c-rebalance
ai/codex-v6d-rebalance
ai/codex-v6e-levers
ai/codex-v7b-adapter
ai/codex-v9-functions
```

### 3. `git ls-tree --name-only origin/main apps/web/src/layout/hud/ apps/web/src/layout/a11y/ apps/web/src/game/arena/ apps/web/src/game/stage/`
```
apps/web/src/game/arena/arenaFixtures.test.ts
apps/web/src/game/arena/arenaFixtures.ts
apps/web/src/game/arena/cues.test.ts
apps/web/src/game/arena/cues.ts
apps/web/src/game/arena/index.ts
apps/web/src/layout/a11y/fixtures.ts
apps/web/src/layout/a11y/v2-components.a11y.test.tsx
apps/web/src/layout/a11y/v2-loot.a11y.test.tsx
apps/web/src/layout/hud/HudBar.test.tsx
apps/web/src/layout/hud/HudBar.tsx
apps/web/src/layout/hud/LevelXpBar.test.tsx
apps/web/src/layout/hud/LevelXpBar.tsx
apps/web/src/layout/hud/PowerChip.test.tsx
apps/web/src/layout/hud/PowerChip.tsx
apps/web/src/layout/hud/ProgressChip.test.tsx
apps/web/src/layout/hud/ProgressChip.tsx
apps/web/src/layout/hud/StacksBar.test.tsx
apps/web/src/layout/hud/StacksBar.tsx
apps/web/src/layout/hud/hud.a11y.test.tsx
apps/web/src/layout/hud/hud.css
apps/web/src/layout/hud/index.ts
```

### 4. `git show origin/main:apps/web/src/layout/StageLayout.tsx | grep -n sampleState`
```
23:import { useSampleStateV2 } from './sampleState';
```
*(Prints line 23 = V16 NOT merged on main)*

### 5. `git show origin/main:docs/proposals/numbers-v2.md | grep -n "User: ____"`
```
729:User: ____ (approved / changes)
```
*(Prints line 729 = numbers unsigned)*

### 6. `git ls-tree --name-only origin/main docs/ | grep -E "v2|qa|class|submission|video"`
```
docs/api-v2.md
docs/class-refs.md
docs/class-refs
docs/content-v2.md
docs/cutover-v2.md
docs/demo-script-v2.md
docs/drop-rates-v2.md
docs/extending-v2.md
docs/licenses-v2.md
docs/play-v2.md
docs/qa-report-2.md
docs/qa-report-3.md
docs/qa-report.md
docs/qa-screenshots-2
docs/qa-screenshots-3
docs/qa-screenshots
docs/submission.md
```

---

## Progress Table

| card | DONE/PARTIAL/BLOCKED/FAILED/WAITING/DONE-ON-MAIN | branch | merged no | what the user must decide |
| :--- | :--- | :--- | :--- | :--- |
| G1 (A25a) | DONE | ai/antigravity-v27f-a11y-hud | no | Approve Finding A25a-1 fix for BossGatePanel decorative key icon |
| G2 (A24a) | DONE | ai/antigravity-v27g-guide-text | no | None (docs reflect main) |
| G3 (A28) | DONE | ai/antigravity-v22-class-looks | no | Review & approve D5 written-look fallbacks in docs/class-looks-fallback.md |
| G3b (CL7 prep) | NOT STARTED | ai/antigravity-v22-class-previews | no | - |
| G4 (A29) | NOT STARTED | ai/antigravity-v28-qa-checklist | no | - |
| G5 (A27b) | NOT STARTED | ai/antigravity-submission-v2-draft | no | - |
| G6 (A24b) | WAITING | ai/antigravity-v27h-guide-shots | no | Needs V16 stage wiring or Codex ai/codex-v16-stage |
| G7 (A25) | WAITING | ai/antigravity-v27i-a11y-stage | no | Needs V16 + V19 or Codex ai/codex-v16-stage |
| G8 (QA1) | WAITING | ai/antigravity-qa-v2-1 | no | Needs V16 + V19 or Codex ai/codex-v16-stage |
| G9 (Post-cutover) | WAITING | - | no | Waits for V29 cut-over |

### Card Details
- **G1**: Commit `8f32b45` on `ai/antigravity-v27f-a11y-hud` -> [reports/v27f-a11y-hud.md](file:///Users/bao/taskbar-hero/reports/v27f-a11y-hud.md) (`STATUS: DONE`)
- **G2**: Commit `2c4a009` on `ai/antigravity-v27g-guide-text` -> [reports/v27g-guide-text.md](file:///Users/bao/taskbar-hero/reports/v27g-guide-text.md) (`STATUS: DONE`)
- **G3**: Commit `342ac05` on `ai/antigravity-v22-class-looks` -> [reports/v22-class-looks.md](file:///Users/bao/taskbar-hero/reports/v22-class-looks.md) (`STATUS: DONE`)

---

## User must decide on return
- Finding A25a-1: Remove `title="Cat Key"` from `<PixelIcon name="key" size={2} title="Cat Key" />` in `BossGatePanel.tsx` line 186 to prevent duplicate accessible name announcement next to `<span>Keys: ...</span>`.
- Decision D5: Review proposed written looks in `docs/class-looks-fallback.md` for any class without custom user reference by 5 Nov 2026.
