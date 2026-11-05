# Original turn-based miniatures · 2026-11-05

No imported models, textures or reference-game inputs. CC0 original assets; runtime libraries are MIT. Build-only TypeScript is Apache-2.0. Source and animation are reproducible with `pnpm art:turn3d`. Exact authorship and parameters: `docs/turn3d/ASSET-MANIFEST.json`.

| Model | Triangles / budget | GLB bytes | Gzip bytes | Draw calls |
|---|---:|---:|---:|---:|
| Mochi | 3956 / 6000 | 190608 | 46679 | 12 |
| Soot | 4186 / 6000 | 213120 | 53709 | 13 |
| Clover | 3874 / 6000 | 218232 | 53679 | 12 |
| Button Guard | 2112 / 3000 | 119188 | 26137 | 10 |
| Sock Skipper | 1800 / 3000 | 111516 | 25531 | 10 |
| Spool Ram | 2910 / 3000 | 118792 | 26834 | 10 |
| Needle Moth | 2560 / 3000 | 142724 | 30445 | 12 |
| Teacup Healer | 2252 / 3000 | 122168 | 29002 | 10 |
| Kettle Knight | 2840 / 8000 | 150408 | 35731 | 10 |
| Yarn Giant | 16360 / 20000 | 457220 | 153733 | 14 |
| Binding Thread | 2216 / 3000 | 95220 | 29081 | 10 |
| Practice Cushion | 2248 / 3000 | 133832 | 29189 | 10 |

Every GLB has ten named clips: idle, step, attack, cast, special, hit, stagger, down, victory, telegraph. Facial blink/hurt/determined expression uses eye geometry scale. Stage and VFX are procedural originals in scene.ts. Existing pixel assets are comparison-only and retain their original provenance in assets/provenance/squad.md.
