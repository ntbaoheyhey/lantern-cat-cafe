# Art Rebuild handoff — paused by user

Saved UTC: 2026-11-09T13:47:45.209202+00:00
User instruction: “lưu handoff và dừng”. This explicitly pauses the long autonomous run. Do not resume, render, test, generate images, poll Lane A, or publish further work until the user asks.

## Workspace and branches
- B worktree: `/Users/bao/taskbar-hero-cardrpg-b2`, checked out `codex/cardrpg-art-r1-2026-11-09`.
- R0 draft #423: https://github.com/ntbaoheyhey/taskbar-hero/pull/423 ; baseline commit7393f294b. Completed, do not repeat.
- R1 last art commit `f22110ad3`: four original generated concept masters, full prompts and provenance; no runtime changes.
- Full Run M5 branch `codex/cardrpg-v5full-m5-2026-11-09`, pushed head `440ec2890`, draft #425: https://github.com/ntbaoheyhey/taskbar-hero/pull/425 . M5 is complete PARTIAL.
- Integration `/Users/bao/taskbar-hero-cardrpg-v5live`, branch `codex/cardrpg-v5live-2026-11-09`, draft #420 INTEGRATION PREVIEW — not for merge.
- Integration merge `6c1944d2f` incorporates A S6 `1195b13fa`; reporting commit `96c3b0c21` was pushed successfully. Local follow-up `c5712f7c0` only adds M5/ledger links; its push was remotely rejected with generic `(failed)` and has NOT been retried after user stop. No approval-review rejection occurred. Verify remote before a future retry; never force-push.
- R1 does not yet include M5 commits440ec2890. Merge that reporting branch only after resume; any full/STATE conflict should retain the newer M5 completion state. Keep all R1 art files.
- Ledger report published directly atop remote `ai/codex-ui-ledger` via temporary index/commit-tree: `63581b579c9e96c4a64e35e48ef343d573608504`. This preserved unrelated dirty files in the ledger worktree; its local checkout was not advanced.

## Completed in this continuation
1. Read latest Art Rebuild prompt, inherited Full Run rules/state/fixlog, art direction and relevant code. R0 complete: 421/421 E2E, exact parity, baseline5.9966/10. Do not replace prior successful or failed samples.
2. Applied built-in imagegen skill, generated four original character guides. Masters in `assets/source/look-v3/concepts/{mochi,soot,button-guard,yarn-giant}.png`; full prompts in `tools/cardrpg-look/art-rebuild/prompts/`; hashes/tool/date/params in `reports/cardrpg-look/art-rebuild/r1/concepts.json` and `assets/provenance/look.md`.
3. Inspected generated figures inline: two cats, coherent limbs/faces, saturated button/yarn enemies. These are guides only; alpha-edge cleanup, palette processing, layer segmentation/inpainting, rigging, animation, sprite/GLB packing and runtime QA remain UNRUN. No beauty score for the candidate pipelines yet.
4. No Blender-v3 scripts, lookArt switch or two candidate pipelines have been implemented. Do not claim Mochi is running in the game. Existing runtime is unchanged.
5. Background watcher returned A `V5A-S6 DONE` at2026-11-09T13:36:45Z, draft #424. Paused art safely and completed mandated M3 refresh + M5 reporting duty.
6. Compared13relevant production/build inputs across A published probe584672487 and closure1195b13fa, and integration before/after merge: all exact. 779changed A files were reports/diagnostics/deliverables. No B held-out simulations or visual retuning. Reused identical-runtime M4 receipts without resampling.
7. M5 report64lines: `reports/cardrpg-look/skills-v5/full/V5FULL-REPORT.md` on M5/integration branches; receipt `full/refresh/s6-done.json`; links verified. B-OUTBOX `V5FULL-M5 DONE` committed/pushed. #420 description updated. No PR merge/deployment.

## Important exact measurements and open issues
- Full demo30,075,127B SHA256edd92234d18c0fbf5821baa60716dfe4e148b3d286c9bbde250d89f65905709f; lean21,812,603B SHA256662f3bb3caa2d3eb458b69315443d02311e382c5efe31f2cf72e92b90e18d980; both unchanged by S6 refresh.
- Full Run self-score7.54/10; VFX6.233/10;45/45observed cells,18seeds/23retainednatural samples/2091plans.15live+2fixturePshots. Original10narrow ending probes NOT VERIFIED; no human recognition claim.
- Nativecast16.8ms; CPU4cold183.3ms;147draws (130MISS; documented150ceiling only Bpreview);163239tris. All prior misses remain visible.
- Inherited open: upload44.3ms>40, sampled allocations nonzero, OFF entry+3B, Kettle1.997x, pale enemies/VFX depth+uniqueness. Repair caps and original samples remain in Full FIXLOG.
- Evidence before M5 report approximately79.137MB; new JSON/report receipts add modest bytes. Recount before additions against Full cap80MB. Art cap120MB, source masters60MB; four masters presently source-only.

## Resume order (only after user resumes)
1. Read art PROMPT.txt, STATE.md, this handoff, DECISIONS.md/FIXLOG.md, Full RULES.md and latest outboxes. No subagents or helper models. Built-in image generation expressly allowed by latest art prompt.
2. Reconcile M5 reporting into R1; inspect integration remote and finish the pending link-only push if still appropriate. Do not repeat completed M5 or S6 samples.
3. R1 bake-off: Mochi/Soot/ButtonGuard/YarnGiant in both 3D+ and layered2.5D, same real battle/studio shots, then rubric-based choice. Strong source illustration is not runtime acceptance.
4. Implement B-owned lookArt v2/v3 inside lookV2; v3 only demo default, retain v2 comparison. Keep lookV2 OFF startup and all rules/default flags unchanged.
5. Continue R2 roster batches, R3portraits, R4VFX, R5stage, R6judge hygiene, R7integration/films, R8report with the exact gates/review loops from art prompt. User pause currently takes precedence.

## Useful implementation findings
- `turn3d/assets.ts` loadModel caches by atelier/classic and role; `look-models.ts` eager URL registry in lazy route; `scene.ts` warms/clones models and installs material/face/utensil handlers.
- `look-readable-enemies.ts` overwrites enemy material base/emission to pink; new v3 models must bypass/replace this override within v3, preserve v2.
- Existing authored transform rig uses named `<role>_head/body/eyes/earL/earR/armL/armR/tail/footL/footR`, plus sockets; roles guardian/witch/guard/yarn for the four candidates. Existing CardFace animates eye/brow/mouth pivots; CardUtensil skips duplicates when root extras lookProps=true and model lookV2=true.
- Current clone uses scene.clone(true), not SkeletonUtils: consider this before introducing skinned armatures. Preserve event clocks, protected-face anchors and clips.
- Blender4.5.3 at`/Users/bao/tools/cardrpg-look/Blender.app`; Python/PIL/numpy at`/Users/bao/tools/cardrpg-look/venv/bin/python`; sharp/gltf-transform in externalnpmtoolbox.
- Read-only heavy lock helper `tools/cardrpg-look/with-timing-lock.mjs`/`lock.mjs` tags B-LOOK,6.5shandoff; use bounded≤20min leases for browser/render. Non-heavy nice10. Ports5920–5923. Never touch A worktree.
- GitHub connector fetch_pr returned Transport closed. Used gh fallback; no need to retry connector solely for reporting.

## Processes / local receipts
No own browser, render, test or wait-outbox job is running at pause. Both watcher processes have exited. Do not kill unrelated PIDs.
Own temporary records in `/tmp/cardrpg-v5full-art-r1/`: s6-merge.log, pr420.json, pr420-body.md, m5-pr.md, m5-done.txt, ledger.json/index. R0 logs remain `/tmp/cardrpg-v5full-art-r0/`.
Latest user request is pause, not cancellation. Handoff does not authorize further work until resumed.
