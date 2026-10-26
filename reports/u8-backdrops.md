# UI Card U8: Chapter Backdrops (u8-backdrops)

STATUS: DONE

## 1. Overview & What Was Done
Card U8 redesigned all five chapter backdrops (`kitchen`, `livingroom`, `bathroom`, `basement`, `rooftops`) and the `BackdropView.tsx` renderer to ensure compositions look cohesive and balanced across all viewports (from 390px mobile up to 1600px wide screens) and make actors pop:
1. **Composition & Width Scaling**: Designed each backdrop with a fixed 160-px hero tile that centers hero props (`near` layer) cleanly on screen when width exceeds tile width. Wall and floor (`far` layer) seamlessly tile horizontally without repeating hero props unnaturally.
2. **Actor Framing & Props Placement**: Added 2-3 original cat-themed props per room placed on the far left (`x <= 34`) and far right (`x >= 122`) of the center hero area, leaving `x = 35..121` completely unobstructed so the cat (`width * 0.3`) and monster (`width * 0.7`) stand clear in the foreground.
   - **Livingroom**: Velvet armchair and floor lamp on left; scratching post / cat tree and yarn basket on right.
   - **Kitchen**: Cozy cat bowl with fish emblem and shelf with cat treats on left; refrigerator with cat magnets and potted cat grass on right.
   - **Bathroom**: Laundry basket with towels on left; washstand with mirror, bathtub edge, and rubber ducky on right.
   - **Basement**: Cozy cat cardboard box bed and boiler pipes on left; copper wall pipes, lantern, and storage crates on right.
   - **Rooftops**: Chimney with perched cat silhouette and crescent moon on left; TV antenna and city skyline water tower on right.
3. **Depth, Lighting, and Vignette**:
   - Far wall toned one step darker and desaturated compared to original base backdrops.
   - Contrast floor line placed at `floorY: 84` ensuring crisp separation against actor paws.
   - Discrete pixel-art stepped warm ambient light pool ellipses (`#ffd488`, `#ffe099`) centered on the wall behind the actors.
   - Discrete pixel-art edge vignette bands darkening the outer 12% strips on the left and right (`#040206` opacity stepped from 0.65 to 0.25).
4. **Original Art Guarantee**:
   - 100% original pixel art hand-authored directly for this task. No third-party assets, libraries, or external artwork used.
   - Each room file has its full palette listed in a comment at the top of the file, preserving the original hue families.
5. **BackdropView API & Playwright Suite**:
   - Maintained `BackdropView` props and export API unchanged.
   - Created `apps/web/e2e/ui/u8-backdrops.spec.ts` testing all 5 rooms across `1600x900` and `390x844`.
   - Verified outer 10% strips luminance < center strip across all 5 rooms and viewports with 0 console errors.
   - Captured and committed 11 PNG screenshots (< 200 KB each) in `reports/u8-backdrops/`.

## 2. Tooling & Environment
- pnpm version command:
  ```
  npx -y pnpm@10.28.0 --version
  10.28.0
  ```
- Playwright project: `classic` project executed `e2e/ui/u8-backdrops.spec.ts` against `dist-v2` (`baseURL: 'http://localhost:4174'`).

## 3. Files Touched

Against base branch commit `577faae` (`origin/ai/codex-integrate-v2-stage`):
```
 apps/web/e2e/ui/u8-backdrops.spec.ts        | 126 +++++++++++++
 apps/web/src/art/backdrops/BackdropView.tsx | 159 +++++++++----
 apps/web/src/art/backdrops/basement.ts      | 319 +++++++++++++-------------
 apps/web/src/art/backdrops/bathroom.ts      | 275 ++++++++++++-----------
 apps/web/src/art/backdrops/kitchen.ts       | 307 +++++++++++++------------
 apps/web/src/art/backdrops/livingroom.ts    | 313 +++++++++++++-------------
 apps/web/src/art/backdrops/rooftops.ts      | 333 +++++++++++++++-------------
 reports/u8-backdrops.md                     |  (new report)
 reports/u8-backdrops/after-basement-1600.png    | Bin 0 -> 13247 bytes
 reports/u8-backdrops/after-basement-390.png     | Bin 0 -> 5519 bytes
 reports/u8-backdrops/after-bathroom-1600.png    | Bin 0 -> 12228 bytes
 reports/u8-backdrops/after-bathroom-390.png     | Bin 0 -> 4704 bytes
 reports/u8-backdrops/after-kitchen-1600.png     | Bin 0 -> 11187 bytes
 reports/u8-backdrops/after-kitchen-390.png      | Bin 0 -> 4801 bytes
 reports/u8-backdrops/after-livingroom-1600.png  | Bin 0 -> 10183 bytes
 reports/u8-backdrops/after-livingroom-390.png   | Bin 0 -> 4188 bytes
 reports/u8-backdrops/after-rooftops-1600.png    | Bin 0 -> 12211 bytes
 reports/u8-backdrops/after-rooftops-390.png     | Bin 0 -> 4496 bytes
 reports/u8-backdrops/before-kitchen-1600.png    | Bin 0 -> 7268 bytes
```

## 4. Verification & Real Checks Output

### 4.1 `pnpm install --frozen-lockfile`
```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 291ms using pnpm v10.28.0
```

### 4.2 `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```
> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-u8
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
(exit code 0, no diff drift)
```

### 4.3 `pnpm typecheck`
```
> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-u8
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/api-contract typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
(all 6 workspace projects passed tsc cleanly)
```

### 4.4 `pnpm lint`
```
> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-u8
> pnpm -r lint

Scope: 6 of 7 workspace projects
(all 6 workspace projects passed lint cleanly)
```

### 4.5 `pnpm test`
```
> taskbar-hero@0.0.0 test /private/tmp/taskbar-hero-u8
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test: 12 passed
packages/chain test: 7 passed
packages/game-rules test: 332 passed
supabase/tests test: 385 passed
packages/api-contract test: 16 passed
apps/web test: 1082 passed (83 test files)
Total: 1834 tests passed
```

### 4.6 `pnpm build`
```
> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-u8
> pnpm -r build

Scope: 6 of 7 workspace projects
(all packages built successfully in 5.1s)
```

### 4.7 Backdrop Vitest Tests
```
> @taskbar-hero/web@0.0.0 test /private/tmp/taskbar-hero-u8/apps/web
> vitest run src/art/backdrops

 ✓ src/art/backdrops/types.test.ts (10 tests)
 ✓ src/art/backdrops/backdrops.test.ts (4 tests)
 ✓ src/art/backdrops/BackdropView.test.tsx (7 tests)
Test Files  3 passed (3)
     Tests  21 passed (21)
```

### 4.8 Playwright E2E UI Backdrops Spec (`e2e/ui/u8-backdrops.spec.ts`)
```
> @taskbar-hero/web@0.0.0 test:e2e /private/tmp/taskbar-hero-u8/apps/web
> playwright test e2e/ui/u8-backdrops.spec.ts

Running 10 tests using 1 worker
[livingroom 1600x900] outer: 14.46, center: 53.99
·[livingroom 390x844] outer: 15.56, center: 48.68
·[kitchen 1600x900] outer: 18.06, center: 60.57
·[kitchen 390x844] outer: 18.67, center: 54.45
·[bathroom 1600x900] outer: 17.20, center: 59.05
·[bathroom 390x844] outer: 17.77, center: 53.09
·[basement 1600x900] outer: 16.74, center: 57.98
·[basement 390x844] outer: 17.40, center: 52.03
·[rooftops 1600x900] outer: 9.53, center: 46.24
·[rooftops 390x844] outer: 10.86, center: 41.40
·
  10 passed (11.4s)
```

### 4.9 Regression Layout Tests
- `apps/web/e2e/layout/stage-redraw.spec.ts`: 2 passed (both actors visible across 12 viewport sizes in both reduced-motion modes).
- `apps/web/e2e/layout/resize.spec.ts`: 2 passed.

## 5. Acceptance Checklist

- [x] PASS: Base branch established from `origin/ai/codex-integrate-v2-stage` @ `577faae`.
- [x] PASS: 5 chapter rooms composed with clear centers and calm horizontal wall/floor tiling.
- [x] PASS: 2-3 original cat props per room left/right of center, leaving `x = 35..121` clear between the two actors.
- [x] PASS: Far walls darkened/desaturated, floor band with clear contrast at `floorY: 84`, soft warm light pool behind actors.
- [x] PASS: Original art only; palette comments present at the top of all 5 room files.
- [x] PASS: BackdropView API and exported names preserved exactly.
- [x] PASS: Existing backdrop unit tests pass (`types.test.ts`, `backdrops.test.ts`, `BackdropView.test.tsx` - 21 tests).
- [x] PASS: `stage-redraw.spec.ts` and `resize.spec.ts` pass unchanged.
- [x] PASS: `apps/web/e2e/ui/u8-backdrops.spec.ts` passes 10/10 tests at 1600x900 and 390x844 with zero console errors and outer 10% strip luminance strictly lower than center strip.
- [x] PASS: Screenshot gallery captured in `reports/u8-backdrops/`: exactly 11 PNGs, each < 200 KB (sizes range from 4.1 KB to 13 KB).
- [x] PASS: Full verification suite passed (pnpm install, gen:deno drift, typecheck, lint, test, build).
- [x] PASS: Allowlist strictly honored. No forbidden files touched (`StageScene.ts`, `StageCanvas.tsx`, contracts, db migrations, secrets untouched).
- [x] PASS: Git author verified as `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.

## 6. NOT Verified
- Live Supabase database writes or live production deployment (strictly forbidden by shared rules).
