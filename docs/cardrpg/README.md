# The Lantern · Cat Cafe Quest

Open `index.html` directly in a desktop browser. It is one self-contained file with embedded original models and portraits. It makes no network requests and writes no game storage. Reloading resets the local account. Supported desktop sizes: 1024x600, 1280x720, 1440x900.

REFERENCE: docs/cardrpg/index.html; docs/cardrpg/build.json; reports/cardrpg/offline-path/check.json; reports/cardrpg/offline-commands/check.json

Start at the cafe, choose a team, inspect Equipment, spend earned stamps in Invitations, then Prepare patrol. Begin patrol, choose each cat's card and target, or enable Auto all cats. After each wave, keep loot and Auto-equip best during rest. Defeat Yarn Giant, collect rewards, and enhance a favourite at the workbench. The preview uses battle seed 2 so the tested starter route can be replayed; choices and equipment still affect the real rules. Seed selection is disclosed and is not balance evidence. For balance, use the separate multi-seed rules simulations.

REFERENCE: docs/cardrpg/index.html; tools/cardrpg-demo/path-check.mjs; tools/cardrpg-demo/seed-check.mjs; reports/cardrpg/validation/tutorial-seeds.json; docs/design/cardrpg/BALANCE.md

Everything is local and unsaved. Invitations use only earned, non-transferable points, with exact odds and visible pity. Random draws never grant tradeable NFTs. Relic designs are deterministic eligibility proposals on Avalanche Fuji (43113), design only, not minted. Only chapter one is playable; twelve cats share three kits/miniature families. No mobile, server, live economy or on-chain supply-cap proof is claimed.

REFERENCE: docs/cardrpg/index.html; apps/web/src/game/cardrpg/Journal.tsx; docs/design/cardrpg/DESIGN.md

Reproduce after `CI=true pnpm install --frozen-lockfile`:

```sh
node tools/cardrpg-demo/build.mjs
CARDRPG_URL="file://$PWD/docs/cardrpg/index.html" node tools/cardrpg-demo/path-check.mjs
CARDRPG_URL="file://$PWD/docs/cardrpg/index.html" node tools/cardrpg-demo/commands-check.mjs
node tools/cardrpg-demo/fallback-check.mjs
```

REFERENCE: docs/cardrpg/index.html; tools/cardrpg-demo/build.mjs; tools/cardrpg-demo/path-check.mjs; tools/cardrpg-demo/commands-check.mjs; tools/cardrpg-demo/fallback-check.mjs

Development: `CARDRPG_PORT=5524 node tools/cardrpg-demo/serve.mjs`, then `http://127.0.0.1:5524/?demo&squad=1&cardrpg=1`. Flags remain default off. Set `CARDRPG_URL=http://127.0.0.1:5524` for the layout, skill-capture and performance scripts. Isolation builds compare the frozen prior polish checkout with the candidate; serve `/tmp/cardrpg-flag-before` and `/tmp/cardrpg-flag-after` on loopback ports and set `CARDRPG_BEFORE_PORT` / `CARDRPG_AFTER_PORT` for the comparison script. Never run a production build concurrently with inherited E2E, because clearing `dist` can erase its nested server build.

Review `FRESH-EYES.md`, `SKILLS-SHEET.md`, the presentation report and measured evidence before treating the prototype as a production release. All PRs are drafts.

Native Retina uses Medium by default; automatic adaptation may reduce the effective setting to Low (without bloom) during demanding playback. The original High option remains selectable. The performance report records requested and effective quality separately, and strict frame-time misses remain disclosed. Software rendering has a tested DOM fallback and is not claimed to meet the Metal frame budget.

REFERENCE: reports/cardrpg/validation/performance-summary.json; reports/cardrpg/lifecycle-retina-delivery/measurement.json; apps/web/src/game/squad/turn3d/post.ts.
