# Repair log

U0 in progress. No published Lane U milestone yet.

- U0-HARNESS / FIXED: `pnpm --dir apps/web exec vite --config ../../tools/ui-v3/vite.config.ts` failed to resolve a package-directory import. Removed unnecessary defineConfig import; explicit repository root and own dependency symlink. HTTP200 verified. No runtime change.

- U1-FOCUS / FIXED pending rerun: shell.spec Escape focus check failed because opening a sheet unmounts the dock button. Preserve its destination and restore focus to the remounted control. No gameplay effect. Exact spec + G1 rerun.
- U0-PUBLISH / FIXED: connector create returned ReadTimeout and immediate search returned empty (index lag). CLI create guard found existing draft #428; no duplicate created.

- U1-DEV / FIXED pending G1: Utility.test expected legacy reviewer grants without dev=1. User section1 now explicitly forbids this. Kept all grant assertions; supplied the required dev=1 in that reviewer fixture. No test disabled or quarantined. Player gating remains tested separately.
- U1-FOCUS verification: exact browser rerun2/2PASS (u1/shell-repair.log); initial failure retained.

- U2-HOME-PERF / OPEN: CPU4 headless development-page 3D trial (tools/ui-v3/perf.mjs 3d) draws77–82 (PASS90) but cold long tasks4357–5196ms and steady855–885ms (MISS50); navigation→visible756–849ms. Renderer initialization/steady software-WebGL cost dominates. Smallest approved fix: use a B-stage poster plus B portraits; final production/offline timing remains mandatory. No timing denominator changed; development timings are not compared as production acceptance.
- U2-POSTER / FIXED: stage-only render timed out at miniature preparation. Scene defaults preload generic actor rigs; the poster has no actors. Supplied public warmModelIds=[]; exact render completed (21 source-stage draws), cafe.webp 50KB. B source unchanged.
- U2-HOME-PERF / PARTIAL until offline: fallback reduces draws to0 and steady maximum long task to0 (60s). Cold maximum task118–139ms, navigation→visible720–793ms on dev modules. G1 PASS1867, browser6/6; G7 loaded entry−3B; protected231sources exact. Offline cold acceptance stays223.3ms and must be rerun in U8.
- U3-TYPES / FIXED pending G1: the shared crew list is readonly while crewHintsV5 accepts a mutable array. Copy the list at the presentation boundary; no rule changes. Exact web typecheck and G1 queued.
- U3-HARNESS / FIXED pending rerun: Playwright loads this repository's TS config as CommonJS, so import.meta.url in the report-path correction fails before test collection. Use its actual __dirname with path.resolve. No test expectations changed; exact full new-suite rerun queued.
- U3-GUIDE / FIXED pending recheck: source review caught overly broad Spread help. Corrected to the actual Marked-knockout condition and half-stack nearest-neighbour transfer from skills-v5/reactions.ts. Uses shared V5 keyword names and status rules; no policy or gameplay edits.
- U3-SHEET / FIXED pending recheck: cafe-news actions call m.go directly; local Events state otherwise kept covering the destination. Clear Events when model screen changes away from hub. Preserve existing actions.
- U3-VISUAL / FIXED pending check:1280 screenshot exposed inherited Look portrait specificity making Team cards too tall. Scope the portrait height under .uv-app and make the detail panel independently scrollable. Existing controls stay reachable; retain initial shots and capture repaired views. Recheck full G1 and new browser suite.
- U3 final verification: source G1 passes at u3-final/ and u3-layout/ (1867webtests); full new suite11/11; accessibility20pairs0serious/critical. Corrected Team screenshot reviewed. All U3 issues above FIXED.
- U3-ROUTE-CONTROLS / OPEN → U4: presentation review found advanced chapter/band/daily/Tower controls absent from the compact Home. Restore in Route tab, preserve HomeV4 default route/band calculation through a read-only selector; no rules changes.
- U4-CTA / FIXED pending final recheck: screenshot prepare-on.webp exposed legacy global hover turning Fight purple. Added scoped primary hover tokens; no rules changed. Recheck U4 screenshots/browser and G1.
- U3-ROUTE-CONTROLS / FIXED: Route tab now preserves challenge band, chapter, daily and Tower controls; two new encounter click tests PASS. Prepare uses original model preparation API; Result shows model-derived outcome/MVP and returns Home.
- U4 final verification: G1 all PASS (u4-final/checks.txt),13browser tests PASS,24axe pairs clean; repaired gold Fight hover screenshot reviewed. U4-CTA FIXED.
