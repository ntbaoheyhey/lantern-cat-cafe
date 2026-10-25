STATUS: DONE

# Taskbar Hero: Antigravity build and private demo deployment

Date: 2026-10-26, Asia/Saigon. For Claude's later review.

## Result and authorization

The user requested a demo run and an Antigravity build, then explicitly requested deployment if possible and a report for Claude. A separate owner-private Sites demo was created and published. The existing Vercel production site, GitHub main, backend, migrations, contracts and economy were not changed. No GitHub PR, merge, workflow or real transaction was performed. Original Codex and Antigravity task branches were not rewritten or merged.

- Play: https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site
- Proposed class-art gallery: https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site/review/classes.html
- Hosting: separate owner-private Sites project, static assets only. Sites reports this separate demo's deployment type as publish/production; it is not the existing game's Vercel production deployment.
- Browser-local demo progress. Final build explicitly sets VITE_GAME_V2=1 and clears VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. No backend credential or private key was supplied to the demo.

## Builds actually performed

1. **Untouched Antigravity build:** detached checkout of ai/antigravity-v27i-a11y-stage @ 3f5548fcb197b40893bd70a4b9c207fa171b0981. Pinned pnpm frozen install and root `VITE_GAME_V2=1 pnpm build` succeeded. This branch carries Q5's actual stage and the existing Antigravity UI/art from main.
2. **Combined local review build:** detached checkout of Q9 @ 33481ce, overlaid with the selected changes below. Root build passed. The final web build used explicit demo-only environment values. This is a temporary source copy, not an integration merge or a claim that these branches are already on main.
3. **Static hosted artifact:** copied that final web output to a new Sites static source repository; added only the separate class-preview gallery copied from Antigravity's proposed PNGs. The game index and runtime class looks are unchanged by the gallery.

Antigravity's recent work mainly adds QA, guides, screenshots and proposed class previews. The recent G1/G7 QA and latest G6/G8 docs are included in the temporary copy; G3b includes G3, G6 supersedes G2 guide text, and G8 carries G4's checklist. Proposed final class looks are not activated in game; D3/D5 approval remains open. Unsigned proposed economy numbers and the cutover flag flip are not included.

## Exact inputs

| reference | immutable commit |
|---|---|
| `origin/main` | `337977751204b5ea59d8f0cabfb91fb4cd4a391f` |
| `ai/codex-v26-e2e` | `33481ce01933834876037127e2753773a9a204cc` |
| `ai/codex-v16-stage` | `fd318c4910e50152fdb0522593762288e76efbda` |
| `ai/codex-v20b-relic-wiring` | `fd1f75d85b654a3d556b8bd2cd2e44c96564c401` |
| `ai/codex-fix-bulk-equip` | `b82cddfb8f772a930642bb1b836698a84d688c8a` |
| `ai/codex-fix-decorative-key` | `096327b7c5f003013a6febabaa02125fce793a49` |
| `ai/codex-fix-sheet-focus` | `3cfcdb724b7f7d086d2059fba8f1b68bf7f72dd4` |
| `origin/ai/antigravity-v27f-a11y-hud` | `8f32b45f7dd606c2d4d4daaca92db7be68b035ee` |
| `origin/ai/antigravity-v22-class-previews` | `633f20faa3b94e9f1d440d094f4c6699ea028bf9` |
| `origin/ai/antigravity-submission-v2-draft` | `ddcd56e37f56e3f87ea7dc6f6a5700ca7573c589` |
| `origin/ai/antigravity-v27h-guide-shots` | `63248cba3188f9c0a92e9ca2debfb51f27aaeecf` |
| `origin/ai/antigravity-v27i-a11y-stage` | `3f5548fcb197b40893bd70a4b9c207fa171b0981` |
| `origin/ai/antigravity-qa-v2-1` | `163127d96257329b3f00da0f43051d6fbf5ea2b7` |

## Integration details for review

The runtime starts with Q9, which already includes Q4 arena, Q5 stage and the authorized bulk-equip fix. The temporary overlay retains Relic voucher/mint handoff from Q10b, both existing bulk-queue lifecycle protections, decorative key icon and initial mobile-panel focus. No wallet, API-contract or auth implementation is modified.

Two compatibility changes are limited to test doubles: Antigravity's stage audit mock gains the equip-queue adapter and a disconnected useAccount mock; Q10b's UI fake loop gains a no-op subscribe method required by the new queue. Assertions are preserved. The stage mock retains both focus and bulk-adapter expectations. No tests were skipped, weakened or given higher timeouts.

`reports/demo-preview/integration.patch` records all 11 changed/new source and test files relative to Q9. It applies cleanly at Q9; replayed files were compared byte for byte against the tested temporary source. This is the reviewable resolution for the shared StageLayout/store changes, not a merge instruction to bypass the existing approval gates.

`reports/demo-preview/source-lock.json` records source IDs; `deployment.json` records the successful deployment/version IDs and archive digest; `classes.html` is the exact separate review-gallery page. The gallery PNGs come from the locked Antigravity class-preview commit.

## Reproduce the runtime and tests

From a checkout containing the referenced immutable commits and this report artifact:

```sh
git worktree add --detach /tmp/taskbar-demo-review 33481ce01933834876037127e2753773a9a204cc
```

The argument is the locked full Q9 SHA. Then:

```sh
git -C /tmp/taskbar-demo-review apply --check /absolute/path/to/reports/demo-preview/integration.patch
git -C /tmp/taskbar-demo-review apply /absolute/path/to/reports/demo-preview/integration.patch
cd /tmp/taskbar-demo-review
CI=true corepack pnpm@10.28.0 install --frozen-lockfile
CI=true VITE_GAME_V2=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= corepack pnpm@10.28.0 build
corepack pnpm@10.28.0 --filter @taskbar-hero/web exec vitest run src/game/stage/bulkEquip.test.ts src/game/stage/relicWiring.test.ts src/game/stage/relicWiring.ui.test.tsx src/layout/StageLayout.test.tsx src/layout/a11y/v2-hud-boss.a11y.test.tsx src/layout/a11y/v2-stage.a11y.test.tsx
PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright corepack pnpm@10.28.0 --filter @taskbar-hero/web exec playwright test --project v2-loop
```

Use an installed Playwright browser location appropriate to Claude's host. The patch reproduces the runtime and focused tests; historical docs/screenshots can be fetched independently from the locked Antigravity references. The extra screenshot/QA1 Playwright specs were copied for review but were not run in this validation; the Q9 loop spec is unchanged.

## Verification

- PASS: untouched Antigravity root build, combined root build and explicit demo-only web build.
- PASS: 49 focused tests in six files, including both Antigravity accessibility suites, bulk equipment, Relic wiring and mobile focus.
- PASS: all 15 Q9 browser loop tests across desktop/mobile and a reduced-motion full loop. No console/page errors or horizontal overflow asserted by that suite.
- PASS: clean patch replay; all 11 changed/new runtime/test files byte-identical.
- PASS: protected config/content/auth/contracts/lock/workspace files unchanged in the temporary overlay.
- PASS: local HTTP preview returned 200; hosted backend returned succeeded and a URL. Codex browser handoff was queued; no authenticated hosted-page interaction is claimed.
- NOT VERIFIED: authenticated browser interaction against the hosted private URL, real JWT/gateway, server mode, real Fuji transaction/mint, final integrated main after future merges, the extra Antigravity QA1/screenshot specs, or a fresh whole-repository unit suite for this combined overlay. This is build + focused integration/demo QA, not a full independent code review.
- Report branch: only reports/**; frozen install + generated-map drift passed. Full suite skipped for the report commit: docs only.

## Hosting/source handling

The Sites helper scripts were not available in this executor (filesystem and skill-resource checks found no site-workflow.mjs). Registration and native private publishing tools were available. The static snapshot was committed/pushed with ordinary Git using the returned http_extra_header credential held in process memory and supplied through hidden stdin only. No credential was persisted or printed. Source remote HEAD was verified equal to the supplied full commit; a tar.gz containing .openai/hosting.json and dist/ was then packaged from that unchanged snapshot, following the native tool's static archive contract.

The native private publish returned pending, then succeeded. No retry deployment or duplicate Site creation was performed. The returned project ID was immediately persisted in the separate Site's .openai/hosting.json. This environment-specific helper fallback is recorded so Claude can prefer the standard helper when available.

## Successful deployment metadata

```json
{
  "id": "appgdep_6ade3ff368988191936b94ffd8a7e927",
  "project_id": "appgprj_6ade3ebedef081918883db27b6eb1851",
  "title": "Taskbar Hero \u2014 Private Demo",
  "version_id": "appgprj_6ade3ebedef081918883db27b6eb1851~appgver_f312222efa4c8191867b7a3a722bab8c",
  "type": "publish",
  "status": "succeeded",
  "url": "https://taskbar-hero-demo-oct26.equalvine12.chatgpt.site",
  "has_mcp": false,
  "screenshot_asset_pointer": null,
  "provider_deployment_id": "site---6ade3ebedef081918883db27b6eb1851",
  "failure_message": null,
  "env_set_revision": 0,
  "updated_at": "2026-10-25T17:44:33.846473+00:00",
  "source_commit": "7d3da052dc9754917ade195843d7108ddac876a8",
  "archive_sha256": "55f4229f7e343e4892010dc7176684e446301619a188c013af1e2743582acbc0",
  "audience": "owner-private",
  "mode": "static demo; browser-local state; no production backend"
}
```

## Selected actual command output

### antigravity-demo-install

```text
$ CI=true pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Done in 3.6s using pnpm v10.28.0
```

### antigravity-demo-build

```text
$ CI=true VITE_GAME_V2=1 pnpm build
> taskbar-hero@0.0.0 build /workspace/taskbar-antigravity-demo
> pnpm -r build
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 1.70s
apps/web build: Done
```

### combined-demo-install

```text
$ CI=true pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Done in 3.9s using pnpm v10.28.0
```

### combined-demo-build

```text
$ CI=true VITE_GAME_V2=1 pnpm build
> taskbar-hero@0.0.0 build /workspace/taskbar-demo
> pnpm -r build
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 844ms
apps/web build: Done
```

### combined-demo-static-build

```text
$ CI=true VITE_GAME_V2=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= pnpm --filter @taskbar-hero/web build
> @taskbar-hero/web@0.0.0 build /workspace/taskbar-demo/apps/web
> tsc --noEmit && vite build
✓ built in 869ms
```

### combined-demo-focused

```text
$ pnpm --filter @taskbar-hero/web exec vitest run <six explicit files above>
 Test Files  6 passed (6)
      Tests  49 passed (49)
   Duration  15.15s (tests 59%, environment 21%, import 12%, transform 7%)
```

### combined-demo-loop

```text
$ pnpm --filter @taskbar-hero/web exec playwright test --project v2-loop
  15 passed (27.7s)
```

### demo-patch-replay

```text
$ git apply --check + source byte comparison
PASS: patch applies cleanly at Q9 33481ce.
PASS: all 11 changed/new source and test files match the tested combined demo byte for byte.
```

### demo-report-install

```text
$ CI=true pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Done in 3.8s using pnpm v10.28.0
EXIT 0; runtime 3.94s
```

### demo-report-deno

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-demo-report
> node scripts/gen-deno-json.mjs
EXIT 0; runtime 0.39s
```

## Claude next steps

Review the patch before integrating the source branches; preserve both the bulk adapter and Relic handoff. Review the class gallery with the user under D3/D5. D4 remains NOT READY, D8 Founder approval/application and D6 cutover remain separate hard stops. Do not treat this separate demo deployment as approval to merge the flag flip or change production. No task branch has been merged by this work.
