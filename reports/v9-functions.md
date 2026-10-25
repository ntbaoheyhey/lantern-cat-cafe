# V9 functions — blocked by deployment workflow allowlist

Branch: `ai/codex-v9-functions`, based on fetched `origin/main`.

The four endpoints and their migrated-PGlite tests are implemented. No PR, push,
GitHub Actions invocation, migration application to a remote database, or function
deployment was performed. No dependency was added; lockfile unchanged.

## Scope blocker

`supabase/tests/src/consistency.test.ts:295` requires the `FUNCTIONS` list in
`.github/workflows/deploy-functions.yml:26` to equal all function folders. The
workflow currently lists only the nine v1 functions. These four new folders make
the existing test fail. Updating `.github/workflows/deploy-functions.yml` is
necessary, but that file is outside the explicit edit allowlist. Work stops at
this boundary; the test and workflow remain unchanged. The branch is held locally
because the requested all-checks-pass condition for pushing cannot be met.

Required scope extension: permit adding `v2-state`, `v2-claim`, `v2-equip` and
`v2-choose-class` to the workflow's `FUNCTIONS` list. No such edit has been made.

Orchestrator note requested by the task:
"merge only after V8 is applied to Supabase; this merge deploys v2-* functions via deploy-functions.yml"
This deployment expectation is currently blocked by the workflow list above.

## Implementation

Pure function logic uses the v2 rule and view helpers, SQL CAS for last-claim
microseconds and progress revision, one recomputation, actual SQL capped stack
credits plus overflow salvage, registry starters, UUID/slot validation, and v2
HTTP refusals. Deno wiring reuses `verifySessionToken` exactly as v1 and uses the
same environment fallbacks; environment access stays in `server.ts`.

`toPlayerStateV2` copies stacks and bonuses, supplies combat item keys and drop
source, and converts boss clears/cooldown and the shared forge day. `viewOf` uses
`stateViewV2` and `gateOfV2`. Pending vouchers are signed and persisted when a
signer exists, or omitted when unsigned and no signer is configured, as in v1.
Voucher expiry/reissue remains outside these four endpoints, as in v1 state load.

## Derived snapshot type

The type in `_shared/v2/game.ts` comes directly from `v2_snapshot`,
`v2_item_json`, and `game_voucher_json`:

```ts
export interface RawSnapshotV2 {
  classId: string | null;
  level: number;
  xp: number;
  chapter: number;
  round: number;
  kills: number;
  bestStage: number;
  fights: number;
  progressRev: number;
  lastClaimMicros: number;
  lastDailyKeyDay: string | null;
  cooldownUntil: number | null;
  serverTime: number;
  stacks: Record<string, number>;
  inventory: ItemV2Raw[];
  equipped: Record<string, string>;
  bossClears: { chapter: number; wins: number }[];
  founder: boolean;
  forgedToday: boolean;
  pending: VoucherRowV2 | null;
  today: TodayRelic | null;
}
```

`ItemV2Raw = v2.ItemViewV2`: `id`, `itemKey`, `slot`, optional `weaponType`, `rarity`, `level`, `bonus`, `locked`, `equipped`.

`VoucherRowV2 = VoucherRow`: `player: string`, `relicId: string`, `rarityName: Rarity`, `nonce: string`, `expiry: number`, `signature: string | null`, `status: "issued" | "minted" | "expired"`. `today: TodayRelic | null` has `relicId`, `rarityName`, `minted`, `txHash`, exactly as SQL emits.

## ForgeStatusV2 fields

| Field | Source |
| --- | --- |
| `blockedBy` | `relicForgeBlockV2` on v2 stacks and game day; null whenever a raw pending voucher exists. |
| `forgedToday` | SQL snapshot, shared `relic_forges` day. |
| `pending` | Shared voucher JSON converted by `signedVoucherV2`; signatures persisted with `game_voucher_sign`. |
| `today` | Copy of SQL snapshot shared relic/mint status. |

These are all the fields in v1 `ForgeStatus` / `buildServerState`; there are no additional legacy forge fields.

## Validation notes

The installed global pnpm was 11.25.0, while this repository pins 10.28.0. Initial attempts required noninteractive CI mode, then v11 refused ignored native builds and automatically added `allowBuilds` to `pnpm-workspace.yaml`. That generated change was restored. Final validation uses `corepack pnpm` 10.28.0 via a temporary external PATH shim and `CI=true`, without changing repository configuration. Native optional build warnings are retained below.

The supplied `pnpm ... test -- v2/functions-state` command runs the entire Supabase suite in this Vitest version; its only remaining failure is the forbidden workflow list. An additional direct Vitest invocation runs all 15 new tests and passes.

The existing supabase/tests tsconfig includes only `src`, so an additional temporary tsconfig outside the repository explicitly includes the new v2 test file and verifies `const s: ServerStateV2 = await getStateV2(...)`. This check passes. Deno is not installed, so `deno check` was unavailable.

