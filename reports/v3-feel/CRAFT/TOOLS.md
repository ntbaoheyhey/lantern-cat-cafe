# Tools assessed

Q3 correction: retain Three.js/native cut-out rendering, author main shapes with shader meshes and original flipbooks. The earlier Canvas main-shape recommendation failed the pilot and is withdrawn. See TOOLKIT.md. Use Playwright + ffmpeg + sharp/Pillow for evidence. No account, paid licence, model download or MCP install is needed for this method. Sources and repository licence observations are in `sources.json` and `tool-sources.json`.

Sizes and setup times below are planning ranges, not downloads measured on this Mac. `tool-sources.json.repoSizeKiB` measures repository metadata, **not installed size**. Apple Silicon host confirmed with `uname -m` = arm64; only existing tools are locally execution-tested. Do not claim an untested package works just because it advertises macOS support.

| Tool | Solves / output | Licence | Estimated incremental install | Apple Silicon | Setup estimate | Risk / decision |
|---|---|---|---|---|---|---|
| Existing CutoutMesh + Three.js | Rig poses, sockets, blended parts; native JSON | Repository code + Three.js MIT | 0, installed | Yes, current browser renderer | 0–15 min | Best fit; fix joint/pose quality before adding software. |
| Three.js ShaderMaterial + original PNGs | Erosion, panned ribbons, colour ramps and stretched sparks | Own code/assets + MIT | 0, installed | Browser tested in current scene; drills pending | Measured during Q3.A | Default Rung 2; no production before D1–D6 pass. |
| DragonBonesJS | Skeletal playback / exported JSON | Runtime MIT; editor separate | 30–200 MB planning range | JS runtime yes; editor/arm64 unverified | 1–3 h | New format/authoring migration; reject for this deadline. |
| Blender / Grease Pencil | Key poses, mesh/curve VFX, transparent frame render | GPL; output art remains ours | 0.5–1.5 GB planning range | Official arm64 build; not installed in PATH here | 30–90 min | Optional when geometry needs it; current 2D assets need no remodel. |
| Effekseer | Layered particle authoring and 2D exports | MIT | 0.2–0.8 GB planning range | macOS offered; chosen binary architecture unverified | 45–120 min | Good alternative for complex particles; new runtime unnecessary if exporting sheets. |
| free-tex-packer | Atlas packing / PNG + JSON | MIT | 0.1–0.4 GB planning range | JS tool yes; GUI binary unverified | 15–45 min | Optional; existing sharp packer already fits. |
| sharp + Pillow + NumPy | Alpha bounds, masks, atlas packing, sheets | Apache-2.0 / HPND / BSD-3-Clause | 0, installed | Yes, scripts executed | 0 | Chosen; retain linear-vs-sRGB distinction and threshold sensitivity. |
| Pixi particle-emitter | Pooled sprites / particles | MIT | 5–25 MB planning range | Browser JS yes | 1–2 h integration | Different renderer; do not introduce Pixi for a Canvas/Three scene. |
| Rive | Vector rig/state-machine editor and runtime | Runtime MIT; editor/export plans separate | Browser or 0.1–0.3 GB runtime/tooling range | Browser yes | 1–3 h | Free export entitlement/account not established; not a production dependency. |
| Lottie-web | JSON vector animation playback | MIT runtime; authoring tool separate | 1–10 MB runtime range | Browser yes | 1–2 h | UI motions fit; painted combat rig, masks and contact sockets do not. |
| ComfyUI + local model | Original-art variants and pose-conditioned candidates | GPL-3.0 application; each model has own licence | Application/deps ~2–5 GB; models additional ~2–12+ GB | MPS documented; not benchmarked here | 1–4 h | Identity/alpha/temporal drift. Not installed; user-only model proposal if later justified. Never reference input. |
| RIFE | Optical-flow in-between frames | MIT code; verify chosen weights separately | ~1–3 GB dependencies plus model, estimate | CPU possible; upstream MPS support unverified | 1–3 h | Can smear impact holds, double edges and alpha; unsuitable for contact interval. |
| FILM | Large-motion image interpolation | Apache-2.0; repo archived | ~1–3 GB dependencies plus weights, estimate | TensorFlow arm64 path unverified | 2–4 h | Archived; onboarding and contour errors. Not chosen. |
| ControlNet | Pose/edge conditioning for generated original art | Apache-2.0 code; checkpoints/base model separate | ~4–10+ GB model/dependency estimate | Through compatible ComfyUI MPS nodes; not locally tested | 2–4 h | Human-pose guides poorly fit cats; manual cut-outs provide stronger continuity. |
| Community Blender MCP | Remotely drives Blender operations | MIT community project, not Blender Foundation | Server <100 MB estimate, plus Blender | Python path plausible; not tested | 30–90 min plus user config | App MCP configuration is user-only. No benefit over allowed headless scripts for current plan. |
| Playwright + ffmpeg | Record real renderer/audio; timestamps, LUFS, true peak | Apache-2.0 / LGPL-or-GPL depending build | 0, installed | Yes, Q0 capture executed | 0 | Chosen. A captured waveform is not a listening verdict. |

## Recommendation per step

Register art and sockets with existing loaders plus sharp/Pillow. Block poses in the native cut-out player. Author directional shader meshes using the approved original PNG layers; use offline-authored flipbooks for complex shape evolution. Pack only if atlas fetch/decode measurements require it. Drive audio with the existing WebAudio engine on the same clock. Capture with Playwright; analyze with ffmpeg/NumPy; manually review every strip. Use Blender headless only if the pilot reveals a concrete geometry problem which those tools cannot solve.

No new package was installed during this research. No external model was called. The user-only file records that optional heavy tools are deferred, with exact proposals required before any later install involving accounts, app configuration, admin access or models over 2 GB. See `../NEEDS-USER.md`.
