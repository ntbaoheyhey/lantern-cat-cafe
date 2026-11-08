# A5 B2 — Hush must earn its suppression credit

Status: focused reproduction verified; candidate remains isolated while the previous utility-turn correction finishes validation.

On a Hushed enemy's ordinary attack, current16 leaves the attack intact but also records `suppressed` and grants the first eight-HP Lantern heal. All five utility-capable enemy types reproduce this: Teacup Healer, Button Guard, Pollen Scout, Yarn Giant and Pantry Crown. These events falsely attribute a benefit to a control effect that did not change that action.

Signature19 prospectively registered 60 controlled seed-5 fixtures: five enemies, both gameplay modes, basic/signature turns and none/Hush/Drowsy. The original source passes 55 and fails the five V4 Hushed basic cases. The candidate requires a committed signature for Hush suppression credit and passes 60/60. All actual attack events are identical. All 30 OFF cases and the other 25 V4 cases are byte-identical; the five repaired cases only remove the false event and unearned heal. Drowsy continues to credit its actual attack weakening.

This changes when the once-only Lantern heal can activate, so it is not merely a wording fix. It does not alter the enemy's attack, the earlier utility-turn repair, the heal amount, skills, AI or equipment. No saved-state field or schema changes.

[Prospective semantic method](b2/hush-signature-19/REGISTERED-METHOD.md) · [original failures](b2/hush-signature-19/before.json) · [candidate](b2/hush-signature-19/after.json) · [paired event audit](b2/hush-signature-19/audit.json).

Signature20 is registered before wider sampling. It preserves the exact current16 1,321 TRAIN1–50 cells and all 90 previously earned day7 saves. This is a paired composition check, not a fresh 45-day earned cohort. All negative pairs must remain visible. Wider results and source adoption are pending; existing balance misses and fresh acceptance remain open.

[Prospective composition method](b2/hush-signature-20/REGISTERED-METHOD.md). No acceptance seeds, cooldown experiment, rear-reach experiment or gear-fixture change is combined.
