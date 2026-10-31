# Effects testing (animation, not just pictures)

A screenshot is one instant, so it cannot show a swing, a flash, a damage number or a reveal.
`apps/web/tools/effects-test.mjs` samples the running app over time instead. Demo mode, Vite dev
server, no wallet, no live service. Run from `apps/web`:

```
node tools/effects-test.mjs ../../reports/effects
```

Output: `summary.json` (every check with PASS/FAIL and numbers), `animation-inventory.json` (every CSS
animation seen while walking all six tabs, normal vs reduced motion), `<scenario>/fNNN-<ms>.png` frame
sequences (about every 300 ms), and `.webm` video per scenario when ffmpeg is installed
(`npx playwright install ffmpeg`). Exit code 1 means a hard check failed.

## What is checked automatically

| Effect | How | Scenario |
| --- | --- | --- |
| Hero swing reaches the monster | canvas `data-stage-impact` changes at least 3 times in 8 s | combat |
| Hit flash and damage number | the frame hash changes at every impact cue | combat |
| Stage is animating, not frozen | at least half of consecutive frame pairs differ | combat |
| Frame rate and stalls | `requestAnimationFrame` average fps, p95 frame time, frames over 250 ms (headless software GL, so compare runs, not absolute numbers) | combat |
| Halted stage ("Boss ready"): no swings, hero idle loop still moves | impacts stay 0, frames still change | boss-ready |
| Reduced motion: no transform/slide animations | `document.getAnimations()` keyframes while visiting every tab | reduced-motion |
| Reduced motion: combat still readable | impacts still arrive | reduced-motion |

The Phaser game object is not exposed in any build, so the tool uses the dev-only canvas data
attributes (`stageRelease`, `stageImpact`, `stageMonster`) and pixel hashes. It adds no code to production.

## Not covered yet (add as extra scenarios, or look with your own eyes)

- Boss arena replay: attack and hit sequence, boss HP bar movement, Skip button.
- Forge reveal (charge, flash, rise, banner) and Relic toasts: needs a wallet or the classic demo flow
  (`e2e/polish.spec.ts` covers the reduced-motion version). Capture frames at 100 ms with the same `sample()` helper.
- Loot drop and chapter-complete moments, level-up.
- Anything about how it FEELS (timing, weight, readability of numbers): a human has to watch the videos.

Remember to open the `.webm` files and a few frame PNGs after each UI round; the numbers prove it moves, not that it looks good.
