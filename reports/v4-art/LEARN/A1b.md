# A1b — class movement and effect language
RA6 provisional answer: melee is recognized by closing distance, a planted directional contact, and a separate return; ranged by a planted caster and an independently travelling shape; healing by recipient-centred rising shapes and positive numbers with no flinch. Reference speed indicators are accelerated(x2/x3); measured wall timings are not directly substituted for our fixed800/2200ms action envelopes.

## Method before authoring
Motion and silhouette supplement colour. Keep anticipation stationary enough to identify the actor, then make direction clear. Melee out/contact/back must fit one interval and stop at front edge. Effect follows the weapon, and destination is based on opaque bounds rather than slot centres. Ranged launch/travel/contact are separate events; a minimum3visible frames requires at least100ms at30fps and alignment checks. Healing brightens allies only and uses upward soft forms rather than lateral sharp impacts. Strong accents are reserved for contact; sparse trails show travel. The precise dash profile, projectile time and heal shape are selected from the drill below.

## Sources
- A1b-hoffman [paper] https://sites.socsci.uci.edu/~ddhoff/InterpBiologicalMotion.pdf — Relative motion encodes structure; use action trajectory+posture cues, not colour alone.
- A1b-clarity [breakdown] https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/ — Visual hierarchy and facing/silhouette must represent gameplay purpose.
- A1b-vfx [doc] https://www.riotgames.com/en/artedu/visual-effects — Effects should identify the action and source while preserving whole-roster clarity.
- A1b-character [doc] https://www.riotgames.com/en/artedu/character-art — Proportion and readability must survive small game scale.
- A1b-events [doc] https://esotericsoftware.com/spine-events — Animation events trigger presentation work; runtime owns actual playback.
- A1b-reference [local] reports/v3-feel/CRAFT/REFERENCE-BREAKDOWN.md — Sixteen classified action studies across two videos, source times and uncertainty retained.
- A1b-own [experiment] tools/v3craft-lab/v4-classes/results.json — Pending3dash/2projectile/2heal variants on own Mochi/Soot/Clover art.

## Plan before drill
Revisit the sixteen-action catalogue, and inspect same-scale close-up melee(B01/B04), ranged/cast(B06/U03/U07) and heal(U02/U06) in both clips; retain obscured/unknown fields rather than inventing movements. Native frame timing is used where10fps samples cannot resolve dash travel. Experiment on our existing art: Mochi travel to front edge in150/200/250ms and back by800ms; Soot projectile150/250ms ending350ms; Clover leaf-like rising fragments versus steam-like ribbons on an ally at350ms. These are movement/effect design drills; Mochi/Clover still use K0 until their pose items. No balance or production acceptance claim.

Class language initial: melee warm ivory/amber cuts+dust; ranged unit-flavour tapered projectiles with a bright head and trailing body; healer sage/mint/cream upward leaf/steam forms, green+N, no damage starburst or enemy emission. Enemy colours remain attributable to their unit while preserving these motion cues.

The Johansson original URL returned502; read Hoffman & Flinchbaugh1982 from the author-hosted PDF instead, including minimal-motion displays and motion geometry. This supports using trajectory/relative limb motion as a cue, not a specific RPG timing prescription.

Reference reinspection: U02v1 stays in the same caster slot, recipients upright, green recovery numbers and rising particles; U06v2 also has green recovery numbers but its bright summon masks faces. Copy neither the large rings nor the whiteout. B01v1 moves ~115/640screen pixels into contact between41.7–41.9s, then returns separately; native travel bracket to refine below. U03v2 sends falling lances from a planted lower caster; U07 sends a separated water strike after a launch gate. Their20–30%field-scale signatures inform projectile hierarchy, not our final art.

## Selected drill recipe and observed comparison
Melee: choose 200ms approach (100–300ms), contact at350ms, 90ms contact hold, return440–800ms. The432.5px drill travels in6 frames at30fps;150ms creates a larger gap between visible positions,250ms weakens the stationary preparation. All reach8px front-edge gap with0overlap and home by800ms. Ultimate keeps focus0–600ms, approach600–1000ms, impact1100ms, then return within2200ms. These durations are authored design choices, not inferred x1 reference timings.
Ranged: choose150ms travel, launch200ms/impact350ms,5sampled travel frames at30fps,0foot displacement. The250ms variant has8frames but spends too much of the anticipation in travel. Grow the trail from the source so it cannot extend backward through the caster. In production launch from the live pose socket, not the drill's approximate anchor. Purple/amber flame for Soot; independently moving tapered form and a compact impact. Ultimate launch950ms/impact1100ms is the initial candidate, subject to film review.
Healer: choose rising sage/mint leaves with cream tips; keep steam as a secondary atmosphere cue. Leaves retain separated silhouettes in the drill while the steam bands read more like lateral attack ribbons. Apply at the actual ally heal event350ms/1100ms;0enemy shapes,0hit poses,0shake. Keep the face and number area clear.
All7own drill sheets were inspected in the prior study. Revised ranged comparison inspected2026-11-16: source character now fully visible; ours has a distinct head/trail with readable face. Reference fire effect masks much of its caster surroundings; reject that obscuration. The other two same-scale comparisons were inspected previously: melee emphasizes translation/contact, healing recipients remain upright. This is composition/motion study, not proof of inferred reference kit rules.

## Coverage and uncertainty
The16-action inherited selection is a sample, not a full-video catalogue. B01–B05/B07/B08 are visually melee; B06 has both a forward step and travelling lance and is ambiguous. U01 melee, U02/U06 heal; U03/U07/U08 planted or independent travelling casts; U04/U05 cinematics obscure travel/return. Full-video coverage remains OPEN and A1b is not marked done. 10fps phase observations carry at least100ms uncertainty;60fps dash strips sampled every4frames provide66.7ms spacing, not native consecutive-frame hit-stop. B01 displacement~115/640px from41.7–41.9s; return separately visible42.9s. No exact hit-stop or x1 conversion is claimed. Source images stay private and will be removed when the item ends.

## Handoff to production
Use these movement cues in A2 spacing and A3–A7 authoring, then validate on real1280x720/1440x900 films. G-ROLE, G-FX, G-POSE, G-READ remain NOT YET. Binding Thread classification requires SHIP's S2b decision because current snare mechanics target cats while A7 wording says healer.
