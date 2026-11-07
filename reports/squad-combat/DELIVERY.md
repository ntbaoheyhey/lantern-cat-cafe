# Squad combat slice — 2026-11-05

Implemented the first playable combat milestone from [the squad review](../../docs/design/squad-combat-review-2026-11-05.md) in `/Users/bao/taskbar-hero-gameplay2`, branch `codex/squad-combat-2026-11-05`, based on `0b925536685512a0672a784fcfffe80097a0a821`.

This is **Squad Lab**, an explicitly labeled local prototype. It is a combat slice, not completion of all four stages in the design roadmap. No server grants, save migration, contract changes or release were introduced.

## Play

Open the running preview at <http://127.0.0.1:5392/?demo&coach=off#squad>. If the local server has stopped:

```sh
cd /Users/bao/taskbar-hero-gameplay2
VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web dev --host 127.0.0.1 --port 5392 --strictPort
```

Choose a squad and encounter, then **Begin patrol**. Auto ultimates are enabled by default. Select enemies on the battlefield or in the target list; keys **1–3** queue ready ultimates. **Prepare** starts a fresh local preparation session, and **Retry encounter** restores the team for another attempt.

## Delivered

- Three independently simulated cats: Guardian, Witch and Alchemist, with separate HP, targets, cooldowns and statuses; nine non-basic activated skills and three observable passives.
- Two starter compositions: Hearthkeepers and Twin Embers. Five ordinary enemy roles, three authored group waves, Yarn Giant practice and an eight-enemy stress encounter.
- Yarn Giant has a marked sweep, exposed opening, break resistance, targetable binding knots and a one-time add phase. Its stationary basic attack releases a projectile before damage resolves.
- Pure, fixed-step shared rules with per-battle seeded RNG, versioned commands/events, replay export/reconstruction and one settlement per wave. The displayed practice score never becomes account currency.
- One Phaser presenter for ordinary groups and the boss. Melee contact uses authoritative actor positions; area effects and healing patches use those same coordinates and radii. Portraits use the same rigs as the cats in combat.
- Full-auto play, support-priority tactics, manual focus and ultimate controls, party cards, compact view, reduced-motion information, pause/resume, training, result breakdown and defeat guidance.
- Hidden or inactive combat pauses without catch-up. Switching compact/full view preserves the same battle and command log.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Web unit suite | 1,502 passed | [web-tests.log](web-tests.log) |
| Shared game-rules suite | 504 passed, 2 expected failures, 11 skipped | [game-rules-tests.log](game-rules-tests.log) |
| Squad rules regression subset | 22 passed | [squad-rules.log](squad-rules.log) |
| Web TypeScript + production build | Passed; Vite reports its large-chunk warning | [build.log](build.log) |
| Desktop browser checks | 1280×720, 1440×900, 1920×1080; eight targets, all ultimate controls visible, no horizontal overflow | [browser-check.json](browser-check.json) |
| Browser pause/compact/reduced motion | Passed; paused battle remains unchanged | [browser-check.json](browser-check.json) |
| Complete browser patrol + downloaded replay | Win at 81.15 simulation seconds; four settlements, 670 practice points; replay reconstructs the win | [browser-replay.json](browser-replay.json) |
| Runtime errors / non-read network requests during browser checks | Zero observed | [browser-check.json](browser-check.json) |
| 48 balance simulations | Two squads × 12 seeds × two target policies; 48 wins; 63.1–92.3 seconds | [balance.json](balance.json) |

Changing the policy from default protection to support priority changed duration or received damage in all 24 matched comparisons. This demonstrates consequential targeting, not that active input always improves the result. These are deterministic simulations, not human enjoyment or retention measurements.

Rules regressions cover input immutability, fixed/fractional update rates, manual replay, taunt/focus selection, exact area boundaries, moving targets, target death during flight, melee contact/return, heal-before-shield ordering, burn caps, interruption/resistance, bindings, sweep geometry, persistent HP and settlements exactly once.

Reproduce the browser and balance checks with:

```sh
node tools/squad-check.mjs
node tools/squad-balance.mjs
node tools/squad-profile.mjs
```

The browser report records RAF cadence separately from the renderer, whose target is 30 FPS. [renderer-profile.json](renderer-profile.json) measures the squad scene update and Phaser canvas-render interval during the eight-enemy encounter. Neither measurement includes GPU/compositor cost or battery consumption.

In the 6.25-second crowd sample, scene-update p95 was 0.70 ms and canvas-render p95 was 0.60 ms. Scene frames averaged 34.79 ms, with p95 41.30 ms and a 64.30 ms maximum; the scene-update maximum was 26.80 ms. These short-run measurements include initialization and show occasional slower frames; they are not a guarantee of a locked frame rate.

## Visual evidence

- [1280×720 crowded combat](crowd-combat-1280.png)
- [1440×900 crowded combat](crowd-combat-1440.png)
- [1920×1080 crowded combat](crowd-combat-1920.png)
- [Compact view with reduced motion](compact-reduced-1920.png)
- [Complete patrol result](full-patrol-result.png)

## Remaining roadmap work

Art is coherent temporary presentation using existing rigs/assets, not the final three-hero animation production proposed for stage 2. Gear editing, behavior-changing equipment, recruitment, route rewards, additional classes/bosses, account progression, server validation and save/replay migration belong to later stages. The prototype only exports local replay data; it has no replay-import UI.

The five-player usability pilot, long-session balance, battery measurement and production-scale performance validation remain unperformed. The short automated encounters establish functioning mechanics and basic presentation; they do not establish a fun score or release readiness. Some observed runs exceed the provisional 90-second target slightly and need tuning with player feedback.
