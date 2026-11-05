# Gameplay 2 candidate review

Candidate build, not live. Runtime `629aa8b3dd0120f1a3e9556b699d539155202296`, based on PR #282 (`7eb1ee7`). Not merged, not deployed.

Double-click `index.html`. It is a single self-contained file with embedded original art/fonts, actual Sample UI/rules, nine measured timeline rows, build comparison, decisions and provenance. It works offline without a server. Review shortcuts replace only this file's local Sample save. The normal game uses a different browser origin/save.

## Five-minute review

1. **Fresh start**: choose Gather, Study or Explore. Leaving a choice unattended safely gathers. Inspect the short/medium/long goals.
2. **Boss tells**: match the named response with **1 / 2 / 3**, then **P** in recovery. Watch phases and the result. This fixture starts a room-one fight.
3. **Workshop kit**: open Workshop; craft a missing set/slot, compare Steady versus Spark and the disclosed pity. Open Wardrobe, compare a piece, assemble a set and save kit A/B.
4. **Build lab** below the game: compare three equal room-two kits. Change tier and counters; results come from the actual reducer, not fixed display values.
5. **Away summary** and **Tour preview**: inspect the cap, journal, Keep/Restart preview and immediate Undo. Check the three-seed timeline and original-art tables.

## Real application

```sh
cd /Users/bao/taskbar-hero-gameplay2
pnpm install --frozen-lockfile
pnpm demo
```

Use a fresh guest browser profile to see onboarding. Existing saves and permanently dismissed onboarding are preserved.

- With onboarding: `http://127.0.0.1:5391/?demo#home`
- Skip coach: `http://127.0.0.1:5391/?demo&coach=off#home`
- Opt-in adventure: `http://127.0.0.1:5391/?demo&coach=off&adventure=1#home`
- Development review controls: append `&adventureDebug=1` before `#home`. The footer controls jump rooms, give local patches/kit or advance 60 seconds. Jump to a room, then Challenge boss. They are absent from production.

`pnpm demo` binds loopback, enables V2 mock guest mode and explicitly empties service credentials. `features.cafeAdventure=false` remains the default. The adventure is a local **Sample**: it never grants server Fish, Yarn, Cat Keys or Relics. Main-game boss/replay rules remain unchanged.

## Evidence and reproduction

Full report, screenshots and raw receipts: [ledger reports/gameplay2](https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-ui-ledger/reports/gameplay2). The compact measurements and numeric decisions also live in this branch under `reports/gameplay2` and `docs/decisions/gameplay-2026-11-05.md`.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm art:check
pnpm --filter @taskbar-hero/web exec playwright test --workers=2
node tools/gameplay2-balance.mjs
node tools/gameplay2-decisions.mjs
node tools/gameplay2-audit.mjs
node tools/gameplay2-audit.mjs http://127.0.0.1:5391 --results
node tools/gameplay2-demo.mjs
node tools/gameplay2-demo-check.mjs
```

Browser audit tools use Playwright already installed in `apps/web`. Set `AXE_PATH` to a local axe-core 4.10.3 script (the original run used `/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js`). Fonts use existing pinned URLs/hashes. Building the offline demo fetches those pinned fonts; viewing it never fetches anything.

For fresh timeline receipts, run `node tools/gameplay2-walk.mjs before <baseline-loopback-url>` on immutable #282 and `node tools/gameplay2-walk.mjs after http://127.0.0.1:5391`, then `node tools/gameplay2-sample-walk.mjs` and `node tools/gameplay2-proof.mjs`. Each walk script runs three sequential ten-minute sessions. Do not change runtime code or rebuild/delete the E2E output directory during a walk or browser suite. Main reward timings and Sample opportunity timings are intentionally separate.

`gameplay2-demo.mjs` embeds local `reports/gameplay2/screens` captures when present. Regenerate with the audit first, or copy the exact receipts from the ledger for the delivered version. Performance reproduction additionally needs `base-size-v2.json` from the ledger and an explicit V2 production build at `apps/web/dist-gameplay2`; the method and environment are in `performance.json`. Run it with no competing browser tests. Real window-hide verification is an open limitation; synthetic pause/reduced-motion tests pass.

## Release boundary

Draft stack order: #275 → #276 → #277 → #278 → #279 → #280 → #281 → #282 → #283 → #284 → #285 → proof/demo. Never merge the tip directly. Vercel Git deployment is disabled for all four new candidate branches at both configuration roots. No Supabase, contracts, DB, migration, wallet signing or funds changes.

The ≤20-second gap target passes in the three measured after walks. Strict main first-reward wall time is 10.049–10.075 seconds, slightly above 10 seconds. Main idle still loses its first boss; only the opt-in Sample clears room one unattended. One author's scripts and self-grading do not establish human fun or retention.
