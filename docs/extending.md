# Extending Taskbar Hero

Checklists for the five changes people make most often. Each step names the file to touch, and each checklist ends with the check that fails if you miss something. Where nothing catches a missed step, it says so.

Ground rules for all of them:

- Run `pnpm lint && pnpm test && pnpm build` before opening a PR. Run `pnpm --filter @taskbar-hero/web test:e2e` after `pnpm --filter @taskbar-hero/web build` when you touched the client.
- Anything under `supabase/functions` or its shared code redeploys the Edge Functions when it reaches `main`.
- Game numbers live only in `packages/game-rules/src/config.ts`. Display names live only in `apps/web/src/theme/labels.ts`. Internal ids (`gold`, `weapon`, `legendary`) never change.

## New API endpoint

1. Add the name to `ENDPOINTS` in `packages/api-contract/src/endpoints.ts`.
2. Add any new request or response type, and the method on the `GameApi` interface, in `packages/api-contract/src/types.ts`. A new error code goes in `packages/api-contract/src/errors.ts` (both `ERROR_CODES` and `HTTP_STATUS`).
3. Write the logic in `supabase/functions/_shared/game.ts` and add the route to `routes()`.
4. Create `supabase/functions/<name>/index.ts` by copying a sibling such as `supabase/functions/equip/index.ts` (one line: `Deno.serve(serveGame("<name>"))`).
5. Run `pnpm gen:deno` to create the function's `deno.json`. Never edit a `deno.json` by hand.
6. Add the name to `FUNCTIONS` in `.github/workflows/deploy-functions.yml`.
7. Implement the method in `apps/web/src/api/SupabaseGameApi.ts` and in `apps/web/src/api/MockGameApi.ts`. If it returns game state, build the result with `buildServerState` from `packages/api-contract/src/state.ts`.
8. Add a row to the calls table in `docs/api.md`.

Caught by: `supabase/tests/src/consistency.test.ts` (routes have folders, `ENDPOINTS` matches `routes()` and the deploy list, every error code has a status) and the TypeScript build (`routes()` is typed `Record<Endpoint, ...>`, and `SupabaseGameApi` and `MockGameApi` must implement `GameApi`). Nothing catches a missing `docs/api.md` row.

## New gear slot

1. Append the slot to `SLOTS` in `packages/game-rules/src/content.ts`. Append only; never reorder or remove.
2. Add its base stat to `CONFIG.gear.baseStat` in `packages/game-rules/src/config.ts`. Mention the number in `docs/game-rules.md`.
3. Add a new migration in `supabase/migrations/` that drops and re-adds the `gear.slot` check constraint (`gear_slot_check`, created in `20260104000000_game_api.sql`) with the new list.
4. Add its display name to `LABELS.slots` in `apps/web/src/theme/labels.ts`.
5. Add its icon to `SLOT_ICONS` in `apps/web/src/inventory/InventoryTab.tsx`. A new icon shape goes in `apps/web/src/art/pixelIcons.tsx`.
6. Decide whether starter gear should include it (`starterGear` in `packages/game-rules/src/rules.ts`). Existing players only get new starter items if the server grants them, so a new slot normally starts empty.

Caught by: `packages/game-rules/src/content.test.ts` (every slot has a `baseStat` row), `supabase/tests/src/consistency.test.ts` (the SQL check list equals `CONFIG.slots`, and invalid slots are rejected), and the TypeScript build (`LABELS.slots` and `SLOT_ICONS` are typed against `Slot`). Nothing catches a layout that no longer fits the new slot at 320 px; check the inventory by eye.

## New rarity or Relic

A Relic is the NFT for one rarity, and the two are one-to-one. Never reorder or remove a rarity: its position is stored on-chain (`uint8 rarity`) and its `relicId` is the ERC-1155 token id.

1. Append `{ id, relicId }` to `RARITIES` in `packages/game-rules/src/content.ts`, with the next unused `relicId`.
2. Add a row for it to every per-rarity table in `packages/game-rules/src/config.ts`: `gear.rarityMultiplier`, `gear.upgradeRarityCostMultiplier`, `idle.dropRarityWeights` and `relic.rarityOddsBp` (the odds must still sum to 10000). Update `docs/game-rules.md`.
3. Add a new migration that drops and re-adds the rarity check constraints on `gear`, `relic_forges` and `relic_vouchers` (see `20260104000000_game_api.sql` and `20260106000000_relic_forge.sql`).
4. Add the display names to `LABELS.rarities` and `LABELS.relics` in `apps/web/src/theme/labels.ts`.
5. Add a `--rarity-<id>` token and a `.rarity-<id>` rule in `apps/web/src/theme.css`, then the per-rarity glow rules in `apps/web/src/forge/forge.css`, `apps/web/src/inventory/inventory.css` and `apps/web/src/market/market.css`.
6. Add the Relic to `RELICS` (art, colors, description) in `scripts/gen-relics.mjs`, then run `node scripts/gen-relics.mjs` and commit the new `apps/web/public/relics/<id>.json`, its 64-hex copy and the `.svg`.
7. Add its shelf icon to `getRelicIcon` in `apps/web/src/CafeBoard.tsx`.
8. The contract needs no change: `RelicNFT` accepts any `relicId` that the server signs. The first mint of the new id fixes its `rarity` on-chain.

Caught by: `packages/game-rules/src/content.test.ts` (pinned ids and indexes never change, every rarity has a row in each table), `supabase/tests/src/consistency.test.ts` (SQL check lists equal `CONFIG.rarities`, and every relic id has its decimal and 64-hex metadata file), and the TypeScript build (`LABELS.rarities` and `LABELS.relics` are typed against `Rarity`). Nothing catches a missing CSS rule or `getRelicIcon` case; the Relic then renders with the default color or the paw icon.

## New boss

Bosses are not stored anywhere. The boss for level N is computed from `CONFIG.boss` and named by cycling `LABELS.bosses`.

- **A new boss name:** append it to `LABELS.bosses` in `apps/web/src/theme/labels.ts`. The cycle length changes, so existing levels move to different names; that is cosmetic only.
- **Different difficulty:** change `CONFIG.boss` (`basePower`, `powerGrowth`, `hpPerPower`, `maxAttemptsPerDay` and the rest) in `packages/game-rules/src/config.ts` and update `docs/game-rules.md`. This is a game-balance change, so get it approved before merging.
- **More levels:** raise `CONFIG.boss.maxLevel` and add a migration that drops and re-adds the `idle_state.boss_level` check (created in `20260104000000_game_api.sql`).
- The fight itself is `simulateBoss` in `packages/game-rules/src/sim.ts`. The server runs it and the client only replays the log, so never copy that logic into the client.

Caught by: `supabase/tests/src/consistency.test.ts` (the SQL level bounds equal `CONFIG.boss.maxLevel`) and the tuning tests in `packages/game-rules`. Nothing catches a bad boss name; check the Boss tab by eye.

## New tab

1. Create the tab component in its own folder under `apps/web/src/`, like `apps/web/src/forge/ForgeTab.tsx`.
2. Add `{ id, label, Component }` to `TABS` in `apps/web/src/Panel.tsx`. `TabName` and the tab buttons derive from the list, so nothing else registers it.
3. If "Today's Quest" should be able to point at the tab, make sure `HintTab` in `apps/web/src/onboarding/nextStep.ts` includes it. `HintTab` is every `TabName` except `Hero` and `Market`, so a new tab is included by default; exclude it there if it should not be a hint target.
4. Update the tab lists in `apps/web/src/App.test.tsx` and `apps/web/e2e/smoke.spec.ts`.
5. Keep the panel usable at 320, 390 and 1280 px wide with no horizontal scroll.

Caught by: `apps/web/src/App.test.tsx` and `apps/web/e2e/smoke.spec.ts` (both assert the exact tab list and order) and `apps/web/e2e/responsive-screenshots.spec.ts` (checks for horizontal scroll at 320 px).
