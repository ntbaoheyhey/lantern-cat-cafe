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
| Binding Thread | 6416 / 10000 | 404304 | 189140 | 10 |
| Practice Cushion | 5628 / 10000 | 467776 | 177137 | 10 |

Every GLB has authored named clips: idle, ready, walk-in, attack, skill1, skill2, skill3, ultimate, cast, hit, heavy-hit, guard, heal-receive, KO, victory, telegraph, spawn, taunt, step, special, stagger, down. Facial blink, brow angle and mouth poses distinguish calm, happy, hurt, determined, casting and KO. Textures are embedded 128px albedo/normal PNGs, generated from integer noise and woven/knitted equations. Approximate analytic vertex AO is baked from neighboring geometry bounds; this is not raytraced AO. Stage and VFX are procedural originals in scene.ts. Existing pixel assets are comparison-only and retain their original provenance in assets/provenance/squad.md.

## Polish runtime assets

- **cafe-stage**: apps/web/src/game/squad/turn3d/scene.ts, apps/web/src/game/squad/turn3d/surfaces.ts. Wood/cloth/ceramic procedural canvas maps, deterministic integer noise; warm key/cool rim; contact gradients and fog. Author: Codex primary polish session; 2026-11-05; CC0-1.0. Exact source hashes in ASSET-MANIFEST.json.
- **spell-language**: apps/web/src/game/squad/turn3d/vfx.ts, apps/web/src/game/squad/turn3d/effect-direction.ts, apps/web/src/game/squad/turn3d/effects.ts. 43 authored signatures, tapered noisy ribbon meshes, at most 192 instanced motes, eight branching bolts, nine flame/water planes. Fixed integer recipe seeds; five beats; .73 nonultimate motion duration scale, impact and 1.45s portraits retained. Author: Codex primary polish session; 2026-11-05; CC0-1.0. Exact source hashes in ASSET-MANIFEST.json.
- **equipment-sockets**: apps/web/src/game/squad/turn3d/gear-visuals.ts, packages/game-rules/src/squad/gear/catalog.ts. 30 original items; four weapon profiles and four outfit patterns per role, shared charm/relic silhouettes; one merged draw per item; rarity emissive colors; set aura. Author: Codex primary polish session; 2026-11-05; CC0-1.0. Exact source hashes in ASSET-MANIFEST.json.
- **post-processing**: apps/web/src/game/squad/turn3d/post.ts. Half-float bright-pass threshold 1.12, separable quarter-resolution High bloom, grade, edge contrast, vignette and radial impact ripple. Medium at sixth-resolution; Low bypasses post; p95>25ms degrades after warmup. Author: Codex primary polish session; 2026-11-05; CC0-1.0. Exact source hashes in ASSET-MANIFEST.json.
- **cafe-synth-audio**: apps/web/src/game/squad/turn3d/audio.ts. WebAudio oscillators + seeded filtered noise; six cue families × five beats, UI/turn/round/stingers; 8-note sine ambience; 44.1kHz/master .14. Muted by default; context only after click; no downloaded samples. Author: Codex primary polish session; 2026-11-05; CC0-1.0. Exact source hashes in ASSET-MANIFEST.json.

Portraits are original GLB renders captured by tools/turn3d/polish-portraits.mjs, 320×440, ready clip, angle .15, fixed render 1. Manifest contains image hashes. Contact sheets use Pillow (HPND), evidence only. No downloaded or model-generated art.
