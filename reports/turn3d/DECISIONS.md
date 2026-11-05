# Turn3D decisions

## T1 · turn rules
1. Preserve the earlier engine for the explicit comparison; add a pure turn module.
2. Use speed intervals and seeded ties, one pending slot per living actor, with pure previews.
3. Partition start/action/end into distinct event plans, then serialize their presentation.
4. Lock input before resolution; repeated API calls cannot duplicate actions or settlement.
5. Validate replay, legal policies, control, row targeting and once-only boundaries with properties.

The user revoked helpers at 16:33. The primary session completed the unfinished policy,
tests, balance runner, review and subsequent work. See HELPER-CONTRIBUTIONS.md.

## T2 · skill conversion and tuning
1. Reuse all cast names, three basics, nine activated abilities, passives and enemy roles.
2. Give every hero skill explicit target, own-turn cooldown, power/heal/shield and charge cost.
3. Derive numeric tooltips from config so the UI cannot silently disagree with tuning.
4. Commit enemy target/move ahead of the player's decision; taunt/interrupt announce changes.
5. Simulate both presets and policies, preserving failed tuning receipts without claiming human pacing.

Initial 360-run trial: all wins, no deaths; rejected as insufficient boss pressure.
Second trial: normal enemy HP/attack increased; boss 3300HP/170ATK/92speed was too harsh
for Hearthkeepers (7/30 boss Auto wins and 0/30 active). Reducing boss to 3050/157/88
and removing an excessive active-policy delay preference is being validated.
All changes are local turn config/policy only. Existing economy and real-time numbers stay intact.

Final T2 trial (360 runs, seeds 1–30): every patrol/campaign condition wins 30/30;
standalone boss Hearthkeepers Auto 27/30, active 24/30; Lanternbreakers 30/30 both.
Campaign means: Hearthkeepers 160.47/153.93 turns Auto/active, Lanternbreakers
132.47/122.50. Some campaign victories include fallen cats. Boss enrage moved to 15
boss turns; burst attack/speed premiums reduced to 1.12/1.06. Burst is still easier,
and active target priority is not a universally better boss policy; disclose this.
No human duration/quality claim follows from these headless runs.

## Proof regrade · solo

- Replace per-particle sprites with one bounded InstancedMesh; paused updates only
  invalidate when state/anchors change. Source remains an event-only presenter.
- Keep 3D as an explicit extra opt-in. The original 2D candidate remains available.
- Correct KO actor ownership, healing reaction, terminal caption, multihit totals,
  model role replacement, fixed-time animation and missed throttled UI notification.
- Add original shield/flame/flask/petal path geometry and reduce impact whiteout.
- Run software and Metal profiles separately. Metal full Chromium is supported on
  this Mac; no claim is extrapolated to other hardware. Keep both backend receipts.
- Preserve complete failed balance trials as gzip JSON and current runs with full
  histories. Captures use JSONL, one frame per record, to keep evidence diffs readable.
- Split proof tools/balance from measured evidence to keep every draft layer under
  1500 changed text lines. Disable the additional evidence ref in both Vercel roots.
