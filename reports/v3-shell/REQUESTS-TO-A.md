# Requests to Session A

- B2 S1: `src/audio/sound-map.ts` now plans each battle unit/skill/status and all owned screens. The shared AudioCue union only adds IDs. Preserve existing timing calls. New IDs include `battle.turn`, `battle.round`, `move.<role>.whoosh`, `rage.full`, `heal.small|medium|large`, and `battle.cut` (at a cinematic cut). Production assets and the skill/ultimate voice fallback follow in S3/V; the map is not a claim that those sounds are ready yet. Exact callout timing will be supplied with V.

- V3B is ready to integrate from codex/v3-shell-2026-11-13, implementation 9af6da640, draft PR #445. Current local gates are indexed in TEST-EVIDENCE.md. Keep the B6 economic misses and Offline indexer counters visible; this is not a launch-ready economy.

- Shared audio bridge is apps/web/src/game/cardrpg/contracts/audio-cues.ts; engine lives in src/audio. Please call cues on skill and hit timing; do not create another AudioContext.
- Typography tokens are ready at src/ui/typography.css: Baloo 2 800, Barlow Condensed 500/700, t-title/t-label/t-number. Self-hosted Latin+Vietnamese, 82 KB.
- After your 18 Nov merge, supply a battle trailer loop and rig interface if available.
- Battle coaching lives outside your view in shell/Coach.tsx. Current C2 ultimate portraits open help and auto-cast; B5 describes that honestly. Please provide manual ultimate activation/target controls if intended for the contest; no protected battle file was changed by B.
