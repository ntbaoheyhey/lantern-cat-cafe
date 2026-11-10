# Lane A6 decisions

- Reuse the existing clean A6 worktree on the requested branch; no checkout, reset, or stash.
- Keep Q0 limited to setup; defer gameplay behavior and Q1–Q16 to STEP 2.
- Add gameplayA6 beside cardRpgEnabled in apps/web/src/game/cardrpg/gate.ts; exact ?a6=1 opt-in, no build override and no attached behavior.
- Reuse existing actual-rule sim loaders and seeded battle/run APIs for a future single tool; do not re-run prior acceptance evidence in Q0.

## Q1
- Keep one simulation entry point and one development seed range, 1–500. Preserve the final seed block for Q15.
- Test all seeds on a fixed candidate-team sample, including the four authored V5 crews. Report coverage instead of claiming an exhaustive ranking.
- Define seven-day economy visits as four-minute check-ins with real commands; preserve unfinished patrols between visits.
- Memoize the old fixed-seed advisor only when builds and legal level-up choices match; restore the real account's stale-click guard.
- Authored animation time includes action anticipation and defeats. Browser overhead and human enjoyment require separate checks.

## Q2
- A6 opts into the existing V5 automatic rules and Living Cafe shell. Product default stays OFF. Committed routes retain their rules through save/import.
- Keep rage capped at one hundred; one outgoing hit gain per action prevents multi-hit kits from flooding rage. Emit full/cast events rather than changing the canvas.
- Three numeric tunes are enough for this checkpoint: G1 passes, G2 partial is explicit. Keep economy/first-session work at its queued priority.
- Legacy hashes remain exact; no expected receipts were updated.

## Q3 bonds
- Collection ownership grants half a percent HP and attack per completed set; nine sets cap the bonus at 4.5 percent. Equipped and benched cats contribute equally.
- Eight authored pairs trigger after a partner acts from round three, once per pair, requiring both alive. Existing V5 status and damage functions resolve the combo; no second combat engine.
- Events-v2 carries the pair name/contributors for future B-owned effects. A6 owns the mint DOM announcement and Bond Book only.
- The reusable first-session harness clicks real UI and observes the review hook without mutating it. One browser stays alive across two fifteen-minute timing-lock leases.

## Q4
- A6 Power is one full-health stat score for allies and foes. HP loss does not change it; it describes strength rather than guaranteeing a win.
- Quick upgrade compares real legal transactions by Power gain per weighted material cost; previews never spend.
- Auto-equip may use reserve gear but never removes an active teammate’s item.
- The A6 loss advisor checks at most twelve legal changes and prefers cheap options reaching eight wins in ten forecast fights. Generic fallback claims no win guarantee.

## Q5
- Reuse existing V4 loadout slots for Campaign/Daily/Tower; keep saved gear restores at home and use only rows/plan during preparation.
- Suggestions prioritize three play styles without running combat on the main thread; use the existing worker forecast for the matchup hint.
- With only three owned cats, suggestions share the roster and change standing plans. With enough eligible cats, prefer different rosters.

## Q10
- One selected Fuji Relic adds two to eight percent to the active team’s HP, attack and defense; holdings and copies do not stack. A6 keeps ordinary cat gear; OFF keeps the existing lead-cat effect.
- Reuse the existing read-only, pinned-block ABI adapter. Clear stale holdings on wallet/network changes and reject stale responses. Demo holdings require the offline component; the normal sandbox URL keeps product wallet behavior.

## Q11
- Early campaign bands one/two/three use 65/75/85 percent enemy attack; replays retain the same band pressure. Other modes and bands four and up are unchanged.
- Feature celebrations queue behind existing discoveries. Onboarding points to actual buttons and leaves normal play fully automatic.
- Zero observed defeats means hint retry rate is unobserved, not zero percent. The sim and report now show that distinction, and actual Legendary receipt is separate from pity budget.

## Q13a — original painted unit art
- Use the 25 original alpha concept masters published on origin/codex/cardrpg-art-r1-2026-11-09, under assets/source/look-v3/concepts/*.png. Read-only local counterparts: /Users/bao/taskbar-hero-cardrpg-b2/assets/source/look-v3/concepts/; masters: /Users/bao/art/look-v3/.
- Q8 face crops come from assets/cardrpg-look/v3-portraits/manifest.json on that published branch. Source identity and intended crop reviewed; these are DOM illustrations, not a claim that canvas puppets are accepted.
- tools/cardrpg-a6/pack-art.py packages alpha art at <=768×896, WebP86, and the existing 144px face crops. Runtime uses one manifest and the art-a6 helper across all v3 DOM views. Shared legacy cards retain their classic path outside A6.
- Missing manifest entry/file or runtime image failure falls back to the previous model portrait. Canvas, models, VFX, camera, rules, seeds and earned rewards remain owned by their existing implementations.

- Q13d scenery is original inline SVG in CampaignSceneryA6.tsx. Node placement is presentation only; edges/availability/stars/rewards use existing run state. Cat/enemy art still uses the unified original B manifest.

- Q13e: merge commits b9c1497d6 (B published P4 cats/P3 framing) and 00b04f8ee (B530bce90a P5 batch1 enemies). B owns all canvas files; A6 adds DOM HUD only. A6's opt-in App enables existing v3 puppet flags, preserving the main default OFF and the A6 shell.
- Q13e: gameplay playbackAt is wall time, so ultimate overlay lifetime is800/speed ms; the existing two-per-ten-second banner cap stays. Health trails are presentation only and never change combat HP. No manual cast control or second damage-number layer.
- Q13e: browser review uses Chromium channel with Metal, matching B's published harness. The default headless shell stalled shader compilation; that run is not pacing evidence. Q13f/g must report the browser/backend used.

Q13f: Existing route stays seven stops (early depths0–3, late4–5, guardian6); no artificial ten-stage subsystem. Fixed expected crew7500/7900/8200 and band budget are independent of equipped Power. Map/Prepare share exact enemy stats. A6 early levels gain4% per level (nine steps capped) in addition to existing growth; preserves legacy OFF. Late street adds one existing Binding Thread.

- 2026-11-10 resumed research gap: extended the three existing studies with source-scoped look/motion research; Q13a–e remain done. The campaign already has seven depths/nine nodes, so pressure bands map to that graph rather than adding ten fights. Power is not a win probability. Recovery and non-stuck play outrank forcing healer teams into an HP percentage.
- Added Q14a[auto] to improve the existing lowest-scored Bag/Tower/Relic compositions without systems; Q13g/Q15 now explicitly separate wall time from authored timing and include reduced-motion/keyboard checks. Recheck research after Q13f/g/Q14.
