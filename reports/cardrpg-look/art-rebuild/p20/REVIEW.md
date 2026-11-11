# Boss atmosphere resource disposal

Reproduced A6's reported `card-boss.test.ts` failure: expected3dispose events but received5. The renderer owns three legacy boss meshes plus the illustrated-mote mesh. The first cleanup released four resources; the second released the mote again because its disposal was unconditional while the boss map had already been cleared.

A private lifetime flag now makes the whole dispose method idempotent. The existing test observes geometry, material and instanced-mesh disposal separately for every actual child, checks each resource once after the first call, repeats the call and checks each count remains one. It also checks the atmosphere root detaches from its scene. Counts are derived from owned resources; the test does not merely replace3with5.

Typecheck/lint and four focused boss/material tests pass. No render-state, art, asset, action clock, rules or HUD behavior changed while the atmosphere is live, so accepted visual/parity runs were retained. The next P19 combined build will include this cleanup change. Last measured combined budget remains the P18 artifact38,185,046B; no new current-build size claim is made here.
