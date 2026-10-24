# V4 generic seeded loot engine

## Built

Added `packages/game-rules/src/loot.ts`, exported through one new line in
`packages/game-rules/src/index.ts`. The engine has no knowledge of reward domains.
It uses the existing `Rng` and `deriveSeed`, preserving deterministic results for
identical registry, table ID, and seed inputs. Rolls process lines in order, draw
an inclusive uniform integer count after a successful chance roll, then make an
independent weighted selection per unit. References expand depth first using the
same random stream.

`loot.test.ts` adds 25 tests. Coverage includes determinism across 100 seeds,
chance boundaries, inclusive count bounds, per-unit nested expansion, generic
object/null rewards, each required validation problem, shared references,
unknown roots, the nesting limit, and analytic expected counts. The statistical
test runs 20,000 seeded rolls of a nested sample table and requires each reward's
observed mean to be within **2% relative error** of its analytic expectation
(a: 1.8, b: 1.1, c: 1.2 per root roll).

## Public API

```ts
type WeightedEntry<T> = { weight: number; value: T | { table: string } };
type LootLine<T> = {
  chance: number;
  count: [min: number, max: number];
  pick: WeightedEntry<T>[];
};
type LootTable<T> = { id: string; lines: LootLine<T>[] };
type LootRegistry<T> = Record<string, LootTable<T>>;

rollLoot<T>(registry: LootRegistry<T>, tableId: string, seed: Seed): T[];
validateRegistry<T>(registry: LootRegistry<T>): string[];
expectedCounts<T>(
  registry: LootRegistry<T>,
  tableId: string,
  key: (value: T) => string,
): Record<string, number>;
```

`Seed` is the existing numeric seed type. `validateRegistry` checks all registered
tables, including unused tables, for unknown references, cycles, invalid weights,
invalid chances, reversed/negative counts, and empty pick lists. Diagnostics
identify the table and line (and pick where applicable). It also rejects
non-finite, fractional, or unsafe integer counts. Both rolling and expectation
calculation reject invalid registries and unknown root IDs with explicit errors.

`expectedCounts` uses linearity of expectation: chance × mean inclusive count ×
normalized entry weight × nested expected count. Repeated keys are summed. It
performs no random sampling. Finite weights are scaled before normalization to
avoid overflowing their sum. Reward keys such as `__proto__` are supported.

## Interpretations and limits

- The root has depth 0. Four nested references are allowed; attempting a fifth
  throws. The same depth rule applies to expected counts. Structural validation
  reports cycles; depth is checked while expanding a requested table.
- An object with a string-valued `table` field is reserved as a table reference.
  Callers should wrap rewards that need that field in another reward shape.
- Registry keys resolve references; `LootTable.id` is caller-supplied metadata.
- Counts are nonnegative safe integers. Chance and weights must be finite, and
  weights must be strictly positive. Empty tables/registries are valid.
- Expectations are analytic, subject to normal JavaScript floating-point
  precision. Zero-chance and zero-count lines contribute no keys.
- Full registry validation runs on each public roll/expectation call; no mutable
  validation cache is retained. Caller reward objects are returned by reference.
- No unresolved implementation blockers. The depth convention and reserved
  reference shape above resolve the two specification ambiguities explicitly.

## Git setup and Actions

The first commands were the requested Git identity checks. Both already matched:

```text
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
```

Fetched `origin/main`, then ran `git switch -c ai/codex-v4-loot origin/main`.
The base is `d5e67bc` (`docs: judge dry run report and screenshots for live
 demonstration (B5-AG6) (#107)`). Only the four authorized files are changed.
Repository workflows were inspected: CI is manual-only; deployment is triggered
only by pushes to main (or manual dispatch). This feature branch cannot trigger
either workflow. No workflow was dispatched and no pull request was opened.
The feature commit uses the requested author and a `[skip ci]` commit subject.

## Local verification

All four required commands ran locally and exited 0. Outputs below are pasted
from captured stdout/stderr, with terminal color codes absent. Tests: **5 files,
88 tests passed**, including the 25 new tests. Typecheck and lint: **6 workspace
packages passed each**. The install warning about ignored dependency build
scripts was informational; install and every required check succeeded.

### `pnpm install`

```text
$ pnpm install
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
Done in 469ms using pnpm v10.28.0
```

### `pnpm --filter @taskbar-hero/game-rules test`

```text
$ pnpm --filter @taskbar-hero/game-rules test

> @taskbar-hero/game-rules@0.0.0 test /Users/bao/Documents/ChatGPT/taskbar hero/packages/game-rules
> vitest run


 RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/game-rules


 Test Files  5 passed (5)
      Tests  88 passed (88)
   Start at  19:01:43
   Duration  260ms (tests 46%, transform 33%, import 18%, worker 3%)
```

### `pnpm -r typecheck`

```text
$ pnpm -r typecheck
Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck: Done
packages/auth typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

### `pnpm -r lint`

```text
$ pnpm -r lint
Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint: Done
packages/auth lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```
