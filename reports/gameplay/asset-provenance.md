# Gameplay asset provenance
2026-11-04 · Original procedural art. Extends `reports/visual/asset-provenance.md`.

No external image was copied, traced, sampled, downloaded, or supplied to a model. No image model was used. Research R5/R6/R9 informs silhouettes, timing and palette. All integer coordinates and per-frame poses are committed in the generators/runtime rig; input palette is `tools/art/visual-palette.json` (Evening Atelier, 32 colours). Seed 0; no randomness in art generation.

## Reproduce
`pnpm art:generate` writes all assets; `pnpm art:check` checks byte identity, palette, frame clipping and manifests. Mochi is rendered from the runtime layered rig, including stable gear anchors. Runtime monsters use the generated TS pixel maps; PNG sheets support offline review. Item PNGs are used by ItemIcon at 32/48/64px.

## Source artwork changed
| File | Tool / exact parameters | Date |
|---|---|---|
| `apps/web/src/game/rig/parts.ts` | Hand-authored TypeScript; CELL 32, FRAME 56×48, upper-left warm rim; exact maps/pose offsets in file. Export: `node tools/art/gameplay-sheets.mjs`. No prompt. | 2026-11-04 |
| `apps/web/src/game/rig/poses.ts` | Hand-authored TypeScript; CELL 32, FRAME 56×48, upper-left warm rim; exact maps/pose offsets in file. Export: `node tools/art/gameplay-sheets.mjs`. No prompt. | 2026-11-04 |
| `apps/web/src/game/rig/compose.ts` | Hand-authored TypeScript; CELL 32, FRAME 56×48, upper-left warm rim; exact maps/pose offsets in file. Export: `node tools/art/gameplay-sheets.mjs`. No prompt. | 2026-11-04 |
| `apps/web/src/game/rig/palettes.ts` | Hand-authored TypeScript; CELL 32, FRAME 56×48, upper-left warm rim; exact maps/pose offsets in file. Export: `node tools/art/gameplay-sheets.mjs`. No prompt. | 2026-11-04 |

## Generated assets
Every file below has its exact parameters, SHA-256 and byte count in the linked manifest. PNGs have binary alpha and the locked palette.

### `python3 -B tools/art/gameplay.py`
Exact per-file parameters/hashes: `tools/art/gameplay-manifest.json`. No prompt; coordinates/poses in the script are the complete recipe.

| File | Parameters | Bytes | Date |
|---|---|---:|---|
| `apps/web/public/art/gameplay/mon.dust.bunny-idle.png` | `{"chapter":1,"shape":"Dust Bunny","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 356 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.bunny-walk.png` | `{"chapter":1,"shape":"Dust Bunny","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 356 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.bunny-windup.png` | `{"chapter":1,"shape":"Dust Bunny","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 314 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.bunny-attack.png` | `{"chapter":1,"shape":"Dust Bunny","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 354 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.bunny-hit.png` | `{"chapter":1,"shape":"Dust Bunny","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 287 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.bunny-defeat.png` | `{"chapter":1,"shape":"Dust Bunny","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 398 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.loose.yarn-idle.png` | `{"chapter":1,"shape":"Loose Yarn","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 346 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.loose.yarn-walk.png` | `{"chapter":1,"shape":"Loose Yarn","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 346 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.loose.yarn-windup.png` | `{"chapter":1,"shape":"Loose Yarn","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 293 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.loose.yarn-attack.png` | `{"chapter":1,"shape":"Loose Yarn","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 347 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.loose.yarn-hit.png` | `{"chapter":1,"shape":"Loose Yarn","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 284 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.loose.yarn-defeat.png` | `{"chapter":1,"shape":"Loose Yarn","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 370 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sock.puppet-idle.png` | `{"chapter":1,"shape":"Sock Puppet","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 299 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sock.puppet-walk.png` | `{"chapter":1,"shape":"Sock Puppet","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 299 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sock.puppet-windup.png` | `{"chapter":1,"shape":"Sock Puppet","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 275 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sock.puppet-attack.png` | `{"chapter":1,"shape":"Sock Puppet","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 275 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sock.puppet-hit.png` | `{"chapter":1,"shape":"Sock Puppet","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 234 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sock.puppet-defeat.png` | `{"chapter":1,"shape":"Sock Puppet","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 341 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.roomba.scout-idle.png` | `{"chapter":1,"shape":"Roomba Scout","animation":"idle","frames":4,"frameSize":28,"scale":1,"seed":0}` | 349 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.roomba.scout-walk.png` | `{"chapter":1,"shape":"Roomba Scout","animation":"walk","frames":4,"frameSize":28,"scale":1,"seed":0}` | 349 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.roomba.scout-windup.png` | `{"chapter":1,"shape":"Roomba Scout","animation":"windup","frames":3,"frameSize":28,"scale":1,"seed":0}` | 295 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.roomba.scout-attack.png` | `{"chapter":1,"shape":"Roomba Scout","animation":"attack","frames":4,"frameSize":28,"scale":1,"seed":0}` | 333 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.roomba.scout-hit.png` | `{"chapter":1,"shape":"Roomba Scout","animation":"hit","frames":2,"frameSize":28,"scale":1,"seed":0}` | 268 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.roomba.scout-defeat.png` | `{"chapter":1,"shape":"Roomba Scout","animation":"defeat","frames":4,"frameSize":28,"scale":1,"seed":0}` | 395 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.yarn.giant-idle.png` | `{"chapter":1,"shape":"Yarn Giant","animation":"idle","frames":4,"frameSize":40,"scale":1,"seed":0}` | 528 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.yarn.giant-walk.png` | `{"chapter":1,"shape":"Yarn Giant","animation":"walk","frames":4,"frameSize":40,"scale":1,"seed":0}` | 528 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.yarn.giant-windup.png` | `{"chapter":1,"shape":"Yarn Giant","animation":"windup","frames":3,"frameSize":40,"scale":1,"seed":0}` | 453 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.yarn.giant-attack.png` | `{"chapter":1,"shape":"Yarn Giant","animation":"attack","frames":4,"frameSize":40,"scale":1,"seed":0}` | 546 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.yarn.giant-hit.png` | `{"chapter":1,"shape":"Yarn Giant","animation":"hit","frames":2,"frameSize":40,"scale":1,"seed":0}` | 489 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.yarn.giant-defeat.png` | `{"chapter":1,"shape":"Yarn Giant","animation":"defeat","frames":6,"frameSize":40,"scale":1,"seed":0}` | 707 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-1-calm.png` | `{"chapter":1,"shape":"Yarn Giant","expression":"calm","size":48,"seed":0}` | 353 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-1-alert.png` | `{"chapter":1,"shape":"Yarn Giant","expression":"alert","size":48,"seed":0}` | 347 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.pickle.imp-idle.png` | `{"chapter":2,"shape":"Pickle Imp","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 404 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.pickle.imp-walk.png` | `{"chapter":2,"shape":"Pickle Imp","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 404 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.pickle.imp-windup.png` | `{"chapter":2,"shape":"Pickle Imp","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 315 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.pickle.imp-attack.png` | `{"chapter":2,"shape":"Pickle Imp","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 364 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.pickle.imp-hit.png` | `{"chapter":2,"shape":"Pickle Imp","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 303 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.pickle.imp-defeat.png` | `{"chapter":2,"shape":"Pickle Imp","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 390 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.toast.mimic-idle.png` | `{"chapter":2,"shape":"Toast Mimic","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 326 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.toast.mimic-walk.png` | `{"chapter":2,"shape":"Toast Mimic","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 326 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.toast.mimic-windup.png` | `{"chapter":2,"shape":"Toast Mimic","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 296 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.toast.mimic-attack.png` | `{"chapter":2,"shape":"Toast Mimic","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 290 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.toast.mimic-hit.png` | `{"chapter":2,"shape":"Toast Mimic","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 240 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.toast.mimic-defeat.png` | `{"chapter":2,"shape":"Toast Mimic","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 367 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.spoon.bug-idle.png` | `{"chapter":2,"shape":"Spoon Bug","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 370 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.spoon.bug-walk.png` | `{"chapter":2,"shape":"Spoon Bug","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 370 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.spoon.bug-windup.png` | `{"chapter":2,"shape":"Spoon Bug","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 310 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.spoon.bug-attack.png` | `{"chapter":2,"shape":"Spoon Bug","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 337 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.spoon.bug-hit.png` | `{"chapter":2,"shape":"Spoon Bug","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 261 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.spoon.bug-defeat.png` | `{"chapter":2,"shape":"Spoon Bug","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 395 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.blender.brute-idle.png` | `{"chapter":2,"shape":"Blender Brute","animation":"idle","frames":4,"frameSize":28,"scale":1,"seed":0}` | 340 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.blender.brute-walk.png` | `{"chapter":2,"shape":"Blender Brute","animation":"walk","frames":4,"frameSize":28,"scale":1,"seed":0}` | 340 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.blender.brute-windup.png` | `{"chapter":2,"shape":"Blender Brute","animation":"windup","frames":3,"frameSize":28,"scale":1,"seed":0}` | 318 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.blender.brute-attack.png` | `{"chapter":2,"shape":"Blender Brute","animation":"attack","frames":4,"frameSize":28,"scale":1,"seed":0}` | 318 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.blender.brute-hit.png` | `{"chapter":2,"shape":"Blender Brute","animation":"hit","frames":2,"frameSize":28,"scale":1,"seed":0}` | 269 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.blender.brute-defeat.png` | `{"chapter":2,"shape":"Blender Brute","animation":"defeat","frames":4,"frameSize":28,"scale":1,"seed":0}` | 396 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.cucumber.scare-idle.png` | `{"chapter":2,"shape":"Cucumber Scare","animation":"idle","frames":4,"frameSize":40,"scale":1,"seed":0}` | 526 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.cucumber.scare-walk.png` | `{"chapter":2,"shape":"Cucumber Scare","animation":"walk","frames":4,"frameSize":40,"scale":1,"seed":0}` | 526 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.cucumber.scare-windup.png` | `{"chapter":2,"shape":"Cucumber Scare","animation":"windup","frames":3,"frameSize":40,"scale":1,"seed":0}` | 467 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.cucumber.scare-attack.png` | `{"chapter":2,"shape":"Cucumber Scare","animation":"attack","frames":4,"frameSize":40,"scale":1,"seed":0}` | 485 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.cucumber.scare-hit.png` | `{"chapter":2,"shape":"Cucumber Scare","animation":"hit","frames":2,"frameSize":40,"scale":1,"seed":0}` | 414 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.cucumber.scare-defeat.png` | `{"chapter":2,"shape":"Cucumber Scare","animation":"defeat","frames":6,"frameSize":40,"scale":1,"seed":0}` | 663 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-2-calm.png` | `{"chapter":2,"shape":"Cucumber Scare","expression":"calm","size":48,"seed":0}` | 326 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-2-alert.png` | `{"chapter":2,"shape":"Cucumber Scare","expression":"alert","size":48,"seed":0}` | 323 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.soap.slime-idle.png` | `{"chapter":3,"shape":"Soap Slime","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 359 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.soap.slime-walk.png` | `{"chapter":3,"shape":"Soap Slime","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 359 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.soap.slime-windup.png` | `{"chapter":3,"shape":"Soap Slime","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 304 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.soap.slime-attack.png` | `{"chapter":3,"shape":"Soap Slime","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 341 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.soap.slime-hit.png` | `{"chapter":3,"shape":"Soap Slime","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 283 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.soap.slime-defeat.png` | `{"chapter":3,"shape":"Soap Slime","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 378 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.rubber.duck-idle.png` | `{"chapter":3,"shape":"Rubber Duck","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 343 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.rubber.duck-walk.png` | `{"chapter":3,"shape":"Rubber Duck","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 343 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.rubber.duck-windup.png` | `{"chapter":3,"shape":"Rubber Duck","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 307 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.rubber.duck-attack.png` | `{"chapter":3,"shape":"Rubber Duck","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 328 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.rubber.duck-hit.png` | `{"chapter":3,"shape":"Rubber Duck","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 277 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.rubber.duck-defeat.png` | `{"chapter":3,"shape":"Rubber Duck","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 406 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sponge.crab-idle.png` | `{"chapter":3,"shape":"Sponge Crab","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 351 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sponge.crab-walk.png` | `{"chapter":3,"shape":"Sponge Crab","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 351 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sponge.crab-windup.png` | `{"chapter":3,"shape":"Sponge Crab","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 305 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sponge.crab-attack.png` | `{"chapter":3,"shape":"Sponge Crab","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 370 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sponge.crab-hit.png` | `{"chapter":3,"shape":"Sponge Crab","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 261 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.sponge.crab-defeat.png` | `{"chapter":3,"shape":"Sponge Crab","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 394 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.hair.dryer.wisp-idle.png` | `{"chapter":3,"shape":"Hair Dryer Wisp","animation":"idle","frames":4,"frameSize":28,"scale":1,"seed":0}` | 397 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.hair.dryer.wisp-walk.png` | `{"chapter":3,"shape":"Hair Dryer Wisp","animation":"walk","frames":4,"frameSize":28,"scale":1,"seed":0}` | 397 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.hair.dryer.wisp-windup.png` | `{"chapter":3,"shape":"Hair Dryer Wisp","animation":"windup","frames":3,"frameSize":28,"scale":1,"seed":0}` | 346 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.hair.dryer.wisp-attack.png` | `{"chapter":3,"shape":"Hair Dryer Wisp","animation":"attack","frames":4,"frameSize":28,"scale":1,"seed":0}` | 366 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.hair.dryer.wisp-hit.png` | `{"chapter":3,"shape":"Hair Dryer Wisp","animation":"hit","frames":2,"frameSize":28,"scale":1,"seed":0}` | 316 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.hair.dryer.wisp-defeat.png` | `{"chapter":3,"shape":"Hair Dryer Wisp","animation":"defeat","frames":4,"frameSize":28,"scale":1,"seed":0}` | 447 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.bathtub.tyrant-idle.png` | `{"chapter":3,"shape":"Bathtub Tyrant","animation":"idle","frames":4,"frameSize":40,"scale":1,"seed":0}` | 549 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.bathtub.tyrant-walk.png` | `{"chapter":3,"shape":"Bathtub Tyrant","animation":"walk","frames":4,"frameSize":40,"scale":1,"seed":0}` | 549 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.bathtub.tyrant-windup.png` | `{"chapter":3,"shape":"Bathtub Tyrant","animation":"windup","frames":3,"frameSize":40,"scale":1,"seed":0}` | 491 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.bathtub.tyrant-attack.png` | `{"chapter":3,"shape":"Bathtub Tyrant","animation":"attack","frames":4,"frameSize":40,"scale":1,"seed":0}` | 535 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.bathtub.tyrant-hit.png` | `{"chapter":3,"shape":"Bathtub Tyrant","animation":"hit","frames":2,"frameSize":40,"scale":1,"seed":0}` | 468 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.bathtub.tyrant-defeat.png` | `{"chapter":3,"shape":"Bathtub Tyrant","animation":"defeat","frames":6,"frameSize":40,"scale":1,"seed":0}` | 674 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-3-calm.png` | `{"chapter":3,"shape":"Bathtub Tyrant","expression":"calm","size":48,"seed":0}` | 363 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-3-alert.png` | `{"chapter":3,"shape":"Bathtub Tyrant","expression":"alert","size":48,"seed":0}` | 363 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.mouse.trap-idle.png` | `{"chapter":4,"shape":"Mouse Trap","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 308 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.mouse.trap-walk.png` | `{"chapter":4,"shape":"Mouse Trap","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 308 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.mouse.trap-windup.png` | `{"chapter":4,"shape":"Mouse Trap","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 271 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.mouse.trap-attack.png` | `{"chapter":4,"shape":"Mouse Trap","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 286 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.mouse.trap-hit.png` | `{"chapter":4,"shape":"Mouse Trap","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 264 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.mouse.trap-defeat.png` | `{"chapter":4,"shape":"Mouse Trap","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 341 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.moth-idle.png` | `{"chapter":4,"shape":"Dust Moth","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 345 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.moth-walk.png` | `{"chapter":4,"shape":"Dust Moth","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 345 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.moth-windup.png` | `{"chapter":4,"shape":"Dust Moth","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 308 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.moth-attack.png` | `{"chapter":4,"shape":"Dust Moth","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 379 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.moth-hit.png` | `{"chapter":4,"shape":"Dust Moth","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 299 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.dust.moth-defeat.png` | `{"chapter":4,"shape":"Dust Moth","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 413 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.windup.robot-idle.png` | `{"chapter":4,"shape":"Wind-up Robot","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 331 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.windup.robot-walk.png` | `{"chapter":4,"shape":"Wind-up Robot","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 331 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.windup.robot-windup.png` | `{"chapter":4,"shape":"Wind-up Robot","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 299 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.windup.robot-attack.png` | `{"chapter":4,"shape":"Wind-up Robot","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 308 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.windup.robot-hit.png` | `{"chapter":4,"shape":"Wind-up Robot","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 241 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.windup.robot-defeat.png` | `{"chapter":4,"shape":"Wind-up Robot","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 347 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.box.fort.knight-idle.png` | `{"chapter":4,"shape":"Box Fort Knight","animation":"idle","frames":4,"frameSize":28,"scale":1,"seed":0}` | 372 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.box.fort.knight-walk.png` | `{"chapter":4,"shape":"Box Fort Knight","animation":"walk","frames":4,"frameSize":28,"scale":1,"seed":0}` | 372 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.box.fort.knight-windup.png` | `{"chapter":4,"shape":"Box Fort Knight","animation":"windup","frames":3,"frameSize":28,"scale":1,"seed":0}` | 347 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.box.fort.knight-attack.png` | `{"chapter":4,"shape":"Box Fort Knight","animation":"attack","frames":4,"frameSize":28,"scale":1,"seed":0}` | 343 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.box.fort.knight-hit.png` | `{"chapter":4,"shape":"Box Fort Knight","animation":"hit","frames":2,"frameSize":28,"scale":1,"seed":0}` | 309 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.box.fort.knight-defeat.png` | `{"chapter":4,"shape":"Box Fort Knight","animation":"defeat","frames":4,"frameSize":28,"scale":1,"seed":0}` | 430 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.vacuum.beast-idle.png` | `{"chapter":4,"shape":"Vacuum Beast","animation":"idle","frames":4,"frameSize":40,"scale":1,"seed":0}` | 540 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.vacuum.beast-walk.png` | `{"chapter":4,"shape":"Vacuum Beast","animation":"walk","frames":4,"frameSize":40,"scale":1,"seed":0}` | 540 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.vacuum.beast-windup.png` | `{"chapter":4,"shape":"Vacuum Beast","animation":"windup","frames":3,"frameSize":40,"scale":1,"seed":0}` | 482 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.vacuum.beast-attack.png` | `{"chapter":4,"shape":"Vacuum Beast","animation":"attack","frames":4,"frameSize":40,"scale":1,"seed":0}` | 524 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.vacuum.beast-hit.png` | `{"chapter":4,"shape":"Vacuum Beast","animation":"hit","frames":2,"frameSize":40,"scale":1,"seed":0}` | 441 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.vacuum.beast-defeat.png` | `{"chapter":4,"shape":"Vacuum Beast","animation":"defeat","frames":6,"frameSize":40,"scale":1,"seed":0}` | 702 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-4-calm.png` | `{"chapter":4,"shape":"Vacuum Beast","expression":"calm","size":48,"seed":0}` | 353 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-4-alert.png` | `{"chapter":4,"shape":"Vacuum Beast","expression":"alert","size":48,"seed":0}` | 349 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.shadow.crow-idle.png` | `{"chapter":5,"shape":"Shadow Crow","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 348 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.shadow.crow-walk.png` | `{"chapter":5,"shape":"Shadow Crow","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 348 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.shadow.crow-windup.png` | `{"chapter":5,"shape":"Shadow Crow","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 313 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.shadow.crow-attack.png` | `{"chapter":5,"shape":"Shadow Crow","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 322 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.shadow.crow-hit.png` | `{"chapter":5,"shape":"Shadow Crow","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 283 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.shadow.crow-defeat.png` | `{"chapter":5,"shape":"Shadow Crow","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 409 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.moth.swarm-idle.png` | `{"chapter":5,"shape":"Moth Swarm","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 349 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.moth.swarm-walk.png` | `{"chapter":5,"shape":"Moth Swarm","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 349 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.moth.swarm-windup.png` | `{"chapter":5,"shape":"Moth Swarm","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 313 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.moth.swarm-attack.png` | `{"chapter":5,"shape":"Moth Swarm","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 383 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.moth.swarm-hit.png` | `{"chapter":5,"shape":"Moth Swarm","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 308 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.moth.swarm-defeat.png` | `{"chapter":5,"shape":"Moth Swarm","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 420 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.neon.dot-idle.png` | `{"chapter":5,"shape":"Neon Dot","animation":"idle","frames":4,"frameSize":24,"scale":1,"seed":0}` | 321 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.neon.dot-walk.png` | `{"chapter":5,"shape":"Neon Dot","animation":"walk","frames":4,"frameSize":24,"scale":1,"seed":0}` | 321 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.neon.dot-windup.png` | `{"chapter":5,"shape":"Neon Dot","animation":"windup","frames":3,"frameSize":24,"scale":1,"seed":0}` | 264 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.neon.dot-attack.png` | `{"chapter":5,"shape":"Neon Dot","animation":"attack","frames":4,"frameSize":24,"scale":1,"seed":0}` | 307 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.neon.dot-hit.png` | `{"chapter":5,"shape":"Neon Dot","animation":"hit","frames":2,"frameSize":24,"scale":1,"seed":0}` | 257 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.neon.dot-defeat.png` | `{"chapter":5,"shape":"Neon Dot","animation":"defeat","frames":4,"frameSize":24,"scale":1,"seed":0}` | 378 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.chimney.ghost-idle.png` | `{"chapter":5,"shape":"Chimney Ghost","animation":"idle","frames":4,"frameSize":28,"scale":1,"seed":0}` | 375 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.chimney.ghost-walk.png` | `{"chapter":5,"shape":"Chimney Ghost","animation":"walk","frames":4,"frameSize":28,"scale":1,"seed":0}` | 375 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.chimney.ghost-windup.png` | `{"chapter":5,"shape":"Chimney Ghost","animation":"windup","frames":3,"frameSize":28,"scale":1,"seed":0}` | 336 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.chimney.ghost-attack.png` | `{"chapter":5,"shape":"Chimney Ghost","animation":"attack","frames":4,"frameSize":28,"scale":1,"seed":0}` | 343 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.chimney.ghost-hit.png` | `{"chapter":5,"shape":"Chimney Ghost","animation":"hit","frames":2,"frameSize":28,"scale":1,"seed":0}` | 271 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.chimney.ghost-defeat.png` | `{"chapter":5,"shape":"Chimney Ghost","animation":"defeat","frames":4,"frameSize":28,"scale":1,"seed":0}` | 380 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.laser.dot.phantom-idle.png` | `{"chapter":5,"shape":"Laser Dot Phantom","animation":"idle","frames":4,"frameSize":40,"scale":1,"seed":0}` | 527 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.laser.dot.phantom-walk.png` | `{"chapter":5,"shape":"Laser Dot Phantom","animation":"walk","frames":4,"frameSize":40,"scale":1,"seed":0}` | 527 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.laser.dot.phantom-windup.png` | `{"chapter":5,"shape":"Laser Dot Phantom","animation":"windup","frames":3,"frameSize":40,"scale":1,"seed":0}` | 482 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.laser.dot.phantom-attack.png` | `{"chapter":5,"shape":"Laser Dot Phantom","animation":"attack","frames":4,"frameSize":40,"scale":1,"seed":0}` | 529 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.laser.dot.phantom-hit.png` | `{"chapter":5,"shape":"Laser Dot Phantom","animation":"hit","frames":2,"frameSize":40,"scale":1,"seed":0}` | 496 | 2026-11-04 |
| `apps/web/public/art/gameplay/mon.laser.dot.phantom-defeat.png` | `{"chapter":5,"shape":"Laser Dot Phantom","animation":"defeat","frames":6,"frameSize":40,"scale":1,"seed":0}` | 733 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-5-calm.png` | `{"chapter":5,"shape":"Laser Dot Phantom","expression":"calm","size":48,"seed":0}` | 355 | 2026-11-04 |
| `apps/web/public/art/gameplay/portrait-boss-5-alert.png` | `{"chapter":5,"shape":"Laser Dot Phantom","expression":"alert","size":48,"seed":0}` | 362 | 2026-11-04 |
| `apps/web/src/art/monsters/gameplay.generated.ts` | `{"roster":25,"palette":"visual-palette.json","seed":0}` | 509607 | 2026-11-04 |
| `reports/gameplay/character-contact.png` | `{"grid":"chapters by rows, roster by columns","scale":3}` | 6064 | 2026-11-04 |

### `python3 -B tools/art/gameplay-items.py`
Exact per-file parameters/hashes: `tools/art/gameplay-items.json`. No prompt; coordinates/poses in the script are the complete recipe.

| File | Parameters | Bytes | Date |
|---|---|---:|---|
| `apps/web/public/art/gameplay/item-sword.png` | `{"key":"sword","size":32,"scale":1,"light":"upper-left","seed":0}` | 189 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-hammer.png` | `{"key":"hammer","size":32,"scale":1,"light":"upper-left","seed":0}` | 208 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-daggers.png` | `{"key":"daggers","size":32,"scale":1,"light":"upper-left","seed":0}` | 215 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-spear.png` | `{"key":"spear","size":32,"scale":1,"light":"upper-left","seed":0}` | 190 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-bow.png` | `{"key":"bow","size":32,"scale":1,"light":"upper-left","seed":0}` | 263 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-staff.png` | `{"key":"staff","size":32,"scale":1,"light":"upper-left","seed":0}` | 218 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-flasks.png` | `{"key":"flasks","size":32,"scale":1,"light":"upper-left","seed":0}` | 278 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.cozy.helmet.png` | `{"key":"arm.cozy.helmet","size":32,"scale":1,"light":"upper-left","seed":0}` | 224 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.cozy.armor.png` | `{"key":"arm.cozy.armor","size":32,"scale":1,"light":"upper-left","seed":0}` | 244 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.cozy.gloves.png` | `{"key":"arm.cozy.gloves","size":32,"scale":1,"light":"upper-left","seed":0}` | 216 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.cozy.boots.png` | `{"key":"arm.cozy.boots","size":32,"scale":1,"light":"upper-left","seed":0}` | 221 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.ranger.helmet.png` | `{"key":"arm.ranger.helmet","size":32,"scale":1,"light":"upper-left","seed":0}` | 224 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.ranger.armor.png` | `{"key":"arm.ranger.armor","size":32,"scale":1,"light":"upper-left","seed":0}` | 244 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.ranger.gloves.png` | `{"key":"arm.ranger.gloves","size":32,"scale":1,"light":"upper-left","seed":0}` | 216 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.ranger.boots.png` | `{"key":"arm.ranger.boots","size":32,"scale":1,"light":"upper-left","seed":0}` | 221 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.moon.helmet.png` | `{"key":"arm.moon.helmet","size":32,"scale":1,"light":"upper-left","seed":0}` | 224 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.moon.armor.png` | `{"key":"arm.moon.armor","size":32,"scale":1,"light":"upper-left","seed":0}` | 244 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.moon.gloves.png` | `{"key":"arm.moon.gloves","size":32,"scale":1,"light":"upper-left","seed":0}` | 216 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-arm.moon.boots.png` | `{"key":"arm.moon.boots","size":32,"scale":1,"light":"upper-left","seed":0}` | 221 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.bell.png` | `{"key":"acc.bell","size":32,"scale":1,"light":"upper-left","seed":0}` | 269 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.ribbon.png` | `{"key":"acc.ribbon","size":32,"scale":1,"light":"upper-left","seed":0}` | 256 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.studded.png` | `{"key":"acc.studded","size":32,"scale":1,"light":"upper-left","seed":0}` | 259 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.pearl.png` | `{"key":"acc.pearl","size":32,"scale":1,"light":"upper-left","seed":0}` | 208 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.fishhook.png` | `{"key":"acc.fishhook","size":32,"scale":1,"light":"upper-left","seed":0}` | 211 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.feather.png` | `{"key":"acc.feather","size":32,"scale":1,"light":"upper-left","seed":0}` | 205 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.paw.png` | `{"key":"acc.paw","size":32,"scale":1,"light":"upper-left","seed":0}` | 232 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.hunter.png` | `{"key":"acc.hunter","size":32,"scale":1,"light":"upper-left","seed":0}` | 231 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.lucky.png` | `{"key":"acc.lucky","size":32,"scale":1,"light":"upper-left","seed":0}` | 231 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.catnip.png` | `{"key":"acc.catnip","size":32,"scale":1,"light":"upper-left","seed":0}` | 221 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.mouse.png` | `{"key":"acc.mouse","size":32,"scale":1,"light":"upper-left","seed":0}` | 250 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-acc.star.png` | `{"key":"acc.star","size":32,"scale":1,"light":"upper-left","seed":0}` | 226 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotHelmet.png` | `{"key":"slotHelmet","size":32,"scale":1,"light":"upper-left","seed":0}` | 224 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotArmor.png` | `{"key":"slotArmor","size":32,"scale":1,"light":"upper-left","seed":0}` | 244 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotGloves.png` | `{"key":"slotGloves","size":32,"scale":1,"light":"upper-left","seed":0}` | 216 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotBoots.png` | `{"key":"slotBoots","size":32,"scale":1,"light":"upper-left","seed":0}` | 221 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotCollar.png` | `{"key":"slotCollar","size":32,"scale":1,"light":"upper-left","seed":0}` | 268 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotEarring.png` | `{"key":"slotEarring","size":32,"scale":1,"light":"upper-left","seed":0}` | 211 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotRing.png` | `{"key":"slotRing","size":32,"scale":1,"light":"upper-left","seed":0}` | 231 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotCharm.png` | `{"key":"slotCharm","size":32,"scale":1,"light":"upper-left","seed":0}` | 226 | 2026-11-04 |
| `apps/web/public/art/gameplay/item-slotWeapon.png` | `{"key":"slotWeapon","size":32,"scale":1,"light":"upper-left","seed":0}` | 189 | 2026-11-04 |
| `reports/gameplay/item-contact.png` | `{"grid":"8 columns","scale":2}` | 6060 | 2026-11-04 |
| `apps/web/src/art/gameplayItemKeys.ts` | `{"keys":40}` | 668 | 2026-11-04 |

### `node tools/art/gameplay-sheets.mjs`
Exact per-file parameters/hashes: `tools/art/gameplay-sheets.json`. No prompt; coordinates/poses in the script are the complete recipe.

| File | Parameters | Bytes | Date |
|---|---|---:|---|
| `apps/web/public/art/gameplay/mochi-warrior-idle.png` | `{"class":"warrior","gear":{},"animation":"idle","frames":8,"frameMs":[700,180,120,180,600,100,120,200],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 815 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-warrior-nap.png` | `{"class":"warrior","gear":{},"animation":"nap","frames":2,"frameMs":[1400,1400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 441 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-warrior-equip.png` | `{"class":"warrior","gear":{},"animation":"equip","frames":4,"frameMs":[100,140,140,180],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 680 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-warrior-walk.png` | `{"class":"warrior","gear":{},"animation":"walk","frames":6,"frameMs":[100,100,100,100,100,100],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 841 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-warrior-hurt.png` | `{"class":"warrior","gear":{},"animation":"hurt","frames":2,"frameMs":[120,120],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 458 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-warrior-defeat.png` | `{"class":"warrior","gear":{},"animation":"defeat","frames":4,"frameMs":[120,140,160,400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 741 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-warrior-victory.png` | `{"class":"warrior","gear":{},"animation":"victory","frames":4,"frameMs":[120,140,200,240],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 702 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-warrior-attack.png` | `{"class":"warrior","gear":{},"animation":"attack","frames":6,"frameMs":[60,60,60,60,90,90],"hitFrames":[4],"frameWidth":56,"frameHeight":48,"scale":1}` | 980 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-guardian-idle.png` | `{"class":"guardian","gear":{},"animation":"idle","frames":8,"frameMs":[700,180,120,180,600,100,120,200],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 771 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-guardian-nap.png` | `{"class":"guardian","gear":{},"animation":"nap","frames":2,"frameMs":[1400,1400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 446 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-guardian-equip.png` | `{"class":"guardian","gear":{},"animation":"equip","frames":4,"frameMs":[100,140,140,180],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 690 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-guardian-walk.png` | `{"class":"guardian","gear":{},"animation":"walk","frames":6,"frameMs":[100,100,100,100,100,100],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 787 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-guardian-hurt.png` | `{"class":"guardian","gear":{},"animation":"hurt","frames":2,"frameMs":[120,120],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 468 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-guardian-defeat.png` | `{"class":"guardian","gear":{},"animation":"defeat","frames":4,"frameMs":[120,140,160,400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 757 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-guardian-victory.png` | `{"class":"guardian","gear":{},"animation":"victory","frames":4,"frameMs":[120,140,200,240],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 734 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-guardian-attack.png` | `{"class":"guardian","gear":{},"animation":"attack","frames":6,"frameMs":[100,160,160,100,120,140],"hitFrames":[4],"frameWidth":56,"frameHeight":48,"scale":1}` | 1047 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-rogue-idle.png` | `{"class":"rogue","gear":{},"animation":"idle","frames":8,"frameMs":[700,180,120,180,600,100,120,200],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 695 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-rogue-nap.png` | `{"class":"rogue","gear":{},"animation":"nap","frames":2,"frameMs":[1400,1400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 423 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-rogue-equip.png` | `{"class":"rogue","gear":{},"animation":"equip","frames":4,"frameMs":[100,140,140,180],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 617 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-rogue-walk.png` | `{"class":"rogue","gear":{},"animation":"walk","frames":6,"frameMs":[100,100,100,100,100,100],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 784 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-rogue-hurt.png` | `{"class":"rogue","gear":{},"animation":"hurt","frames":2,"frameMs":[120,120],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 449 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-rogue-defeat.png` | `{"class":"rogue","gear":{},"animation":"defeat","frames":4,"frameMs":[120,140,160,400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 682 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-rogue-victory.png` | `{"class":"rogue","gear":{},"animation":"victory","frames":4,"frameMs":[120,140,200,240],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 676 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-rogue-attack.png` | `{"class":"rogue","gear":{},"animation":"attack","frames":8,"frameMs":[50,40,50,80,80,80,80,80],"hitFrames":[3,5],"frameWidth":56,"frameHeight":48,"scale":1}` | 910 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-hunter-idle.png` | `{"class":"hunter","gear":{},"animation":"idle","frames":8,"frameMs":[700,180,120,180,600,100,120,200],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 811 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-hunter-nap.png` | `{"class":"hunter","gear":{},"animation":"nap","frames":2,"frameMs":[1400,1400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 460 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-hunter-equip.png` | `{"class":"hunter","gear":{},"animation":"equip","frames":4,"frameMs":[100,140,140,180],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 678 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-hunter-walk.png` | `{"class":"hunter","gear":{},"animation":"walk","frames":6,"frameMs":[100,100,100,100,100,100],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 876 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-hunter-hurt.png` | `{"class":"hunter","gear":{},"animation":"hurt","frames":2,"frameMs":[120,120],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 468 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-hunter-defeat.png` | `{"class":"hunter","gear":{},"animation":"defeat","frames":4,"frameMs":[120,140,160,400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 754 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-hunter-victory.png` | `{"class":"hunter","gear":{},"animation":"victory","frames":4,"frameMs":[120,140,200,240],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 732 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-hunter-attack.png` | `{"class":"hunter","gear":{},"animation":"attack","frames":6,"frameMs":[70,70,80,80,100,100],"hitFrames":[4],"frameWidth":56,"frameHeight":48,"scale":1}` | 885 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-archer-idle.png` | `{"class":"archer","gear":{},"animation":"idle","frames":8,"frameMs":[700,180,120,180,600,100,120,200],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 745 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-archer-nap.png` | `{"class":"archer","gear":{},"animation":"nap","frames":2,"frameMs":[1400,1400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 421 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-archer-equip.png` | `{"class":"archer","gear":{},"animation":"equip","frames":4,"frameMs":[100,140,140,180],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 641 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-archer-walk.png` | `{"class":"archer","gear":{},"animation":"walk","frames":6,"frameMs":[100,100,100,100,100,100],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 794 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-archer-hurt.png` | `{"class":"archer","gear":{},"animation":"hurt","frames":2,"frameMs":[120,120],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 444 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-archer-defeat.png` | `{"class":"archer","gear":{},"animation":"defeat","frames":4,"frameMs":[120,140,160,400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 715 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-archer-victory.png` | `{"class":"archer","gear":{},"animation":"victory","frames":4,"frameMs":[120,140,200,240],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 702 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-archer-attack.png` | `{"class":"archer","gear":{},"animation":"attack","frames":6,"frameMs":[80,110,110,80,80,100],"hitFrames":[3],"frameWidth":56,"frameHeight":48,"scale":1}` | 854 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-witch-idle.png` | `{"class":"witch","gear":{},"animation":"idle","frames":8,"frameMs":[700,180,120,180,600,100,120,200],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 766 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-witch-nap.png` | `{"class":"witch","gear":{},"animation":"nap","frames":2,"frameMs":[1400,1400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 452 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-witch-equip.png` | `{"class":"witch","gear":{},"animation":"equip","frames":4,"frameMs":[100,140,140,180],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 657 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-witch-walk.png` | `{"class":"witch","gear":{},"animation":"walk","frames":6,"frameMs":[100,100,100,100,100,100],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 819 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-witch-hurt.png` | `{"class":"witch","gear":{},"animation":"hurt","frames":2,"frameMs":[120,120],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 470 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-witch-defeat.png` | `{"class":"witch","gear":{},"animation":"defeat","frames":4,"frameMs":[120,140,160,400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 734 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-witch-victory.png` | `{"class":"witch","gear":{},"animation":"victory","frames":4,"frameMs":[120,140,200,240],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 735 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-witch-attack.png` | `{"class":"witch","gear":{},"animation":"attack","frames":6,"frameMs":[100,150,150,100,100,120],"hitFrames":[4],"frameWidth":56,"frameHeight":48,"scale":1}` | 909 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-alchemist-idle.png` | `{"class":"alchemist","gear":{},"animation":"idle","frames":8,"frameMs":[700,180,120,180,600,100,120,200],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 750 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-alchemist-nap.png` | `{"class":"alchemist","gear":{},"animation":"nap","frames":2,"frameMs":[1400,1400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 447 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-alchemist-equip.png` | `{"class":"alchemist","gear":{},"animation":"equip","frames":4,"frameMs":[100,140,140,180],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 652 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-alchemist-walk.png` | `{"class":"alchemist","gear":{},"animation":"walk","frames":6,"frameMs":[100,100,100,100,100,100],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 816 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-alchemist-hurt.png` | `{"class":"alchemist","gear":{},"animation":"hurt","frames":2,"frameMs":[120,120],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 463 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-alchemist-defeat.png` | `{"class":"alchemist","gear":{},"animation":"defeat","frames":4,"frameMs":[120,140,160,400],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 753 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-alchemist-victory.png` | `{"class":"alchemist","gear":{},"animation":"victory","frames":4,"frameMs":[120,140,200,240],"hitFrames":[],"frameWidth":56,"frameHeight":48,"scale":1}` | 708 | 2026-11-04 |
| `apps/web/public/art/gameplay/mochi-alchemist-attack.png` | `{"class":"alchemist","gear":{},"animation":"attack","frames":6,"frameMs":[80,90,90,80,80,100],"hitFrames":[3],"frameWidth":56,"frameHeight":48,"scale":1}` | 911 | 2026-11-04 |

