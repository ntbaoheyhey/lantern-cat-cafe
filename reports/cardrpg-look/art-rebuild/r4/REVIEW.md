# R4 roster VFX checkpoint — PARTIAL

Reviewed the 60-tile peak sheet, four-beat captures and the 1x film contact sheet. Motion observations from the contact sheet are limited; continuous film review remains separate. Sources are the twelve existing built-in-generated component masters; no character was regenerated.

A/B preference: the new light preserves the warm/mint/violet source colours, comes from the equipped prop, and surrounds the actual target. The old copied cups/doors/buttons are removed in v3. Mochi arch, Clover wreath, Mallow fire and Velvet ribbons now distinguish their ultimates at 1x. Friendly protection and hostile hits remain visually different.

Five flaws and repairs:
1. Mallow/Cinnamon impact grew from a short shape below the torso: raised signature centre and replaced slow rise with held upright impact; retained failed shots and fire-after comparison.
2. Source mint/violet colours collapsed into a uniform tint: retain source chroma in the shader.
3. Enemies materialized extra physical props: replaced all remaining families with generated light/thread/steam components.
4. Several normal/passive peaks still resemble each other: unresolved; the 60-tile uniqueness gate is PARTIAL.
5. Protected-face clipping can split a large motif, and late afterglow sometimes reads more strongly than the first hit: known limitation for follow-up.

Agent visual score: 7.7/10 (target 8.0 not met). This is an honest partial checkpoint, not acceptance of the whole roster. Sources and implementation are complete; final audit/phase closure remain in QUEUE.

Evidence: 168 cast samples max16.8ms,111calls,183595tri; 300 roster+24fire protected-face samples have zero offenders. Five rules seeds remain byte exact and85 resolved plans unmutated. Web1823tests/type/lint/build passed; later combined camera E2E421/421 passed. Detailed source/artifact hashes are in the receipts. Cold results are recorded separately; screenshot passes do not imply startup/heap passes.

Cold3+3: native whole-load max49.9ms, CPU4 max183.3ms<220ms; native post-ready max16.8ms. One CPU4 post-ready frame33.3ms; all others<=16.8ms. Battle-ready5.82–5.90s native and9.45–10.17s CPU4. Startup delta/zero allocation gates are not inferred. Original traces archived with hashes in cold/external-traces.json.

Third bounded repair verified in audit3/peak-sheet and final/sheet: airborne hit is visible during impact, Velvet crosses and passive paired halos are present, source hues retained. Ten touched cast samples max16.8ms/81draws/116208tri;72faces0offenders, no new console errors. Final1x film412frames at ~/art/look-v3/evidence/vfx-final/roster-vfx-final-x1.mp4. The60tile sheet still has similar small normal/passive cues; score remains7.7PARTIAL at repair cap, continue roster. Continuous playback review pending shared lease.
