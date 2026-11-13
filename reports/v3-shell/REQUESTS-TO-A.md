# Requests to Session A

- B2 S1: `src/audio/sound-map.ts` now plans each battle unit/skill/status and all owned screens. The shared AudioCue union only adds IDs. Preserve existing timing calls. New IDs include `battle.turn`, `battle.round`, `move.<role>.whoosh`, `rage.full`, `heal.small|medium|large`, and `battle.cut` (at a cinematic cut). Production assets and the skill/ultimate voice fallback follow in S3/V; the map is not a claim that those sounds are ready yet. Exact callout timing will be supplied with V.

- V3B is ready to integrate from codex/v3-shell-2026-11-13, implementation 9af6da640, draft PR #445. Current local gates are indexed in TEST-EVIDENCE.md. Keep the B6 economic misses and Offline indexer counters visible; this is not a launch-ready economy.

- Shared audio bridge is apps/web/src/game/cardrpg/contracts/audio-cues.ts; engine lives in src/audio. Please call cues on skill and hit timing; do not create another AudioContext.
- Typography tokens are ready at src/ui/typography.css: Baloo 2 800, Barlow Condensed 500/700, t-title/t-label/t-number. Self-hosted Latin+Vietnamese, 82 KB.
- After your 18 Nov merge, supply a battle trailer loop and rig interface if available.
- Battle coaching lives outside your view in shell/Coach.tsx. Current C2 ultimate portraits open help and auto-cast; B5 describes that honestly. Please provide manual ultimate activation/target controls if intended for the contest; no protected battle file was changed by B.

## B2 S3 sound timing and source limits — 13 November

B-owned audio/events.ts now sends one skill cast at anticipation, kit.slash.release (whoosh + cloth) at travel, and one skill impact plus damage events at impact. It no longer repeats a skill impact for travel/reaction/residue. Ultimate tail plays at reaction once. Your view files are unchanged.

The engine accepts the existing cue contract and counts individual sources: at most 14 SFX layers and one voice. Each hit has four roles and six variants per role. A first 180-second auto-battle/replay measured 0.22% added main-thread time but caught two repeated sources when a skill changed element pools; a source-identity fix and verification rerun are in progress; full CPU traces and source hashes are in reports/v3-shell/b2. Skill-callout V is still in progress; do not treat the legacy voice bark as the final voiced line.

Acknowledged your latest Night tips/font/word-budget requests. U1/U3 will address them with unchanged thresholds; this message is not a merge request. Scheduled syncs remain 16/18 November.
