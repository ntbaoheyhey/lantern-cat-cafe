# Demo integration merge log

A: 66f68bfe31a5e3d51952a2a7f55cba98453f46c6 (runtime 53fbf0da1)
B: 106c8a3540db45fe8f1557cbd3389241029b9bee (runtime 6a61d6acf)

Ownership follows A2 §3.3 and B2 §3.3. No rules, thresholds, or Q9 acceptance changes.

| Conflicted path | Resolution |
| --- | --- |
| `apps/web/e2e/formation-c2.spec.ts` | A: battle view / battle regression coverage |
| `apps/web/e2e/vfx-layered-c2.spec.ts` | A: battle view / battle regression coverage |
| `apps/web/src/game/cardrpg/depth/CompanionCard.tsx` | A: battle view / battle regression coverage |
| `apps/web/src/game/cardrpg/ui-v3/ResultA6.tsx` | A: battle view / battle regression coverage |
| `apps/web/e2e/odds-c2.spec.ts` | B: shell / economy / returning guest entry |
| `apps/web/e2e/support/depth-fixture.ts` | B: shell / economy / returning guest entry |
| `apps/web/e2e/text-diet-c2.spec.ts` | B: shell / economy / returning guest entry |
| `apps/web/src/game/cardrpg/contracts/audio-cues.ts` | B: additive superset includes every A cue; no cue renamed or removed |
| `apps/web/src/game/cardrpg/shell/HomeExtras.tsx` | B: shell / economy / returning guest entry |
| `apps/web/src/game/cardrpg/ui-v3/DailyA6.tsx` | B: shell / economy / returning guest entry |
| `apps/web/src/game/cardrpg/ui-v3/OddsC2.tsx` | B: shell / economy / returning guest entry |
| `.gitignore` | Union of A and B ignore rules |
| `assets/provenance.json` | Union of unique A+B provenance records, preserving both lanes |

## Integration fixes

No product-source merge fixes needed. Lockfile unchanged; existing installed dependencies retained.

Verification: workspace typecheck PASS; complete `pnpm test` PASS (2 pre-existing expected failures and 11 pre-existing skips); combat parity `battle-v3/controls.test.ts` PASS 2/2.

## Known demo gaps

Pending runtime and static smoke verification. Q9 S4 remains paused and unaccepted.
