# V26a: deterministic MockGameApiV2 demo saves

Branch: `ai/codex-v26a-fixtures`, based on latest fetched `origin/main` at `31689de289b578290a63a613b43f4b6ab19ba736`.

## Gate and scope

Before implementation, `git fetch origin +main:refs/remotes/origin/main` succeeded:

```text
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
```

Both gates passed: MockGameApiV2.ts exports MOCK_V2_STORAGE_KEY; mockV2Fixtures.ts is absent on origin/main. Initial working tree was clean. Git identity was corrected to the requested name and email before making commits.

```text
31689de289b578290a63a613b43f4b6ab19ba736
18:export const MOCK_V2_STORAGE_KEY = 'taskbar-hero:v2-demo:1';
PASS: mockV2Fixtures.ts absent
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
```

Files changed (only):

- `apps/web/src/api/mockV2Fixtures.ts`
- `apps/web/src/api/mockV2Fixtures.test.ts`
- `reports/v26a-fixtures.md`

No dependencies added; pnpm-lock.yaml, pnpm-workspace.yaml and generated Supabase functions are unchanged. No application module imports the fixtures. No GitHub Actions run and no PR opened. Existing workflows do not trigger on this branch push.

## Construction and behavior

All states begin with emptyState, chooseClass, addItems and equip. Starter rows come from chooseClass. Gear candidates come from applyCraft using registry recipes and fixed seed searches, with rarity-capped item levels; no owned-item objects are handwritten. The temporary crafting wallet is discarded. Candidates are filtered by class, chapter and rarity, selected by bestLoadout, equipped via equip, then reduced to the selected loadout. Utility-only unlocked slots are filled if bestLoadout finds no power increase. IDs have stable `fx:<kind>:<n>` values. Saves use the supplied clock, version 1, zero counters, founder false, and omit optional pending/todayRelic fields.

Strong fixtures use the configured maximum cat level and highest registry rarity. Weak fixtures have only the level-one class starter. ForgeRich includes an equipped starter plus exactly three unlocked spares and one locked spare; balances sum twice the costs of both recipes. BagNearFull includes equipped items in its configured threshold count.

midGame defaults to chapter 2 (minimum 2 when the chapter option defaults to 1), midway through the chapter, level 20 capped by config, with material balances from recipes, two boss-key costs and every unlocked slot equipped. Explicit chapter 3 is covered for all classes. The chapter option is otherwise validated against CHAPTERS; boss fixtures default to chapter 1.

Loss behavior: applyBossResult returns before debiting stacks. All classes and seeds 1–5 lose, return keySpent=false, omit chest, keep keyCost keys, reject immediately and just before expiry with GameApiErrorV2/cooldown, and allow another attempt at exactly lossCooldownSeconds. This is an unspent key, rather than a debit followed by refund.

Reload coverage loads each fixture/class, claims ten minutes later, verifies the saved claim timestamp, and compares persisted level/XP, currencies, inventory and frontier. The two instances' getState snapshots match exactly. claim's response carries its last simulation gate while getState recomputes gate/neededPower; those transient fields can differ for weak archer/witch frontier states. The original mock is unchanged.

180 new tests pass. Existing suite skips and expected failures are reported verbatim below; no tests were skipped, weakened or removed for this task.

## Fixture tables

Clock for every row: `2026-10-25T03:00:00Z` (`2026-10-25 10:00 UTC+7`). Tables use default options except classId.

### fresh

| classId | chapter | round | kills | level | keys | bag size | equipped items |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| warrior | 1 | 1 | 0 | 1 | 0 | 1 | weapon: wpn.sword.twig |
| guardian | 1 | 1 | 0 | 1 | 0 | 1 | weapon: wpn.hammer.mallet |
| rogue | 1 | 1 | 0 | 1 | 0 | 1 | weapon: wpn.daggers.claws |
| hunter | 1 | 1 | 0 | 1 | 0 | 1 | weapon: wpn.spear.reed |
| archer | 1 | 1 | 0 | 1 | 0 | 1 | weapon: wpn.bow.willow |
| witch | 1 | 1 | 0 | 1 | 0 | 1 | weapon: wpn.staff.branch |
| alchemist | 1 | 1 | 0 | 1 | 0 | 1 | weapon: wpn.flasks.vial |

### bossReadyStrong

| classId | chapter | round | kills | level | keys | bag size | equipped items |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| warrior | 1 | 10 | 6 | 60 | 1 | 9 | weapon: wpn.sword.ninelives; helmet: arm.cozy.helmet.legendary; armor: arm.cozy.armor.legendary; gloves: arm.cozy.gloves.legendary; boots: arm.cozy.boots.legendary; collar: acc.collar.bell.legendary; earring: acc.earring.feather.legendary; ring: acc.ring.lucky.legendary; charm: acc.charm.star.legendary |
| guardian | 1 | 10 | 6 | 60 | 1 | 9 | weapon: wpn.hammer.catastrophe; helmet: arm.cozy.helmet.legendary; armor: arm.cozy.armor.legendary; gloves: arm.cozy.gloves.legendary; boots: arm.cozy.boots.legendary; collar: acc.collar.bell.legendary; earring: acc.earring.feather.legendary; ring: acc.ring.lucky.legendary; charm: acc.charm.star.legendary |
| rogue | 1 | 10 | 6 | 60 | 1 | 9 | weapon: wpn.daggers.midnight; helmet: arm.cozy.helmet.legendary; armor: arm.cozy.armor.legendary; gloves: arm.cozy.gloves.legendary; boots: arm.cozy.boots.legendary; collar: acc.collar.bell.legendary; earring: acc.earring.feather.legendary; ring: acc.ring.paw.legendary; charm: acc.charm.star.legendary |
| hunter | 1 | 10 | 6 | 60 | 1 | 9 | weapon: wpn.spear.pounce; helmet: arm.cozy.helmet.legendary; armor: arm.cozy.armor.legendary; gloves: arm.cozy.gloves.legendary; boots: arm.cozy.boots.legendary; collar: acc.collar.bell.legendary; earring: acc.earring.feather.legendary; ring: acc.ring.lucky.legendary; charm: acc.charm.star.legendary |
| archer | 1 | 10 | 6 | 60 | 1 | 9 | weapon: wpn.bow.aurora; helmet: arm.cozy.helmet.legendary; armor: arm.cozy.armor.legendary; gloves: arm.cozy.gloves.legendary; boots: arm.cozy.boots.legendary; collar: acc.collar.bell.legendary; earring: acc.earring.feather.legendary; ring: acc.ring.lucky.legendary; charm: acc.charm.star.legendary |
| witch | 1 | 10 | 6 | 60 | 1 | 9 | weapon: wpn.staff.eclipse; helmet: arm.cozy.helmet.legendary; armor: arm.cozy.armor.legendary; gloves: arm.cozy.gloves.legendary; boots: arm.cozy.boots.legendary; collar: acc.collar.bell.legendary; earring: acc.earring.feather.legendary; ring: acc.ring.lucky.legendary; charm: acc.charm.star.legendary |
| alchemist | 1 | 10 | 6 | 60 | 1 | 9 | weapon: wpn.flasks.purrfect; helmet: arm.cozy.helmet.legendary; armor: arm.cozy.armor.legendary; gloves: arm.cozy.gloves.legendary; boots: arm.cozy.boots.legendary; collar: acc.collar.bell.legendary; earring: acc.earring.feather.legendary; ring: acc.ring.lucky.legendary; charm: acc.charm.star.legendary |

### bossReadyWeak

| classId | chapter | round | kills | level | keys | bag size | equipped items |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| warrior | 1 | 10 | 6 | 1 | 1 | 1 | weapon: wpn.sword.twig |
| guardian | 1 | 10 | 6 | 1 | 1 | 1 | weapon: wpn.hammer.mallet |
| rogue | 1 | 10 | 6 | 1 | 1 | 1 | weapon: wpn.daggers.claws |
| hunter | 1 | 10 | 6 | 1 | 1 | 1 | weapon: wpn.spear.reed |
| archer | 1 | 10 | 6 | 1 | 1 | 1 | weapon: wpn.bow.willow |
| witch | 1 | 10 | 6 | 1 | 1 | 1 | weapon: wpn.staff.branch |
| alchemist | 1 | 10 | 6 | 1 | 1 | 1 | weapon: wpn.flasks.vial |

### forgeRich

| classId | chapter | round | kills | level | keys | bag size | equipped items |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| warrior | 1 | 1 | 0 | 1 | 0 | 5 | weapon: wpn.sword.twig |
| guardian | 1 | 1 | 0 | 1 | 0 | 5 | weapon: wpn.hammer.mallet |
| rogue | 1 | 1 | 0 | 1 | 0 | 5 | weapon: wpn.daggers.claws |
| hunter | 1 | 1 | 0 | 1 | 0 | 5 | weapon: wpn.spear.reed |
| archer | 1 | 1 | 0 | 1 | 0 | 5 | weapon: wpn.bow.willow |
| witch | 1 | 1 | 0 | 1 | 0 | 5 | weapon: wpn.staff.branch |
| alchemist | 1 | 1 | 0 | 1 | 0 | 5 | weapon: wpn.flasks.vial |

### bagNearFull

| classId | chapter | round | kills | level | keys | bag size | equipped items |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| warrior | 1 | 1 | 0 | 1 | 0 | 180 | weapon: wpn.sword.twig |
| guardian | 1 | 1 | 0 | 1 | 0 | 180 | weapon: wpn.hammer.mallet |
| rogue | 1 | 1 | 0 | 1 | 0 | 180 | weapon: wpn.daggers.claws |
| hunter | 1 | 1 | 0 | 1 | 0 | 180 | weapon: wpn.spear.reed |
| archer | 1 | 1 | 0 | 1 | 0 | 180 | weapon: wpn.bow.willow |
| witch | 1 | 1 | 0 | 1 | 0 | 180 | weapon: wpn.staff.branch |
| alchemist | 1 | 1 | 0 | 1 | 0 | 180 | weapon: wpn.flasks.vial |

### midGame

| classId | chapter | round | kills | level | keys | bag size | equipped items |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| warrior | 2 | 5 | 5 | 20 | 2 | 9 | weapon: wpn.sword.silver; helmet: arm.cozy.helmet.rare; armor: arm.cozy.armor.rare; gloves: arm.cozy.gloves.rare; boots: arm.cozy.boots.rare; collar: acc.collar.bell.rare; earring: acc.earring.feather.rare; ring: acc.ring.paw.rare; charm: acc.charm.star.rare |
| guardian | 2 | 5 | 5 | 20 | 2 | 9 | weapon: wpn.hammer.anvil; helmet: arm.cozy.helmet.rare; armor: arm.cozy.armor.rare; gloves: arm.cozy.gloves.rare; boots: arm.cozy.boots.rare; collar: acc.collar.bell.rare; earring: acc.earring.feather.rare; ring: acc.ring.paw.rare; charm: acc.charm.star.rare |
| rogue | 2 | 5 | 5 | 20 | 2 | 9 | weapon: wpn.daggers.fangs; helmet: arm.cozy.helmet.rare; armor: arm.cozy.armor.rare; gloves: arm.cozy.gloves.rare; boots: arm.cozy.boots.rare; collar: acc.collar.bell.rare; earring: acc.earring.feather.rare; ring: acc.ring.paw.rare; charm: acc.charm.star.rare |
| hunter | 2 | 5 | 5 | 20 | 2 | 9 | weapon: wpn.spear.harpoon; helmet: arm.cozy.helmet.rare; armor: arm.cozy.armor.rare; gloves: arm.cozy.gloves.rare; boots: arm.cozy.boots.rare; collar: acc.collar.bell.rare; earring: acc.earring.feather.rare; ring: acc.ring.paw.rare; charm: acc.charm.star.rare |
| archer | 2 | 5 | 5 | 20 | 2 | 9 | weapon: wpn.bow.feather; helmet: arm.cozy.helmet.rare; armor: arm.cozy.armor.rare; gloves: arm.cozy.gloves.rare; boots: arm.cozy.boots.rare; collar: acc.collar.bell.rare; earring: acc.earring.feather.rare; ring: acc.ring.paw.rare; charm: acc.charm.star.rare |
| witch | 2 | 5 | 5 | 20 | 2 | 9 | weapon: wpn.staff.crystal; helmet: arm.cozy.helmet.rare; armor: arm.cozy.armor.rare; gloves: arm.cozy.gloves.rare; boots: arm.cozy.boots.rare; collar: acc.collar.bell.rare; earring: acc.earring.feather.rare; ring: acc.ring.paw.rare; charm: acc.charm.star.rare |
| alchemist | 2 | 5 | 5 | 20 | 2 | 9 | weapon: wpn.flasks.brew; helmet: arm.cozy.helmet.rare; armor: arm.cozy.armor.rare; gloves: arm.cozy.gloves.rare; boots: arm.cozy.boots.rare; collar: acc.collar.bell.rare; earring: acc.earring.feather.rare; ring: acc.ring.paw.rare; charm: acc.charm.star.rare |

## Later-chapter observations (no balance assertions)

Strongest warrior fixture: cat at V2_CONFIG.cat.maxLevel, highest-rarity candidates at their rarity maximum item level, chapter-filtered bestLoadout, actual MockGameApiV2 fightBoss. Each result is from an independent fixture with counter 0.

| chapter | seed 1 | seed 2 | seed 3 | seed 4 | seed 5 |
| --- | --- | --- | --- | --- | --- |
| 2 | win | win | win | win | win |
| 3 | win | win | win | win | win |
| 4 | loss | loss | loss | loss | loss |
| 5 | loss | loss | loss | loss | loss |

These are observations under today's registry/config, not guarantees for chapters 2–5. Chapter 1 is asserted for every class and seeds 1–5. C5b owns later tuning.

## How C8 uses this

Import this helper in the e2e test, serialize at the same time as the injected fake clock, and install storage before navigation. The app's existing demo-mode selection still applies.

```ts
import { MOCK_V2_STORAGE_KEY } from '../src/api/MockGameApiV2';
import { mockV2SaveJson } from '../src/api/mockV2Fixtures';

const nowMs = Date.parse('2026-10-25T03:00:00Z');
await page.clock.install({ time: nowMs });
const json = mockV2SaveJson('bossReadyStrong', { nowMs, classId: 'warrior', chapter: 1 });
await page.addInitScript(({ key, json }) => {
  localStorage.setItem(key, json);
}, { key: MOCK_V2_STORAGE_KEY, json });
// Navigate to the v2 demo route used by C8.
```

An init script runs on every document load. For a reload-persistence test, seed storage once (for example guard with a sessionStorage marker) so a reload does not overwrite progress with the initial fixture. The fixture module stays outside application imports.

## Validation environment and complete outputs

The host fallback `pnpm` was v11.25.0; the repository pins v10.28.0. Initial host-version attempts failed on noninteractive module recreation and optional unapproved native build scripts. An environment-only strict-dep-builds retry did not fix v11. Its generated allowBuilds placeholders were removed immediately; the workspace manifest is identical to origin/main. No native scripts were approved. Corepack supplied the pinned version; a temporary `/tmp/v26a-bin/pnpm` shim invokes `corepack pnpm` so recursive commands also use the pinned version. No repository configuration edits were needed. Successful commands use `PATH=/tmp/v26a-bin:$PATH`; the install uses `CI=true`.

The first actual fixture test run overcompared transient claim gate fields, as described above. The final test verifies all requested saved progress and complete getState equality across reload. Every original application test is unchanged. Complete failed-attempt outputs are retained for transparency.

### `pnpm install --frozen-lockfile (initial host pnpm; exit 1)`

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

### `CI=true pnpm install --frozen-lockfile (host pnpm; exit 1)`

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
? Verifying lockfile against supply-chain policies (520 entries)...
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +504
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 504, reused 0, downloaded 0, added 0
Progress: resolved 504, reused 0, downloaded 16, added 9
Progress: resolved 504, reused 0, downloaded 41, added 13
Progress: resolved 504, reused 0, downloaded 66, added 17
Progress: resolved 504, reused 0, downloaded 143, added 25
Progress: resolved 504, reused 0, downloaded 221, added 229
Progress: resolved 504, reused 0, downloaded 293, added 255
Progress: resolved 504, reused 0, downloaded 430, added 429
✓ Lockfile passes supply-chain policies (520 entries in 8.2s)
Progress: resolved 504, reused 0, downloaded 494, added 503
Progress: resolved 504, reused 0, downloaded 495, added 503
Progress: resolved 504, reused 0, downloaded 495, added 504, done

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### `CI=true npm_config_strict_dep_builds=false pnpm install --frozen-lockfile (host pnpm; exit 1)`

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 24s ago)
Lockfile is up to date, resolution step is skipped
Already up to date

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### `CI=true corepack pnpm install --frozen-lockfile (exit 0; pinned v10.28.0)`

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 16, added 7
Progress: resolved 506, reused 0, downloaded 24, added 11
Progress: resolved 506, reused 0, downloaded 47, added 16
Progress: resolved 506, reused 0, downloaded 100, added 108
Progress: resolved 506, reused 0, downloaded 165, added 173
Progress: resolved 506, reused 0, downloaded 232, added 231
Progress: resolved 506, reused 0, downloaded 300, added 309
Progress: resolved 506, reused 0, downloaded 353, added 359
Progress: resolved 506, reused 0, downloaded 419, added 427
Progress: resolved 506, reused 0, downloaded 466, added 473
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 12.7s using pnpm v10.28.0
```

### `CI=true pnpm install --frozen-lockfile (pinned shim; exit 0)`

```text
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
Done in 676ms using pnpm v10.28.0
```

### `pnpm build (initial host pnpm attempt before changes; exit 1)`

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install

pnpm: Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
    at getFinalError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:89986:14)
    at makeError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:92293:21)
    at getSyncResult (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94137:10)
    at spawnSubprocessSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94097:14)
    at execaCoreSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94027:23)
    at callBoundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96555:23)
    at boundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96532:49)
    at sync2 (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96691:10)
    at runPnpmCli (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:276904:5)
    at runDepsStatusCheck (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:278122:7)
```

### `pnpm build (second host pnpm baseline attempt; exit 1)`

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 26s ago)
Lockfile is up to date, resolution step is skipped
Already up to date

   ╭──────────────────────────────────────────────────────────────────────╮
   │                                                                      │
   │                 Update available! 11.25.0 → 12.15.0.                 │
   │                 Changelog: https://pnpm.io/v/12.15.0                 │
   │   To update, run: curl -fsSL https://get.pnpm.io/install.sh | sh -   │
   │                                                                      │
   ╰──────────────────────────────────────────────────────────────────────╯


[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install

pnpm: Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
    at getFinalError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:89986:14)
    at makeError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:92293:21)
    at getSyncResult (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94137:10)
    at spawnSubprocessSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94097:14)
    at execaCoreSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94027:23)
    at callBoundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96555:23)
    at boundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96532:49)
    at sync2 (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96691:10)
    at runPnpmCli (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:276904:5)
    at runDepsStatusCheck (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:278122:7)
```

### `pnpm --filter @taskbar-hero/web typecheck (initial host pnpm attempt; exit 1)`

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 50s ago)
Lockfile is up to date, resolution step is skipped
Already up to date

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install

pnpm: Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
    at getFinalError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:89986:14)
    at makeError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:92293:21)
    at getSyncResult (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94137:10)
    at spawnSubprocessSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94097:14)
    at execaCoreSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94027:23)
    at callBoundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96555:23)
    at boundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96532:49)
    at sync2 (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96691:10)
    at runPnpmCli (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:276904:5)
    at runDepsStatusCheck (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:278122:7)
```

### `pnpm --filter @taskbar-hero/web exec vitest run src/api/mockV2Fixtures.test.ts (initial host pnpm attempt; exit 1)`

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 1m ago)
Lockfile is up to date, resolution step is skipped
Already up to date

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install

pnpm: Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
    at getFinalError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:89986:14)
    at makeError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:92293:21)
    at getSyncResult (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94137:10)
    at spawnSubprocessSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94097:14)
    at execaCoreSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94027:23)
    at callBoundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96555:23)
    at boundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96532:49)
    at sync2 (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96691:10)
    at runPnpmCli (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:276904:5)
    at runDepsStatusCheck (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:278122:7)
```

### `pnpm --filter @taskbar-hero/web typecheck (pinned pnpm; exit 0)`

```text

> @taskbar-hero/web@0.0.0 typecheck /workspace/taskbar-hero/apps/web
> tsc --noEmit
```

### `pnpm --filter @taskbar-hero/web exec vitest run src/api/mockV2Fixtures.test.ts (first actual test execution; exit 1)`

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web

 ❯ src/api/mockV2Fixtures.test.ts (180 tests | 6 failed) 574ms
   ❯ fresh (14)
     × persists archer progress through a ten-minute claim and reload 9ms
     × persists witch progress through a ten-minute claim and reload 3ms
   ❯ forgeRich (14)
     × persists archer progress through a ten-minute claim and reload 3ms
     × persists witch progress through a ten-minute claim and reload 3ms
   ❯ bagNearFull (14)
     × persists archer progress through a ten-minute claim and reload 18ms
     × persists witch progress through a ten-minute claim and reload 18ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 6 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/api/mockV2Fixtures.test.ts > fresh > persists archer progress through a ten-minute claim and reload
AssertionError: expected { …(12) } to deeply equal { …(12) }

- Expected
+ Received

@@ -118,14 +118,14 @@
      "catnipCrystal": 1,
      "fluffTuft": 21,
    },
    "progress": {
      "chapter": 1,
-     "gated": true,
+     "gated": false,
      "kills": 0,
      "killsPerRound": 6,
-     "neededPower": 58,
+     "neededPower": 0,
      "round": 10,
    },
    "serverTime": 1792897800,
    "unlockedSlots": [
      "weapon",

 ❯ src/api/mockV2Fixtures.test.ts:49:24
     47|       expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).lastCla…
     48|       const reloaded = await new MockGameApiV2({ storage, now: () => n…
     49|       expect(reloaded).toEqual(claimed.state);
       |                        ^
     50|     });
     51|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/6]⎯

 FAIL  src/api/mockV2Fixtures.test.ts > fresh > persists witch progress through a ten-minute claim and reload
AssertionError: expected { …(12) } to deeply equal { …(12) }

- Expected
+ Received

@@ -118,14 +118,14 @@
      "catnipCrystal": 1,
      "fluffTuft": 20,
    },
    "progress": {
      "chapter": 1,
-     "gated": true,
+     "gated": false,
      "kills": 0,
      "killsPerRound": 6,
-     "neededPower": 57,
+     "neededPower": 0,
      "round": 10,
    },
    "serverTime": 1792897800,
    "unlockedSlots": [
      "weapon",

 ❯ src/api/mockV2Fixtures.test.ts:49:24
     47|       expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).lastCla…
     48|       const reloaded = await new MockGameApiV2({ storage, now: () => n…
     49|       expect(reloaded).toEqual(claimed.state);
       |                        ^
     50|     });
     51|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/6]⎯

 FAIL  src/api/mockV2Fixtures.test.ts > forgeRich > persists archer progress through a ten-minute claim and reload
AssertionError: expected { …(12) } to deeply equal { …(12) }

- Expected
+ Received

@@ -163,14 +163,14 @@
      "fluffTuft": 45,
      "shinyButton": 2,
    },
    "progress": {
      "chapter": 1,
-     "gated": true,
+     "gated": false,
      "kills": 0,
      "killsPerRound": 6,
-     "neededPower": 58,
+     "neededPower": 0,
      "round": 10,
    },
    "serverTime": 1792897800,
    "unlockedSlots": [
      "weapon",

 ❯ src/api/mockV2Fixtures.test.ts:49:24
     47|       expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).lastCla…
     48|       const reloaded = await new MockGameApiV2({ storage, now: () => n…
     49|       expect(reloaded).toEqual(claimed.state);
       |                        ^
     50|     });
     51|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/6]⎯

 FAIL  src/api/mockV2Fixtures.test.ts > forgeRich > persists witch progress through a ten-minute claim and reload
AssertionError: expected { …(12) } to deeply equal { …(12) }

- Expected
+ Received

@@ -163,14 +163,14 @@
      "fluffTuft": 44,
      "shinyButton": 2,
    },
    "progress": {
      "chapter": 1,
-     "gated": true,
+     "gated": false,
      "kills": 0,
      "killsPerRound": 6,
-     "neededPower": 57,
+     "neededPower": 0,
      "round": 10,
    },
    "serverTime": 1792897800,
    "unlockedSlots": [
      "weapon",

 ❯ src/api/mockV2Fixtures.test.ts:49:24
     47|       expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).lastCla…
     48|       const reloaded = await new MockGameApiV2({ storage, now: () => n…
     49|       expect(reloaded).toEqual(claimed.state);
       |                        ^
     50|     });
     51|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/6]⎯

 FAIL  src/api/mockV2Fixtures.test.ts > bagNearFull > persists archer progress through a ten-minute claim and reload
AssertionError: expected { …(12) } to deeply equal { …(12) }

- Expected
+ Received

@@ -2087,14 +2087,14 @@
      "catnipCrystal": 1,
      "fluffTuft": 21,
    },
    "progress": {
      "chapter": 1,
-     "gated": true,
+     "gated": false,
      "kills": 0,
      "killsPerRound": 6,
-     "neededPower": 58,
+     "neededPower": 0,
      "round": 10,
    },
    "serverTime": 1792897800,
    "unlockedSlots": [
      "weapon",

 ❯ src/api/mockV2Fixtures.test.ts:49:24
     47|       expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).lastCla…
     48|       const reloaded = await new MockGameApiV2({ storage, now: () => n…
     49|       expect(reloaded).toEqual(claimed.state);
       |                        ^
     50|     });
     51|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/6]⎯

 FAIL  src/api/mockV2Fixtures.test.ts > bagNearFull > persists witch progress through a ten-minute claim and reload
AssertionError: expected { …(12) } to deeply equal { …(12) }

- Expected
+ Received

@@ -2087,14 +2087,14 @@
      "catnipCrystal": 1,
      "fluffTuft": 20,
    },
    "progress": {
      "chapter": 1,
-     "gated": true,
+     "gated": false,
      "kills": 0,
      "killsPerRound": 6,
-     "neededPower": 57,
+     "neededPower": 0,
      "round": 10,
    },
    "serverTime": 1792897800,
    "unlockedSlots": [
      "weapon",

 ❯ src/api/mockV2Fixtures.test.ts:49:24
     47|       expect(JSON.parse(storage.getItem(MOCK_V2_STORAGE_KEY)!).lastCla…
     48|       const reloaded = await new MockGameApiV2({ storage, now: () => n…
     49|       expect(reloaded).toEqual(claimed.state);
       |                        ^
     50|     });
     51|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/6]⎯


 Test Files  1 failed (1)
      Tests  6 failed | 174 passed (180)
   Start at  03:32:10
   Duration  1.31s (tests 47%, environment 38%, transform 10%, import 4%)

undefined
/workspace/taskbar-hero/apps/web:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: vitest run src/api/mockV2Fixtures.test.ts
```

### `pnpm --filter @taskbar-hero/web exec vitest run src/api/mockV2Fixtures.test.ts (final; exit 0)`

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  1 passed (1)
      Tests  180 passed (180)
   Start at  03:32:31
   Duration  1.28s (tests 52%, environment 37%, transform 7%, import 4%)
```

### `pnpm gen:deno && git diff --exit-code -- supabase/functions (exit 0; clean)`

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

### `pnpm build (origin/main baseline; exit 0)`

```text

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
apps/web build: ✓ 1722 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-Rjyucpee.js               126.75 kB │ gzip:  36.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 741ms
apps/web build: Done
```

### `pnpm typecheck && pnpm lint && pnpm test && pnpm build (final; exit 0)`

```text

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

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  03:33:29
packages/chain test:    Duration  284ms (import 45%, transform 24%, tests 16%, worker 15%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  03:33:29
packages/auth test:    Duration  524ms (import 62%, tests 30%, transform 7%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
packages/game-rules test:  Test Files  16 passed | 1 skipped (17)
packages/game-rules test:       Tests  285 passed | 2 expected fail | 1 skipped (288)
packages/game-rules test:    Start at  03:33:30
packages/game-rules test:    Duration  20.41s (tests 92%, import 4%, transform 3%, worker 1%)
packages/game-rules test:     Isolate  17 workers spawned · ~128ms startup each (spawn + environment, per file)
packages/game-rules test:              at least ~2.05s faster with isolate: false — reuses workers across files instead of one per file
packages/game-rules test: Done
supabase/tests test:  Test Files  15 passed (15)
supabase/tests test:       Tests  340 passed (340)
supabase/tests test:    Start at  03:33:30
supabase/tests test:    Duration  28.93s (tests 88%, import 11%, transform 1%)
supabase/tests test:     Isolate  15 workers spawned · ~113ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~1.59s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  03:34:00
packages/api-contract test:    Duration  255ms (transform 66%, import 27%, tests 5%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  62 passed (62)
apps/web test:       Tests  897 passed (897)
apps/web test:    Start at  03:34:00
apps/web test:    Duration  50.33s (environment 65%, tests 22%, import 12%, transform 1%, worker 1%)
apps/web test: Environment  jsdom was created 62 times · 28.95s total, 65% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

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
apps/web build: ✓ 1722 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-Rjyucpee.js               126.75 kB │ gzip:  36.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 794ms
apps/web build: Done
```

## Bundle comparison

The successful baseline was built with both new source files temporarily moved outside the repository, with an EXIT trap restoring them. All tracked source files matched origin/main. The final build includes the helper and tests in typechecking, with no app imports. The eight emitted asset lines, including hashed names, sizes and gzip sizes, match exactly; both builds transformed 1722 modules.

Before (origin/main):

```text
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-Rjyucpee.js               126.75 kB │ gzip:  36.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
```

After (this branch):

```text
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-Rjyucpee.js               126.75 kB │ gzip:  36.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
```

## Limits and open points

No unresolved implementation blockers. Later-chapter boss wins remain dependent on C5b tuning; chapters 4–5 currently lose as observed above. C8 must seed once when testing persistence and use demo mode plus a matching clock. This card exercises the actual mock in unit tests and does not add Playwright tests or alter the live app. The native-build warnings and worker_threads browser-compatibility warning also appear in the baseline; checks complete successfully with the pinned toolchain. Existing game-rules suite results contain two expected failures and one pre-existing skipped test, unchanged by this card.
