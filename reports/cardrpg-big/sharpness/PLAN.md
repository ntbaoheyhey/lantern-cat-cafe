# F2 implementation plan · historical checkpoint
REFERENCE: ../memory/PROMPT.md, ../memory/STATE.md, tools/cardrpg-big/build.mjs, apps/web/src/game/squad/turn3d/card-face.ts

Status updated 6 November, 14:56 local. Runtime verification and cold7×2 are complete. README.md, PERFORMANCE.md and memory/STATE.md carry current results. The original planning steps below are retained as history.

F1 draft #335 contains validated source at 1bc9da20c855592dfef6def3c73d293814443ebb. Its frozen 610-case timing matrix is running in session 44089, output layout/skills and validation/f1-skills.log. Avoid builds, tests, image baking and git packing until timing ends. The snapshot was copied to a temporary directory by skill-measure.mjs before F2 changes.

## Authored, pending runtime verification
REFERENCE: apps/web/src/game/squad/turn3d/post.ts, scene.ts, card-face.ts, card-surfaces.ts

- Crisp automatic-battle post uses up to four MSAA samples in Medium/High. Target changes release same-size framebuffer resources. New focused tests cover sample caps and shared callers.
- DPR changes refresh backing dimensions even if the CSS viewport dimensions stay the same. Low still uses the antialiased direct renderer.
- CardSurfaces loads a shared 1024px tiled color/normal pair with mipmaps and up to 16x anisotropy. Felt rim shading is an authored material hook.
- CardFace reuses face sockets, adds instanced higher-resolution pupils/highlights, six named expressions and bounded independent eye tracking. Focused tests check stable repeat sampling and all six expression mappings.
- The post shader samples depth to soften scenery behind the action lane. It needs visual and timing checks, including MSAA depth resolve.
- Offline assets unpack individually through browser streams. They become blob URLs before the app starts. The application script no longer contains the model/image strings. The loader yields between assets and retains source receipts.
- Portraits are generated at 800×960 into WebP, with all six starter expressions captured separately. Original SVG icon paths get explicit native dimensions and a slightly stronger stroke.
- The evidence screen displays all five before/after crop types at DPR1 and DPR2 after the measurement export is generated. The first pilot build can omit those images until capture completes.

## Resume commands after F1 measurement finishes
REFERENCE: tools/cardrpg-big/validate.mjs, tools/cardrpg-big/inspect.mjs, tools/cardrpg-big/sharpness-check.mjs

1. Run `node tools/cardrpg-big/skill-report.mjs reports/cardrpg-big/layout/skills`, then inspect ranked offenders. Profile them with tools/cardrpg-big/profile-skills.mjs. Update F1 evidence and draft only after re-reading rules/state/F1.
2. Run `node tools/cardrpg-big/surfaces.mjs` and `node tools/cardrpg-big/icons.mjs`. The new asset imports intentionally require these outputs before the F2 build.
3. Start Vite on port 5926 with apps/web as root, then run `node tools/cardrpg-big/portraits.mjs`. Inspect generated starter expression sheets and portraits.
4. Run focused web tests for card-face/post, typecheck, then `node tools/cardrpg-big/build.mjs`.
5. Run `node tools/cardrpg-big/sharpness-check.mjs` and `node tools/cardrpg-big/inspect.mjs`. Fix regressions and shader errors. Preserve failed pilots.
6. Run `/tmp/cardrpg-big-tools/bin/python tools/cardrpg-big/sharpness.py --export`. Check the actual Python path if this virtualenv layout differs. The export requires exactly ten named crops per phase.
7. Rebuild to embed comparisons, then run the seven cold scenarios, full skill matrix, three-size paths and all five validation gates sequentially. Validate flag-off bundle isolation and measured GLB/HTML byte budgets. Update STATE after each finished step.

At the time of this plan the source was unvalidated. The corrected five-gate run now passes in validation/f2-fixed.json. F2 publication follows the cold-load profile. Preserve failed measurements and report any crop below the +40% target. Baseline source GLB total is 15,650,856 bytes. New eye geometry is runtime-generated and surface PNGs are shared separately.
