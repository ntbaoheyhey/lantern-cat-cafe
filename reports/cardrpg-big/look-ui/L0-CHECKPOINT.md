# LOOK L0 — A integration checkpoint
REFERENCE: ../memory/PROMPT.md ADDENDUM LOOK; l0-checkpoint-audit.json; ../validation/look-l0-wasmhook.json

Main static offline artifact: docs/cardrpg3/index.html, SHA256 `f1234525fb744d0b318c2ea65727256cfb71fc6cc31c2380cf6fac93941a0f56`, 24,026,508bytes. Runtime/builder source365c2928; source gate publication1933d944; published B L0 f3091a44 adopted. Acceptance here covers integration and selected UI measurements, not final artistic/performance quality. Baseline9a5f6ebb remains unchanged in baseline-v1.html, with its14videos/204screens/report.

## Phase-end requirement comparison
REFERENCE: ../memory/PROMPT.md lines213–218; l0-visual-review.json

| User requirement | Result | Evidence / remaining work |
|---|---|---|
| Finish14videos/report/coverage as baseline v1; no old longmatrix | PASS | b092ed0c, baseline-v1-report.md, ledger a2728798; old B queues retired |
| Adopt L0 tokens; restyle only meta/card/panel/type surfaces | PASS implementation; overall cohesion PARTIAL | Scoped look-meta.css,4tokenrarities, original paper/felt/grain; classic3D still differs until B art adoption |
| Real foil/gloss, panel textures, shadows, corners/lines | PASS selected samples |3original256px tiles105652bytes; actual foil25291/58647changedpixels, reduced-motion0; assets/provenance/look-meta.md |
| Original tool-generated art; screenshots and contrast | PASS scoped check |30live toggles,30captures,1494textrectangles,0activefails,8inactivefails; seven full-size screenshots reviewed |
| L1hero portraits and L6portraits/icons/frames into meta screens | NOTYET | B05:24 source visual correction pending, no publishedL1SHA; L1-ADOPTION.md maps call sites |
| Shared App/depth.css/build/offline lookV2 requests answered next commit | PASS |3934ffe2 App/scopedCSS/offline/CompanionPreview;365c2928 conditionalMeshoptCSP. No depth.css edit needed because scoped CSS follows it |
| Flag-off behaviour and default startup graph unchanged | PASS checked scope |30toggles preserveaccount/screen; default11JS/3522500bytes/686modules,0added/removed/Three/model/errors. No all-code byteidentity claim |
| Adopt published B tip; rebuild main and record new hash | PASS | Bf3091a44 in integration, exactf123hash above,1177inputhashes match, runtimeDirtyfalse |
| Five gates and functional pack, short lock windows | PASS | type/lint/build/1731web/1020rules/421E2E;10groups/204screenshot hashes,0errors/remote/overflow in asserted scope; per-group locks and7shandoffs |
| Publish A CHECKPOINT with exacthash; keep previous receipts | PASS local checkpoint; publication tracked in STATE | This receipt; olda1ae6of8PASS/2FAIL remains labeledINCOMPLETE, baseline9a5f6ebb immutable |
| Final report Look lane before/after, B rubric, A UI evidence, Vietnamese first | PARTIAL | Current report has9Vietnamese lines, A UIbefore/after. No published B art rubric yet; prior11grades stay baseline |
| Scope/ownership, draft PRs, no mainpush/deploy/mergeAPI | PASS local source scope; prior GitHub containment exception |0protected changes.358open/draft unchangedbase332;359/360auto-closed when their tips entered integration ancestry; no new mergeAPI. Future Btip copies preserve BPR |

## UI evidence and limits
REFERENCE: l0-reviewfix/{1024,1280,1440}/{checks,contrast}.json; foil-l0/pixels.json; l0-visual-review.json

| Viewport | Toggles / screenshots | Text rectangles | Active / inactive failures |
|---|---:|---:|---:|
|1024×600|10/10|386|0/0|
|1280×720|10/10|496|0/3|
|1440×900|10/10|612|0/5|

Minimum active contrast5.60834:1. The8inactive failures are retained and do not become a whole-page accessibility pass. Sequential visual review confirms readable Collection/Team/Equipment/Invitations, texture/material consistency and expanded gallery controls. Small team portraits, sparse stage, purple classic preview background and Marigold crown crop remain visible. No higher art scores assigned.

[Collection before](l0-reviewfix/1280/collection-off.png) · [after](l0-reviewfix/1280/collection-on.png) · [Team1024](functional-l0-reviewfix/meta/1024-team.png) · [Equipment1440](functional-l0-reviewfix/meta/1440-equipment-compare.png) · [Legendary reveal1024](functional-l0-reviewfix/reveal/1024-cpu1-legendary-settled.png).

## Size and performance
REFERENCE: l0-size-exception.json; l0-asset-sizes.json; flagoff-reviewfix/comparison.json; ../integration/delivery/baseline-cold-audit.json

Default24MB gate MISS by26508bytes; artifact-specific32MBexception pins six actualbefore/after screenshots and explains89,508byte(+0.374%)increase.189baselineasset sources unchanged,93comparisonrows/160images preserved. Embedded asset base64 bytes:3D8,578,096;portraits3,888,484;otherart8,046,172;icons20,280. Textures live in the JS/CSS payload; totalHTML also includes payload/evidence/loader.

L0 invitation functional CPU4 run records MAX200ms (MISS100ms), p9516.8ms,23frames>25ms/10>50ms; nativeMAX33.4ms. All4runs contain2423frames/29>25ms/10>50ms, independently recomputed in l0-invitation-raw-audit.json. Its raw timing includes screenshot work and is diagnostic, not controlled cold/cast acceptance. Preserve this observed hitch; do not substitute the lower historical baseline MAX. Raw paths are in functional-l0-reviewfix/invitations/checks.json. Fresh controlled L0 cold7/first-repeat casts are for B after this exacthash checkpoint; not inferred from functional screenshots. Baseline nativeMAX33.3/CPU4MAX116.7ms remains historical and misses100ms. No full matrix has run; only final lookV2 receives86actions×10configs from B. ConditionalMeshopt CSP is source-tested; positive compressed model load awaits publishedL1.

## Reproduction and next handoff
REFERENCE: ../../../../tools/cardrpg-big/{build,delivery-functional,audit-look-checkpoint}.mjs; L1-ADOPTION.md

Build main with BIG_LOOK_V2=1 and BIG_PYTHON pointing to Pillow; normal builder/app defaultOFF. BIG_OUTPUT_DIR supports separate B output. Existing f123 UI/functional receipts reference /tmp/cardrpg-a-look-l0-contrastfix/index.html, whose bytes match main; audit verifies exact hashes instead of relabeling paths. Audit uses LOOK_GATE_PATH=reports/cardrpg-big/validation/look-l0-wasmhook.json. Do not replay completed baseline video or functional runs.

Next: publishedL1 assets/manifest, then A portrait wiring/default-off fallback/DPRproof, newhash/fivegates/functionalpack. L6fullicons/frames and final B rubric/matrix remain later. Read B-OUTBOX at phase boundaries; shared timinglock and6.5s handoffs remain mandatory.
