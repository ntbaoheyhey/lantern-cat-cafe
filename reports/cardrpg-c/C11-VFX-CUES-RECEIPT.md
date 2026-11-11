# C11 VFX contact cues — 11 November 2026

Panko's Oven door had no particles at hit+150ms because every caster-anchored layer was consumed during windup. Separate timing phase from spatial anchor: early caster accents remain at cast/ult-start; late caster layers fire on hit from vfxOrigin or feet. This also restores late self/return accents. Keep all authored glyphs, counts, combat rules and designer overrides.

12 focused registry/event/cinematic tests and workspace typecheck/lint pass. Source and rebuilt offline gallery each pass 888 cases (74 actions × three speeds × two motion settings × two sizes): contact particles, event counts, face/HP masks, cleanup and pool budgets. Six actual Pause/Play checks each freeze raw RGBA/time and resume. Peak active42, maximum61combined draw calls, no dropped particles/browser errors/HTTP. Source22 captures were inspected during the prior pass; offline22 captures and actual A6 battle12 captures inspected at1280×720/1440×900. Battle fixtures leave combat unchanged and use at most43draws. Both isolated performance captures were inspected.

Forced manual redraw equivalence is PARTIAL after three harness attempts: four sequential cases still differ, despite isolated identical socket/track times and identical decoded pixels. PNG byte-string equality is invalid for this purpose; the raw-pixel diagnostic is retained. Actual user Pause/Play is the simpler passing gate. No runtime pose/mixing change was made to hide this issue. The first enemy battle harness used inspect(-1), which intentionally has no action; corrected to inspect(0), with initial receipt retained.

Isolated offline p95:16.8ms at1280×720 and16.7ms at1440×900,240frames each,60draws. No concurrent heavy PSD process observed. Each mask check sampled21,072points with0opaque. Demo29,208,328bytes (<40MB), evidence52.95MB (<120MB); original recordings preserved. Full421E2E receipts predate this change and are not a fresh full-suite claim.

Visual follow-up: Kettle Knight's current damaging signature still inherits the legacy friendly Mirror polish self-shield recipe. Its timeline is now correct but its meaning is wrong; repair next in the Spine registry and verify against current rules. Designer inbox remains README-only and Mochi's published pilot is unchanged. Score7.79 and all gameplay misses remain unchanged.

Evidence: checks/c11-vfx-cues-*.log; shots/c11-vfx-cues{,-offline,-battle,-performance}/; tools/cardrpg-c/vfx-cue-review.mjs and vfx-cue-battle-review.mjs.
