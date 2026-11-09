# L3 lighting / post — audited checkpoint

REFERENCE: docs/cardrpg-look/index.html; rounds/post/runtime-3/REVIEW.md; validation/l3/functional/checks.json; memory/l3-rebase.json

Source71da901f is rebased onto accepted A4d525a8a (portraits and retained battle shell). Cleanruntime artifact02ffd9cb351fba4984dffac98036a2853bde5fe06e0a1ce503ceccc53655cb70,22,578,111bytes. Functional/post/cancellation/source/performance checks completed sequentially; checkpoint-audit.json verifies1,301inputs, exact artifact and all phase receipts.

- High: prewarmed HDR targets,12sample depth AO, soft-knee selective bloom, projected face protection, camera-relative gentle focus, depth-edge outline, chapter LUT, vignette/grain, MSAA/SMAA.
- Balanced: same allocations, bloom/grade, skips AO/focus/SMAA. Low: direct renderer with baked materials and analytic fill. Adaptive sampling waits two slow windows to reduce quality and six fast windows to recover; requested tier is the ceiling.
- Original analytic128×64 environment and16³ chapter grades; no downloaded HDRI/model/texture or model-generation call. Existing Three SMAA lookup licence is retained.
- Heavy constructor work, first resize, legacy stage and decoration are split across loading frames. Cancellation remains asynchronous until renderer warming finishes; source makes no input/combat/rule changes.

Three actual visual rounds retained. Round1 AO speckle rejected; round2 stable AO/relative focus/emissive shade; round3 broad contact/ramp/near-focus refinement. Nine third-round views personally reviewed,36face component samples pass, tier switches retain123textures/552geometries/52programs. These original pilot results bind cee6234f before A-shell integration. Fresh component checks on02ffd9cb now also pass all36face samples with0offenders and stable123textures/552geometries/52programs in allthree tiers.

Matched1440wide projected-box metrics L2→L3pilot: Soot luminance separation.0524→.0506 (still below.18target), Laplacian1196.5→1119.6. Mochi1677.8→1443.2, Clover1328.5→1234.4. SMAA reduces high-frequency edge energy; no claim that these whole-body crop metrics improved. WholeframeSSIM.986779/meanRGBdifference2.99665 measures restrained change only. Inner-face bloom/focus ablations test a different question and preserve detail.

Original Classic cancellation295/294failure was diagnosed as the shared module-wide THREE.Sprite geometry of cafe-candle-halo. Corrected ownership excludes that shared geometry, still counts its material, and adds the new contact texture. Six pilot cases release0/21/167/0/186/294 resources, renderer/context/canvas cleanup pass. Original failures/diagnostics retained; not described as an engine leak fix. Fresh six-case cancellation on02ffd9cb repeats allsix successful releases and canvas/context cleanup.

Actual battles after A integration PASS at1024/1280/1440: stage/content74.65/75.83/81.21%, nine camera samples keep all actors/controls in bounds; six real Look toggles preserve state/battle and dispose replaced scenes;20stage resources released in each ofthree leave-table cases. Actual1024,1280 and1440 full screenshots viewed: HUD/nav crisp and separate from scene post. Sample106calls/101148tri; these are sampled counts, not peak-matrix proof.

Self-grades: cats7.5, lighting/depth6.5, stage6.8, colour/UI7, skill effects5(inherited), sharpness7, post7. Remaining: weak dark-body separation, mirrored shelf props, uniform paper shade, mild floor-wide gradient; no full shadow maps/GTAO/TAA/matcap claim. L4VFX/L6fullportrait-icons/L5roster/L7complete demo and final-only matrix/lifecycle/CPU4Balanced-Low remain open.

Fresh startup:11scripts/3,522,544bytes/686modules,0Three/model and0errors. Strict byte parity now+44 versus original3,522,500, not the earlierL2+4. The accepted A shell/meta integration is part of this current source; default dependency identities remain unchanged. Cold7 complete: nativeMAX33.4ms,CPU4MAX133.3ms. Native hub894.2–918.7ms/battle6742.9–7719.0ms; CPU4hub1693.5–1699.7/battle8832.4–8992.4ms. These retain the slow1440DPR2loading outlier. Separate24first/repeat casts allMAX16.8ms/100%≤20ms/errors0. Five gates pass including421E2E and1740web tests; protectedpaths unchanged. No finalmatrix/lifecycle claim.
