# Skills V5 V0 presentation integration

Base: `598fd8019e62b7203dcfac4033f74bb64ba0dac5`, the B2 V6 branch tip after the report's `f4cd0da0b` checkpoint. The extra tip commit is handoff documentation. V0 does not adopt A5 or Skills V5 rules.

- Adopt the B-owned source changes and SVG archives together. Keep `lookV2` as the outer gate; `LEGACY_CARD_STATUS_LOOKS` retains the six OFF cues. No rules, balance, dependencies or saves change.
- `StatusBadges` reads live actor statuses and `STATUS_BY_ID`. Adding a rules status requires its display name, original icon, body/apply/tick/expiry look and a passing catalog-coverage test. Labels intentionally retain the existing tooltip rules while using the approved plain-English vocabulary.
- `statusPresentation(plan, battle.log)` matches existing adapter sequence numbers to resolved source logs once per plan. Apply/tick/expiry and Crumb Burst are derived from real logs, never inferred from a selected skill. Unmatched logs use legacy presentation. No event or plan is mutated.
- Target visuals use 70ms offsets in log order inside the existing action. The action duration delta is 0ms; direct/DoT labels stay separate. Crumb Burst words last 500ms and use free screen space when the arena has limited headroom.
- Carry `SceneView.cardPresentation`, structured `cardStatuses`, pooled body height and live crown anchors together. Face masks, effect/light pools and lazy renderer loading remain in place. Sixteen statuses can coexist, but four HUD badges plus +N are the readable summary.
- Existing battle events-v4 v1 remain supported; unknown battle versions retain the inherited legacy fallback. Do not mistake earned-reveal v2 support for a Skills V5 battle adapter. Earned reveal API, phase <=400ms and finish <=800ms are untouched.
- Bleed/Bitter and new reactions require lane A's published v2 fixture before V3. Needed fields: status-applied `{statusId,stacks,sourceId,targetId}`, status-tick `{statusId,amount}` with unambiguous bearer/source context, reaction `{reactionId,primerIds[],targets[]}`, multi-hit `{skillId,targets[] in order,shape}`; retain event ordering and action/round identity.

The offline demo's Status guide offers clearly labelled presentation previews. The six paired shots deliberately stage statuses and rule-resolved row/detonation actions; the videos use an ordinary chapter-1 battle at x1 with no injected actions. Human status-recognition acceptance is not measured.

Measurements bind to the artifact SHA and source hashes in `RESULTS.json` and `source-audit.json`. Earlier overlap, crown clipping and harness failures are retained in iteration/diagnostic receipts and are not reported as passing delivery samples. No merge or deployment is part of this handoff.
