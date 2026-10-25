STATUS: DONE

# Task V22 / A28 Report: Written-Look Fallback Sheet (D5 Prep)

## 1. What Was Done
- Created `docs/class-looks-fallback.md` providing a comprehensive written-look fallback proposal for all 7 classes (`warrior`, `guardian`, `rogue`, `hunter`, `archer`, `witch`, `alchemist` in `packages/game-rules/src/v2/content/classes.ts` registry order) for Decision D5:
  - Clear silhouette profiles (e.g. athletic upright ginger tabby for Warrior; broad stocky slate tank for Guardian; low-slung crouch for Rogue; lean wiry wildcat for Hunter; slender Siamese points for Archer; billowing lilac plume tail for Witch; asymmetric calico bobtail for Alchemist).
  - 3–4 palette colors per class as exact hex values adhering to the 6-character `BodyPalette` rig rules (`apps/web/src/game/rig/types.ts`) and Cat Café design tokens (`docs/ui-guide.md`, `apps/web/src/theme.css`).
  - Signature weapon and attack pose matching the class passives and animation strips in `docs/class-refs.md`.
  - Specific guidelines on what must stay readable at 390 px mobile view (2x scale).
  - "What to avoid" section per class to guarantee immediate visual distinction between all 7 classes.
  - Linked each class to its idle and attack screenshots in `docs/class-refs/`.
  - Prominently labeled the document as a **PROPOSAL for decision D5**, preserving user authority over class aesthetics and previews.

---

## 2. Blockers
None.

---

## 3. Files Touched
```
docs/class-looks-fallback.md
reports/v22-class-looks.md
```

---

## 4. Gate Check Output
- `docs/class-refs.md` on origin/main: Present (Card A26 #162) -> PASS
- `docs/class-looks-fallback.md` absent on origin/main: Verified absent -> PASS
- No CL7 class-art branch has changed rig palettes: Verified via `git ls-remote` (no CL7 art branches exist) -> PASS

---

## 5. Verification Commands Run & Real Output

- `pnpm install --frozen-lockfile`
  ```
  Scope: all 7 workspace projects
  Lockfile is up to date, resolution step is skipped
  Already up to date
  Done in 359ms using pnpm v10.28.0
  ```
- `pnpm gen:deno && git diff --exit-code -- supabase/functions`
  ```
  wrote 18 Edge Function import maps
  (exit code 0)
  ```
- `node scripts/check-links.mjs docs/class-looks-fallback.md`
  ```
  Checked 1 markdown files and 20 links/paths.
  ✓ All links, image paths, and backticked repo paths exist on disk.
  ```
- Full suite skipped: docs only.

---

## 6. Acceptance Checklist
- [x] All 7 classes covered (`warrior`, `guardian`, `rogue`, `hunter`, `archer`, `witch`, `alchemist`).
- [x] Silhouette detailed for each class.
- [x] 3–4 palette hex values fitting Cat Café tokens and rig pixel-art rules.
- [x] Signature weapon and attack pose matching `docs/class-refs.md`.
- [x] Readability rules for 390 px mobile width.
- [x] "What to avoid" per class to prevent cross-class confusion.
- [x] Labeled as PROPOSAL for Decision D5.
- [x] Screenshots linked to `docs/class-refs/` and verified with `check-links.mjs`.

---

## 7. User Decision on Return (D5)
- **Decision D5**: Review proposed written looks in `docs/class-looks-fallback.md` for classes without custom reference pictures before the 5 Nov 2026 cutoff.

---

## 8. What Is Needed to Continue
- Proceed to G3b (CL7 class art preview sheets stacked on `ai/antigravity-v22-class-looks`).
