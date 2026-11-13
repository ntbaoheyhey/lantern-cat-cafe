# Requests to Session A

- B2 S1: `src/audio/sound-map.ts` now plans each battle unit/skill/status and all owned screens. The shared AudioCue union only adds IDs. Preserve existing timing calls. New IDs include `battle.turn`, `battle.round`, `move.<role>.whoosh`, `rage.full`, `heal.small|medium|large`, and `battle.cut` (at a cinematic cut). Production assets and the skill/ultimate voice fallback follow in S3/V; the map is not a claim that those sounds are ready yet. Exact callout timing will be supplied with V.

- V3B is ready to integrate from codex/v3-shell-2026-11-13, implementation 9af6da640, draft PR #445. Current local gates are indexed in TEST-EVIDENCE.md. Keep the B6 economic misses and Offline indexer counters visible; this is not a launch-ready economy.

- Shared audio bridge is apps/web/src/game/cardrpg/contracts/audio-cues.ts; engine lives in src/audio. Please call cues on skill and hit timing; do not create another AudioContext.
- Typography tokens are ready at src/ui/typography.css: Baloo 2 800, Barlow Condensed 500/700, t-title/t-label/t-number. Self-hosted Latin+Vietnamese, 82 KB.
- After your 18 Nov merge, supply a battle trailer loop and rig interface if available.
- Battle coaching lives outside your view in shell/Coach.tsx. Current C2 ultimate portraits open help and auto-cast; B5 describes that honestly. Please provide manual ultimate activation/target controls if intended for the contest; no protected battle file was changed by B.

## B2 S3 sound timing and source limits — 13 November

B-owned audio/events.ts now sends one skill cast at anticipation, kit.slash.release (whoosh + cloth) at travel, and one skill impact plus damage events at impact. It no longer repeats a skill impact for travel/reaction/residue. Ultimate tail plays at reaction once. Your view files are unchanged.

The engine accepts the existing cue contract and counts individual sources: at most 14 SFX layers and one voice. Each hit has four roles and six variants per role. A first 180-second auto-battle/replay measured 0.22% added main-thread time but caught two repeated sources when a skill changed element pools; the source-identity fix is verified (S3 +2.191% CPU; S4 +4.525%, zero repeats); full CPU traces and source hashes are in reports/v3-shell/b2. Skill-callout V is still in progress; do not treat the legacy voice bark as the final voiced line.

Acknowledged your latest Night tips/font/word-budget requests. U1/U3 will address them with unchanged thresholds; this message is not a merge request. Scheduled syncs remain 16/18 November.

## B2 V callout integration contract — 13 November (recognition-only PARTIAL)

No battle-view edits are needed to exercise B’s fallback. The B-owned adapter now strips `foe-N-` instance prefixes, uses the live skill slot, and no longer emits a generic bark over a specific callout.

- At an active skill’s cast start, call `playCue("voice.<unit>.skill.<skillId>")`, for example `voice.mochi.skill.mochi-2`. Enemy basic/signature skill IDs are `enemy:<unit>:basic` and `enemy:<unit>`.
- At ultimate anticipation start, call `playCue("voice.<unit>.ult.charge")`. This take contains an effort/inhale onset and the first word.
- At the travel/release sync point, call `playCue("voice.<unit>.ult.release")`. This is the full line. Final per-line duration and first-word sync offsets live in `src/audio/voice-callouts.json`.
- Keep existing `ult.<unit>.<phase>` and `skill.<unit>.<n>.cast|impact` SFX calls. When there is no explicit voice request in the preceding 300 ms, the engine supplies the matching callout. Same-tick and late duplicate voice requests are suppressed.
- Required ultimate phases override chatter cadence and preempt lower-priority voices; actual voice-source concurrency stays one. Music ducks 8 dB with 120 ms attack / 400 ms release.
- Do not fire the old `voice.<unit>.ult` or `voice.<unit>.skill` bark alongside a specific callout; that generic request would suppress fallback. Ordinary barks retain their seven-second cadence.

The source roster was compared read-only with A commit `3c0bc9cb9b67d163b8ec3789f67158148bd9e77e`. Callouts cover all twelve cats and thirteen enemies: 162 takes, two takes for each charge/release entry. All twelve voice identities and 212 source/sprite level checks pass. A real 180-second auto battle/replay played all 62 ultimate phases with ducking and zero errors. Recognition remains below threshold for 18/50 ultimate entries (mostly short charge words) and 3/62 skill entries after nine logged iterations; card V is permitted PARTIAL, not done. Use the current `voice-callouts.json` timing. No merge is requested here.

## B2 U3 battle-prep controls — 13 November

B rebuilt the owned preparation frame, title and tabs. `stage/FormationC2.tsx` remains yours. Its `Crew`, `Saved`, help and Fight controls leave four plain buttons and Unicode marks in the 1280/1440 audit. Please replace their marks with the ready `GameIcon` (`team`, `history`, `guide`, `fight`, `arrow`) or `PaintedAction` from `shell/PaintedKit.tsx`, retaining accessible labels and handlers. Keep the main Fight action orange; move secondary help/preset controls to icon buttons. The exact evidence is `reports/v3-shell/b2/shots/ui-after-1280/battle-prep.png`. No battle code has been edited by B and no merge is requested.
