# Integrated v2 QA Harness

This directory contains harness automation scripts and raw execution logs for the independent browser and visual QA of the integrated v2 stack.

## Structure

- `run-qa-integrated.mjs`: Node.js/Playwright automation script for exercising all 8 verification items:
  1. Boss fight and victory/defeat lifecycles (fixtures `bossReadyStrong` and `bossReadyWeak`)
  2. Forge crafting, salvage, item lock enforcement, and Relic Forge area (fixture `forgeRich`)
  3. Relic UI with wallet disconnected (confirms prompt to connect wallet, ensures no voucher created, no transactions sent)
  4. Desktop browser layout zoom (100% at 1280x720, 200% at 640x360 dpr 2, 400% at 320x180 dpr 4)
  5. Resize drag burst (1600 -> 420 px 4px steps x3 cycles, settle checks for single canvas and actor redraw)
  6. Phone bottom sheet at 320x568 and 390x844 (tab activation, Escape key dismiss with focus restoration, bottom scrollability)
  7. WebKit execution (playwright webkit 27.2 downloaded and configured)
  8. Reduced motion testing (matrix for items 1 and 5 under `no-preference` and `reduce`)
- `logs/`: Raw logs recording:
  - `gate-checks.txt`: Prerequisite gate verification outputs confirming CX2 on `ai/codex-fix-resize-hygiene` is BLOCKED and fallback branch `ai/codex-integrate-v2-stage` is absent from remote.
  - `webkit-install.txt`: Real download and binary verification log for WebKit 27.2.
  - `pnpm-install.txt`: Real output for `pnpm install --frozen-lockfile`.
  - `gen-deno.txt`: Real output for `pnpm gen:deno && git diff --exit-code -- supabase/functions`.

## Running the Harness

Once the prerequisite integration branch `ai/codex-integrate-v2-stage` or CX2 hygiene fix is published:

1. Check out the integrated source detached.
2. Build with `VITE_GAME_V2=1`:
   ```bash
   pnpm --filter @taskbar-hero/web build
   ```
3. Start the preview server in mock mode (empty Supabase env):
   ```bash
   VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web preview --port 5173
   ```
4. Run the harness:
   ```bash
   node reports/qa-integrated/harness/run-qa-integrated.mjs --url http://localhost:5173 --browser all
   ```
