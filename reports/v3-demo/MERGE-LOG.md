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

Demo packaging only:
- Reuse the existing A6 builder and loader with `--v3-demo`; the old output path and artifact stay untouched.
- Add B's entrance, audio engine/controls, shell pages and wallet panel around the existing offline game entry.
- Embed shipped public audio, cinematics, art, rigs, fonts and icons. A single file would exceed 60 MB, so the existing payload is split into script packs under `assets/`; no new bundler.
- Resolve public resource URLs to restored Blob URLs for file://. Static chain mode is explicitly offline.
- B's chain-config loader treats unknown modes as public Fuji. The static-only build transform makes that loader report offline before creating an RPC client; the real counter UI displays Offline. The initial full static smoke reached every screen with zero console errors and zero outbound requests, but caught three blocked RPC attempts; this packaging fix removes those attempts.
- The demo Vite config redirects localhost to B's loopback fixture origin, fixing guest SIWE/CORS. It removes external font links because fonts are bundled locally.
- A's turn-order HUD asks for twelve enemy `portrait.webp` paths omitted by B's public rig directories. A demo-only alias map serves the existing A face/art files in both live and static packaging. No new art or combat changes.

Verification: workspace typecheck PASS; complete `pnpm test` PASS (2 pre-existing expected failures and 11 pre-existing skips); combat parity `battle-v3/controls.test.ts` PASS 2/2.

## Known demo gaps

- Saved artifact is a folder, about 249 MB with all shipped audio/cinematics. Keep `assets/` beside `index.html`.
- Live wallet/economy uses B's disposable local Anvil/API fixture; no public chain or funded real wallet is required. Chain state resets when the fixture restarts.
- Static gameplay, forge and wallet panel work offline; chain balances/actions and guest sign-in require the live fixture. Save/import codes preserve offline progress; the offline account itself resets on reload.
- Q9 S4 bark cadence remains paused and unaccepted. This task does not tune balance, gates, or presentation cadence.
- Full smoke matrix is still in progress; update the final evidence once all four variants pass.
