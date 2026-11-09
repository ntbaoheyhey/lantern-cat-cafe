# S6 artifact and guide self-review

One-agent self-review of all eight contact sheets (126 artifact captures + 21 guide captures); six full-size inspections. Not an independent reviewer, human recognition test, continuous animation review or timing sample.

**PARTIAL.** The [manifest](manifest.json) and [review receipt](review.json) bind all reviewed files to artifact `4e310b07f9dfb005abdff830d498e8d0f6615553e1710a2ce12eeedad3a3638e`. All 147 captures are retained; the route-map coverage gap below remains explicit.

## Z-CONTRAST — PARTIAL

Look V2 ON min 6.2448:1, zero scan failures; OFF min 1.6214:1, 27 flagged text nodes per width (81 across all three widths). The scan includes rendered below-fold content, so the smallest ratio is not necessarily in the visible screenshot.

Legacy-look card text meets a pale gradient; no claim of pixel contrast at every location.

Adjust A-owned legacy-look card text/backplate and verify the same three widths on a future artifact.

Evidence: [original capture or receipt](../../s6/z/summary.json).

## Z-OVERLAP — PARTIAL

Six enemy-plate overlaps across four of six ready-scene captures: Button Guard at 1280 in both looks; Button Guard and Sock Skipper at 1024 in both looks. Zero in the two 1440 captures.

The A-owned fallback strip uses a fixed offset inside the battle region without reserving renderer plate space.

Reserve space for the fallback outside the arena; verify ready-scene rectangles. B owns its separate rendering integration.

Evidence: [original capture or receipt](../../s6/z/1280-look-on/checks.json).

## Z-FIELD-GUIDE — PARTIAL

In-game Field guide still labels Cozy, Scald, Tangle, Steep, Scented, Rattled and Drowsy, including old Tangle/Rattled rules and cap values. The Companions glossary and standalone V5 guide use the eight V5 display names.

Pages.tsx Codex reads R.STATUSES and statusDescriptionV4 with only a v4 prop; it has no skillsV5 path.

Add an A-owned skillsV5-gated Codex vocabulary/description path. Current playtest instructions point to the correct glossary; source remains unchanged.

Evidence: [original capture or receipt](../../s6/z/1440-look-on/guide.png).

## Z-ROUTE-COVERAGE — PARTIAL

All six night-route captures have screen=prepare and visibly show Prepare. Current settled route-map screenshot coverage is NOT VERIFIED, despite 126 retained captures.

The prepared practice state survives the imported save; Night route resolves to the pending Prepare screen. The harness asserted readiness, not the requested map identity.

Future route fixture must clear the pending tutorial and assert screen identity. No repeated screenshot pack or replacement of these samples.

Evidence: [original capture or receipt](../../s6/z/1024-look-on/night-route.png).

## Z-MINIATURE — NOT VERIFIED

Home/Companions captures include Preparing miniatures. The battle capture explicitly waits for scene readiness; the meta captures do not wait for miniature readiness.

These are real sampled transitions, not proof of a persistent missing model.

Use a future settled-miniature check if assessing appearance or loading, separate from this retained pack.

Evidence: [original capture or receipt](../../s6/z/1440-look-on/fresh-home.png).

Default Look V2 has zero contrast-scan failures; zero horizontal overflows occur across both looks. The separate guides pass their static contrast/link/content checks. The original two empty Z harness attempts and the full E2E clock failure remain preserved; successful recovery is reported separately.

No new runtime candidate was introduced after acceptance. Future pacing and balance work remains the priority; any gameplay retune requires TRAIN and a newly registered 30001–30500 block.
