# Checkpoint, 20 Nov 2026 (submission 21 Nov)

This note lets a new session pick up the work. Update it when the state changes.

## What the game is now

- The default route (`/` → `?demo=1&squad=1&cardrpg2=1&a6=1`) opens the **full campaign**.
  - Café home, then a practice fight.
  - 3 chapters, each with 7 route nodes: battle, event/elite, treasure, shop, campfire, battle/elite, boss.
  - Bosses: Yarn Giant, Rain Spool, Pantry Crown.
  - Gear drops with published odds. Forge, Market, Season.
- The short judge cut is still at `&ui=v3`.
- Ultimates are **player-timed** by default: a full-rage portrait shows TAP, and tapping it casts on that cat's next turn. An untapped ready ultimate fires by itself after 2 held turns (`ULTIMATE_GRACE_TURNS` in `battle-v3/controls.ts`). The Auto toggle casts at once. The judge cut always uses auto.
  - Why the grace: a rules sim on a fresh account cleared Ch1 on 0 of 8 seeds when ultimates were never cast, against 2 chapters on every seed with auto. First-time players who never notice TAP were locked out.
- Story beats come from public run state: opening, an intro, guardian and clear beat per chapter, and an ending. They live in `apps/web/src/game/cardrpg/ui-v3/StoryBeats.tsx`. Seen beats are stored in localStorage `lantern-story-seen`.
- When a boss or elite winds up its signature, the battle shows a red banner naming the target.

## Open PRs and merge order (the integration thread owns merges)

1. #455 gear drops, Ch3 balance, boss result screen. **Merged.**
2. #462 smooth cat idle: the video no longer pauses on hits or ultimates. **Merged.**
3. #458 campaign default, manual ultimates, story beats, boss warning, shader-program pinning. **Merged.**
4. #459 Relic offer after the Ch1 guardian.
5. #460 chapter arenas and boss grades.
6. #461 boss and elite voices, boss stings, victory and defeat cues.
7. #464 chapter intro story beat and this checkpoint. **Merged.**
8. #466 stay on the route after a mid-route win, readable route cards, ultimate grace. **Merged** (main 4699a30 = v5-m2.17 once the owner pushes the tag).
9. #468 a cleared route shows its summary (finds, the Ch1 Relic offer) before the café; a lost route goes back to the café; the Fight button reads "Ch 2-1 · Battle".
10. #463 Codex enemy relight. Optional; merge only if its screenshots are clearly better.

#455 and #458 both touch `supabase/functions/_shared/chain-campaign-manifest.ts`. After any merge that changes `packages/game-rules/src`, run `node tools/chain/campaign-manifest.mjs`. Also refresh `docs/chain/supply-study.json` hashes with `node tools/chain/supply-study.mjs`, which takes about 6 minutes; its supply numbers should stay unchanged.

## Smoothness findings (cats "freezing")

- The idle videos are clean. The loop seam differs by 0.2× a normal frame step, and there are no static runs.
- The video idle paused on every hit and for about 2 s during ultimates. Fixed in #462.
- three.js released a shader program when its last effect ended, then relinked it on the next hit. One program was relinked 7 times in a 130 s fight, and each relink stalls the frame. `spine/program-pin.ts` keeps programs cached (#458).
- Not yet done:
  - First-use shader compiles remain: about 20 in the first 12 s of a fight.
  - The battle has 3 WebGL contexts and 5 full-screen 2D canvases.
  - The main renderer uses `powerPreference:'low-power'` and `preserveDrawingBuffer:true`.
  - These need checking on a real Mac GPU, which the cloud does not have.

## Jump-to-scene for recording and testing

- Add `&dev=1` to expose `window.__depthReview`.
- Start a fight with:
  ```
  m=window.__depthReview; m.state.tutorial=4; m.start(CHAPTER); m.enter(NODE)
  ```
- Node ids: `0-0` battle, `1-0` event, `1-1` elite, `2-0` treasure, `3-0` shop, `4-0` campfire, `5-0` battle, `5-1` elite, `6-0` boss.
- To skip story and coach, set these in localStorage:
  - `lantern-story-seen`: all beat ids
  - `lantern.coach.v3`: `{"disabled":true}`
  - `lantern.entered.v3`: `1`

## Browser playthrough (20 Nov, late)

A Playwright bot played the campaign on main plus #468 from an after-practice account (Mochi, Soot, Clover, Panko). It never tapped an ultimate, so the grace rule cast them.
- Ch1: all stops, the Yarn Giant, the clear beat and the Ch2 intro work. Before #468 the Relic offer never showed.
- Ch2: all stops, the Rain Spool, the clear beat and the Ch3 intro work.
- Ch3: without upgrades the first route lost at stop 5-0, as designed. The defeat screen offers "Equip new gear · +141 Power".
- Scripts are in the session scratchpad, not the repo. `camp.cjs` drives the route with `window.__depthReview` and real buttons.
- Battles cannot be skipped in a6 until the stop has 3 stars (`canSkip`), so a full run takes about 45 minutes at speed 1.

## Next steps

1. Merge #468, then re-check the Ch1 route summary with the Relic offer on main.
2. Confirm Ch3 and the ending after Quick upgrade and Auto-equip.
3. Add a 3-minute demo start point cut from the campaign.

## Only the owner can do these

- Fund the café sponsor wallet `0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000` on Fuji. It is below its 1 AVAX reserve.
- Approve or deploy the Supabase functions auth-verify, chain-judge and guest-drip:
  ```
  supabase functions deploy --project-ref qoalewtxflagoprrxrgh
  ```
- Vercel:
  - The daily deploy quota is hit, so retry after it resets.
  - Set the production environment for the new build.
- Reset the leaked Supabase database password.
- Record the narrated 3-minute demo once the trailer thread has the final cut.
- Watch the battle on a Mac and confirm the cats feel smooth.
