STATUS: DONE
STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda: merge that first

CL10 / Q10b: v2 Forge Relic now calls the serialized GameLoopV2 forge action through storeV2 and hands the unchanged voucher to the EXISTING v1 MintPanel. No wallet/signature/contract implementation changed. No real transaction or private key was used.

PASS: success handoff, duplicate-click deduplication, all blocked reasons with no mint call, missing wallet with no API spend/handoff, one surfaced error, server-refusal reason reload, consumed-voucher suppression while state refreshes, and the existing stored-mint confirmation retry path without another mint. Actual ForgePanel renders blocked reasons; its shared v1/v2 limit is stated in the surrounding UI. Pending vouchers resume in the existing MintPanel; demo vouchers retain its existing no-mint guard. A saved successful chain transaction is reported through the existing reportMint helper, never resent as another mint.

PASS: 23 focused tests, pinned install/gen:deno drift/typecheck/lint/full unit suite/build, 53 Playwright tests. One test setup TypeScript typo (Testing Library exact option) was corrected; assertions were preserved. Files: storeV2.ts adds forge/handoff coordination; StageLayout.tsx passes props and owns voucher/confirmation UI; game/stage/relicWiring.test.ts and relicWiring.ui.test.tsx verify mocked wallet/store/UI paths. Read-only wallet, forge/mint, chain, API and contract sources remain byte-identical. Q9 bulk-equip issue remains a release gate; this card’s existing suite does not replace Q9’s blocked regression.

Manual Fuji test — USER ONLY, not run:
1. Use a reviewed VITE_GAME_V2=1 server-mode build with the existing v2 functions deployed, connect an owned test wallet on Avalanche Fuji, and sign in via the existing SIWE flow. Do not supply a private key to any tool.
2. On an account already holding the configured Relic cost (currently 30 Yarn and 1 Moon Pearl), open Forge > Relic. With no wallet, verify the clear connect-wallet state and no spend.
3. Forge once; verify v2 costs/stacks and the voucher, then the existing Mint to wallet button/network/account guards. Approve the one Fuji transaction manually in the wallet.
4. Verify receipt and NFT in the wallet, pending voucher cleared, v2 state refreshed and today marked minted. Try v1/v2 again: the same daily limit must block a second forge.
5. Reject a wallet prompt once: one existing cancellation message should show and the voucher remain retryable. Never forge another Relic just to retry a saved transaction confirmation.
6. If a successful receipt report is interrupted, reload/sign in and use Retry saving mint confirmation; confirm that no additional transaction is requested. Inspect the existing pending/reissue recovery if the voucher expired.

NOT VERIFIED: actual JWT/gateway/deployed server, real Fuji receipt/mint/report, wallet-extension compatibility, or manual shared-limit behavior. These are the explicit user-only hard-stop checks. No deployment, new signer, contract, economy, auth or environment file edit. STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda: merge that first. Rebase dependent stacks if V16 is later fixed/rebased.

### q10b-gate.txt

```text
$ git ls-tree origin/main supabase/functions/v2-relic-forge/index.ts
100644 blob 0610d2cec8d18ac67d733ef17210873415a22f9f	supabase/functions/v2-relic-forge/index.ts
EXIT 0

$ git show ai/codex-v16-stage:reports/v16-stage.md | head -2
STATUS: DONE
STACKED ON ai/codex-v19-arena @ 16911ac0932a4fdcdaaf811672e2dc3cc9e7a61e: merge that first
EXIT 0

$ git diff --exit-code ai/codex-v16-stage -- apps/web/src/wallet apps/web/src/forge apps/web/src/api packages
EXIT 0

```

### q10b-all-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  3 passed (3)
      Tests  23 passed (23)
   Start at  12:59:24
   Duration  6.60s (tests 53%, environment 25%, import 18%, transform 4%)

    Isolate  3 workers spawned · ~605ms startup each (spawn + environment, per file)
             at least ~1.21s faster with isolate: false — reuses workers across files instead of one per file


```

### q10b-install.txt

```text
$ pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 807ms using pnpm v10.28.0

EXIT 0; runtime 0.88s

```

### q10b-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.31s

```

### q10b-typecheck.txt

```text
$ pnpm typecheck

> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck$ tsc --noEmit
packages/auth typecheck: Done
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done

EXIT 0; runtime 14.69s

```

### q10b-lint.txt

```text
$ pnpm lint

> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint$ tsc --noEmit
packages/auth lint: Done
supabase/tests lint$ tsc --noEmit
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done

EXIT 0; runtime 14.91s

```

### q10b-test.txt

```text
$ pnpm test

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  13:01:53
packages/chain test:    Duration  287ms (import 41%, transform 32%, tests 13%, worker 13%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  13:01:53
packages/auth test:    Duration  660ms (import 62%, tests 33%, transform 4%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Start at  13:01:54
supabase/tests test:    Duration  42.85s (tests 89%, import 10%)
supabase/tests test:     Isolate  18 workers spawned · ~129ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.20s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  13:01:54
packages/game-rules test:    Duration  84.34s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  13:03:19
packages/api-contract test:    Duration  212ms (transform 54%, import 36%, tests 6%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  81 passed (81)
apps/web test:       Tests  1075 passed (1075)
apps/web test:    Start at  13:03:19
apps/web test:    Duration  81.62s (environment 55%, tests 33%, import 11%, transform 1%)
apps/web test: Environment  jsdom was created 81 times · 40.47s total, 55% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 168.60s

```

### q10b-build.txt

```text
$ pnpm build

> taskbar-hero@0.0.0 build /workspace/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/chain build: Done
packages/game-rules build$ tsc --noEmit
packages/auth build: Done
supabase/tests build$ tsc --noEmit
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1793 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-D1FmkVkG.css               80.45 kB │ gzip:  14.30 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-DYmPa8U2.js                0.97 kB │ gzip:   0.58 kB
apps/web build: dist/assets/StageScene-BBYaDjE-.js            1.99 kB │ gzip:   1.00 kB
apps/web build: dist/assets/ArenaScene-B9nWnNTT.js            5.91 kB │ gzip:   2.32 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/index-DFXAZX_R.js               712.76 kB │ gzip: 111.40 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 867ms
apps/web build: Done

EXIT 0; runtime 15.41s

```

### q10b-e2e.txt

```text
$ cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright pnpm test:e2e

> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-hero/apps/web
> playwright test

[WebServer] (node:29300) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:29312) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:29337) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:29349) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
[WebServer] (node:29376) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:29388) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 53 tests using 1 worker
(node:29412) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
··························(node:29805) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
···························
  53 passed (1.1m)

EXIT 0; runtime 67.26s

```

## Files touched and reasons

```text
apps/web/e2e/layout/arena.spec.ts               |  22 ++
 apps/web/e2e/layout/character-bag.spec.ts       |  17 +-
 apps/web/e2e/layout/stage-layout.spec.ts        |  45 +++-
 apps/web/src/dev/ArenaPreview.tsx               |  13 +
 apps/web/src/game/arena/ArenaScene.test.ts      |  39 +++
 apps/web/src/game/arena/ArenaScene.ts           |  96 +++++++
 apps/web/src/game/arena/BossArena.test.tsx      |  32 +++
 apps/web/src/game/arena/BossArena.tsx           |  38 +++
 apps/web/src/game/arena/arena.css               |   8 +
 apps/web/src/game/arena/assets.ts               |  39 +++
 apps/web/src/game/arena/index.ts                |   2 +
 apps/web/src/game/arena/playBossFight.ts        |  21 ++
 apps/web/src/game/arena/playback.test.ts        |  39 +++
 apps/web/src/game/arena/playback.ts             |  28 ++
 apps/web/src/game/stage/StageCanvas.tsx         |  33 +++
 apps/web/src/game/stage/StageScene.ts           |  53 ++++
 apps/web/src/game/stage/progress.ts             |   8 +
 apps/web/src/game/stage/relicWiring.test.ts     |  41 +++
 apps/web/src/game/stage/relicWiring.ui.test.tsx |  79 ++++++
 apps/web/src/game/stage/storeV2.test.ts         |  33 +++
 apps/web/src/game/v2/storeV2.ts                 |  59 +++++
 apps/web/src/layout/StageLayout.test.tsx        |  49 +++-
 apps/web/src/layout/StageLayout.tsx             | 139 ++++++++--
 apps/web/src/layout/layout.css                  |  11 +
 apps/web/src/main.tsx                           |   2 +
 reports/v16-stage.md                            | 333 ++++++++++++++++++++++++
 reports/v16-stage/stage-1280.png                | Bin 0 -> 36093 bytes
 reports/v16-stage/stage-390.png                 | Bin 0 -> 31824 bytes
 reports/v19-arena.md                            | 300 +++++++++++++++++++++
 reports/v19-arena/1280.png                      | Bin 0 -> 31112 bytes
 reports/v19-arena/390-reduced.png               | Bin 0 -> 21169 bytes
 31 files changed, 1552 insertions(+), 27 deletions(-)
```

Report file records evidence and review gates.
