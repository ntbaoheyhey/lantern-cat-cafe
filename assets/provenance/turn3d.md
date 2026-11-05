# Original turn-based miniatures · 2026-11-05

No imported models, textures or reference-game inputs. CC0 original assets; runtime libraries are MIT. Build-only TypeScript is Apache-2.0. Source and animation are reproducible with `pnpm art:turn3d`. Exact authorship and parameters: `docs/turn3d/ASSET-MANIFEST.json`.

| Model | Triangles / budget | GLB bytes | Gzip bytes | Draw calls |
|---|---:|---:|---:|---:|
| Mochi | 14020 / 25000 | 809448 | 345819 | 17 |
| Soot | 14666 / 25000 | 866884 | 374939 | 18 |
| Clover | 12998 / 25000 | 805704 | 325178 | 17 |
| Button Guard | 4564 / 10000 | 431432 | 187638 | 10 |
| Sock Skipper | 3724 / 10000 | 378768 | 150919 | 10 |
| Spool Ram | 4414 / 10000 | 357196 | 133305 | 10 |
| Needle Moth | 5164 / 10000 | 433984 | 160029 | 12 |
| Teacup Healer | 4708 / 10000 | 387180 | 136724 | 10 |
| Kettle Knight | 6032 / 20000 | 517792 | 224698 | 10 |
| Yarn Giant | 20050 / 60000 | 828464 | 397205 | 14 |
| Binding Thread | 3468 / 10000 | 320980 | 130381 | 10 |
| Practice Cushion | 4322 / 10000 | 412244 | 153216 | 10 |

Every GLB has authored named clips: idle, ready, walk-in, attack, skill1, skill2, skill3, ultimate, cast, hit, heavy-hit, guard, heal-receive, KO, victory, telegraph, spawn, taunt, step, special, stagger, down. Facial blink, brow angle and mouth poses distinguish calm, happy, hurt, determined, casting and KO. Textures are embedded 128px albedo/normal PNGs, generated from integer noise and woven/knitted equations. Approximate analytic vertex AO is baked from neighboring geometry bounds; this is not raytraced AO. Stage and VFX are procedural originals in scene.ts. Existing pixel assets are comparison-only and retain their original provenance in assets/provenance/squad.md.
