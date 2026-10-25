STATUS: DONE
STACKED ON ai/antigravity-v22-class-looks @ 342ac05

# Task CL7 Prep / G3b Report: Class Art Preview Sheets

## 1. What Was Done
- Created 7 static pixel-art preview sheets under `docs/class-looks/`:
  - `docs/class-looks/warrior.png`
  - `docs/class-looks/guardian.png`
  - `docs/class-looks/rogue.png`
  - `docs/class-looks/hunter.png`
  - `docs/class-looks/archer.png`
  - `docs/class-looks/witch.png`
  - `docs/class-looks/alchemist.png`
- Each preview sheet contains the idle frame and signature attack hit frame at the rig's native frame size (`FRAME = { w: 56, h: 48 }`), rendered at both 1x (`56 × 48`) and 4x (`224 × 192`) zoom over the Cat Café dusk surface background (`#2a1f36`, `--surface`).
- Created `docs/class-looks/README.md` documenting:
  - Visual preview embeds for all 7 classes.
  - Palette hex table (`k`, `o`, `d`, `w`, `n`, `e`) derived from the G3 written-look fallback proposal (`docs/class-looks-fallback.md`).
  - Affected rig parts when wired under CL7 (`apps/web/src/game/rig/palettes.ts`, `apps/web/src/game/rig/parts.ts`, `apps/web/src/game/rig/poses.ts`, read-only).
  - Prominent notices labeling every sheet as **"PROPOSAL, needs the user's OK (D3/D5)"**.
- **NOT wired**: Confirmed zero code or palette changes were made to `apps/web/src/game/rig/`, `apps/web/src/art/`, or any runtime code.

---

## 2. Blockers
None.

---

## 3. Files Touched
```
docs/class-looks/README.md
docs/class-looks/alchemist.png
docs/class-looks/archer.png
docs/class-looks/guardian.png
docs/class-looks/hunter.png
docs/class-looks/rogue.png
docs/class-looks/warrior.png
docs/class-looks/witch.png
reports/v22-class-previews.md
```

---

## 4. Gate Check Output
- Card G3 is DONE on branch `ai/antigravity-v22-class-looks` at commit `342ac05`.
- Stacked directly on `ai/antigravity-v22-class-looks` -> PASS

---

## 5. Verification Commands Run & Real Output

- `pnpm install --frozen-lockfile`
  ```
  Scope: all 7 workspace projects
  Lockfile is up to date, resolution step is skipped
  Already up to date
  Done in 406ms using pnpm v10.28.0
  ```
- `pnpm gen:deno && git diff --exit-code -- supabase/functions`
  ```
  wrote 18 Edge Function import maps
  (exit code 0)
  ```
- `node scripts/check-links.mjs docs/class-looks/README.md`
  ```
  Checked 1 markdown files and 35 links/paths.
  ✓ All links, image paths, and backticked repo paths exist on disk.
  ```
- Full suite skipped: docs only.

---

## 6. Acceptance Checklist
- [x] Per-class static pixel-art preview sheet created for all 7 classes (`docs/class-looks/<classId>.png`).
- [x] Idle frame and attack frame rendered at 1x and 4x at native rig frame size.
- [x] Drawn from the G3 written-look proposals.
- [x] `docs/class-looks/README.md` lists palette hex per class and rig parts affected (`palettes.ts`, `parts.ts`, `poses.ts`).
- [x] NOT wired: no edits to `rig/**`, `art/**`, or game engine code.
- [x] Every sheet marked "PROPOSAL, needs the user's OK (D3/D5)".
- [x] `node scripts/check-links.mjs docs/class-looks/README.md` passed (35 links verified).

---

## 7. User Decision on Return (D3 / D5)
- Review preview sheets in `docs/class-looks/` and approve or replace proposed looks for each class before card CL7 wires them.

---

## 8. What Is Needed to Continue
- Proceed to G4 (V28 QA Checklist).
