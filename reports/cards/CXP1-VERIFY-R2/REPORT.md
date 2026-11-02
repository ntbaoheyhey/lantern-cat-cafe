STATUS: IN-PROGRESS

# CXP1 saturated-preview repair and current integration verification

Updated 2026-11-02T10:11:52+07:00. Source2b7ceeb62a187a1064f2f307f1508326dff8ba0a is published to the existing ai/codex-cxp1 / PR240, parent64cf350. The stale local branch6b06574 and original worker checkout remain untouched. Prospective integration7393dc3b47ec1bac4786e382659b0710072b4ace includes BASE0280ff4b, current FXRB26e7de8 and CXP1. These are different heads: the four repair files match exactly, but full integration results are not relabeled as product-source or actual-main results. See source-parity.json.

## Failure and repair

At Number.MAX_SAFE_INTEGER saturation, recordClaimedKills previously published a new equal snapshot, notified subscribers and wrote storage for every further positive delta. That violated the documented unchanged-state identity contract. A new regression first failed1/17cases (16passed), exit1, at the identity assertion. capped-state-before.log and the original patch remain preserved.

The one-line guard returns only when the clamped next count equals the old count. The transition to the cap still publishes once. It changes no preview threshold, pet definition, equip rule, storage key/migration, claim observation, game state, reward, power, API call or server behavior. The numerical cap is precision/storage safety, not balance. The regression checks snapshot identity, exactly-one notification/write through the transition, no further side effects, and restored storage content. No assertion, skip, retry or timeout was weakened.

The earlier pause left only the23-line regression uncommitted and NO fix. pause-state.json and the paused direct snapshot preserve that state. After explicit resume, the repair and its documentation were committed. The first3c202d6root run is before-fix evidence; it is distinct from the fresh7393dc3root run below.

## Current evidence

| Check | Head | Actual result | Evidence |
| --- | --- | --- | --- |
| Root tests |7393dc3 |PASS, including1326web/548Supabase/383rules;2expected failures and11skips inherited |root-test-7393dc3.log |
| Root typecheck/lint |7393dc3 |PASS |typecheck-7393dc3.log;lint-7393dc3.log |
| Default/classic/v2 builds |7393dc3 |PASS, empty backend config/mock-auth0 |*-build-7393dc3.log |
| Deno generation/drift/import guard |7393dc3 |PASS,18functions clean |deno-*-7393dc3.log |
| Links |7393dc3 |72Markdown files/814paths,0missing |links-7393dc3.log |
| Bundle secret scans |7393dc3 |PASS classic andv2,0findings |bundle-classic-7393dc3.log;bundle-v2-7393dc3.log |
| Same-day gzip budget |7393dc3 vsmain1fb25ed |classic+0.407550%,v2+0.355145%,below5% |bundle-budget-7393dc3.json |
| Complete browser suite1280×720 |7393dc3 |280/280PASS,exit0 |full-1280-7393dc3.log |
| Complete browser suite1600×900 |7393dc3 |280/280PASS,exit0 |full-1600-7393dc3.log;full-1600-result.json |
| Pets browser repeat10 |7393dc3 |80/80PASS,exit0,1.2m |pets-repeat10-7393dc3.log |
| Fresh cap-contract mutations |7393dc3 |4detected,1/1/1/2assertion failures;18-case green controls before/after |mutations/result.json and logs/patches |
| Own source unit/type checks |2b7ceeb |18pets/isolation tests andwebtypePASS |source-pets-2b7ceeb.log;source-typecheck-2b7ceeb.log |

Each full browser invocation uses its stated configured desktop viewport; existing specs retain their explicit internal viewport coverage. The pets repeat is one invocation with8cases (fourperdesktopsize) repeated10times, not two separate full-suite invocations. Cases verify acknowledged counts, reload, legacy migration and corrupt-current recovery. No retries or new skips. Expected offline/429/font-blocking fixtures appear in full logs; they are controlled local test scenarios, not live-provider incidents.

Mutation1 removes the guard and breaks identity. Mutation2 keeps identity but writes storage again; mutation3 notifies subscribers again. Mutation4 wrongly drops the valid transition into the cap and fails two cases. Every failure is an assertion failure, not setup failure. Scratch production code was restored, and both green controls passed18/18. These are coordinator checks, not independent grading.

Gzip comparison reuses the verified main1fb25ed build from the same2026-11-02calendar day. Original build logs and baseline record hash are cited in bundle-budget-7393dc3.json. Main ref, web package/config, lockfile and public assets were confirmed unchanged. Candidate sizes count only directly emitted production JS/CSS assets, excluding E2E subdirectories. The classic secret scanner also covered existing generated E2E subdirectories; the production bundle was included. No new PNG delivered.

Direct commands: CI=true pnpm test/typecheck/lint; pnpm gen:deno and git diff --exit-code -- supabase/functions; pnpm build; VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build; VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web exec vite build --outDir dist-v2/verify-7393dc3; node scripts/check-links.mjs; node scripts/check-deno-imports.mjs; node scripts/check-bundle.mjs with classic/v2 paths. Builds use empty VITE_SUPABASE_URL/ANON_KEY andVITE_ALLOW_MOCK_AUTH=0.

Browser commands: pnpm --filter @taskbar-hero/web test:e2e --workers=2 with E2E_VIEWPORT=1280x720 then1600x900; pnpm --filter @taskbar-hero/web test:e2e e2e/v2/pets-preview.spec.ts --project=v2-loop --workers=1 --repeat-each=10. Prefix: CI=true SCREENSHOTS=0, empty backend env, E2E_PORT_CLASSIC/V2/SERVER/API=4340/4341/4342/4343. Current-core-results.json, log/exit pairs and final-validation.json preserve exact head/result scope. The current-core record is an earlier checkpoint, not a claim that its then-active process remains running.

## Cleanup, publication and pending gates

Owned integration7393dc3, mutant7393dc3 and source2b7ceeb checkouts are clean; all owned test sessions ended and4340–4343 are free. No helper runner/subagent was used, no manual deployment or live game-state write occurred, and no independent score or merge is claimed. Source publication may trigger the existing ignored-preview integration; an ignored green status is not a deployed build.

Verified recovery bundles: /Users/bao/.codex/handoffs/taskbar-hero/reliability/cxp1-repair-7393dc3.bundle (requires280ff4b), cxp1-source-2b7ceeb.bundle (requires64cf350). The prior3c202d6bundle and pause patch remain historical recovery evidence.

Actual-main integration after BASE0/FXRB, full remaining UI/reference/effects/a11y/G5 checks, the safe standard PR verifier on the final integrated source, independent reviews, serial merge and actualmain/live proof remain incomplete. No gate is waived. Existing published independent BASE0 grades remain separate; coordinator verification never substitutes for independent grading. Source report contains the implementation snapshot and older builder history; this ledger card is the living verification record.
