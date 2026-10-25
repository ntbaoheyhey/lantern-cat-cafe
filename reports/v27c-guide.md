# Task V27c Report: Cat RPG v2 Player Guide & Judge Demo Script

**Branch**: `ai/antigravity-v27c-guide`  
**Base Commit**: `origin/main` (`d0640ad feat(art): chapter 5 night rooftop monsters and boss pixel art (v24e) (#139)`)  
**Date**: 2026-10-25  
**Author**: ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>

---

## 1. Gate Check

Pre-flight checks performed before branch creation and author configuration:

1. **Git Author Verification**:
   ```bash
   git config user.email && git config user.name
   ```
   Output:
   ```
   108352255+ntbaoheyhey@users.noreply.github.com
   ntbaoheyhey
   ```

2. **Remote Main Fetch**:
   ```bash
   git fetch origin +main:refs/remotes/origin/main
   ```
   Exited 0.

3. **Origin Main Documentation Verification**:
   Checked existence of prerequisite docs on `origin/main`:
   ```bash
   git ls-tree origin/main docs/content-v2.md docs/api-v2.md docs/extending-v2.md
   ```
   Output:
   ```
   100644 blob eabd413bbc58fb84fff91dd4a7a8810f9435f636	docs/content-v2.md
   100644 blob 97c7392f987671474e77c6746f25a9cde87ff631	docs/api-v2.md
   100644 blob 9ddb19e153358fdaf5ffcf61af223ed94b0837ac	docs/extending-v2.md
   ```
   All 3 files exist on `origin/main`. Gate passed.

---

## 2. Word Counts of Generated Documentation

Word counts verified using `wc -w` and node whitespace tokenization:

| Document | Word Count | Target / Guidelines | Status |
| :--- | :--- | :--- | :--- |
| `docs/play-v2.md` | **1,438 words** | 900–1,500 words, player-facing, friendly | Passed |
| `docs/demo-script-v2.md` | **1,855 words** | 3–5 minute judge walkthrough in demo mode | Passed |

---

## 3. List of Numbers Not in Code / Marked "(to be tuned)"

Every cost, cap, chance, unlock level, and combat profile in `docs/play-v2.md` and `docs/demo-script-v2.md` was copied directly from `packages/game-rules` code or `docs/content-v2.md`.

- **Boss Loss Cooldown Duration**:
  - In `packages/game-rules/src/v2/config.ts` (`V2_CONFIG.boss`), there is currently no `cooldownSeconds` field defined.
  - The 60-second value is referenced in `docs/proposals/schema-v2.md` ("60 s catnap before any boss fight"), tested in `packages/game-rules/src/v2/state/state.test.ts` (`cooldownS: 60`), and verified in SQL migration tests `supabase/tests/v2/functions.test.ts` (`cooldown: 60`).
  - Because the central configuration key in `V2_CONFIG` is still awaiting final V6 balance simulation sign-off, this value is noted in the footnotes as subject to final tuning.

All other numbers match code truth:
- Bag limit: 200 items, 90% warning at 180 (`V2_CONFIG.bag`)
- Offline timing: 5 min online window, 50% offline efficiency, 8 hour cap (`CONFIG.idle`)
- Unlock levels: Level 1 for 5 main slots and collar, Level 5 earring, Level 10 ring, Level 20 charm (`GEAR_SLOTS`)
- Stat caps: 75% crit, 60% dodge, 100% attack speed, 5% HP regen, 200 ms min interval (`V2_CONFIG.caps`)
- Cat key capacity: 5 keys (`MATERIALS`)
- Forge costs & salvage returns: exact numbers from `RECIPES` and `SALVAGE`

---

## 4. Screens Marked Pending

Per task instructions, components that exist in `apps/web/src/` but are not yet wired into `apps/web/src/layout/StageLayout.tsx` on `main` are explicitly marked with `(pending V16/V19)`:

1. **Class Selection (`ClassPicker.tsx`)**:
   Component exists at `apps/web/src/layout/classpicker/ClassPicker.tsx`, but `StageLayout.tsx` does not yet render the initial class-selection modal/view.
2. **Forge Panel (`ForgePanel.tsx`)**:
   Component exists at `apps/web/src/layout/forge/ForgePanel.tsx`, but `StageLayout.tsx` currently mounts the legacy v1 `ForgeTab`.
3. **Boss Combat & First-Clear Chest Opening (`BossTab.tsx`)**:
   `StageLayout.tsx` currently mounts the v1 `BossTab` (`boss.attemptsLeft`). The v2 chapter boss gate, deterministic combat replay, and chest modal are pending tasks V16/V19.
4. **World Chapter Map (`ChapterMap.tsx`)**:
   Component exists at `apps/web/src/map/ChapterMap.tsx`, but has not yet been hooked into the stage layout navigation.

---

## 5. Anything Unsure

1. **MockGameApiV2 Storage Key**:
   `apps/web/src/api/MockGameApiV2.ts` does not yet exist on `main` (scheduled for V28). In accordance with the prompt prompt instruction, the demo storage reset documentation references `(see MockGameApiV2)`.
2. **Link Checker Scope**:
   Running `node scripts/check-links.mjs` across the entire repository outputs 52 preexisting broken paths in older markdown files on main (e.g. `og.png`, unexpanded glob patterns in `database.md`, and test screenshots in `dry-run-report.md`). When scoped to the files touched in this task (`node scripts/check-links.mjs docs/play-v2.md docs/demo-script-v2.md`), the check passes with 0 broken links.

---

## 6. Commands and Outputs

### A. Link Checker

```bash
$ node scripts/check-links.mjs docs/play-v2.md docs/demo-script-v2.md
Checked 2 markdown files and 49 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.
```

Repository-wide check:
```bash
$ node scripts/check-links.mjs
Checked 37 markdown files and 475 links/paths.

Found 52 broken link(s) or path(s) on disk:
  README.md:114 [backticked image path]
    Target: `og.png`
    Not found: og.png
  ... (51 other preexisting items on main; 0 from play-v2.md or demo-script-v2.md)
```

### B. Dependency Lockfile Check

```bash
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 410ms using pnpm v10.28.0
```

### C. Deno Code Generator & Diff Check

```bash
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```
Exited 0 with empty diff in `supabase/functions`.

### D. Git Status Verification

```bash
$ git status --short
?? docs/demo-script-v2.md
?? docs/play-v2.md
?? reports/v27c-guide.md
```
Only the three authorized documentation files were created or modified.
