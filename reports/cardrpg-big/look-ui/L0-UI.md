# LOOK L0 — UI evidence, functional acceptance pending
REFERENCE: ../memory/PROMPT.md ADDENDUM LOOK; PLAN.md; ../validation/look-l0-reviewfix.json

The opt-in meta screens now share the published night/ink/honey palette, paper/felt/grain surfaces, typography, corners and four token-derived rarity frames. The normal application still starts with LOOK off. This is the UI evidence checkpoint, not an accepted main artifact or a claim that the user's overall visual complaint is solved. Blender models, stage, portraits and icons remain the LOOK lane's next deliverables.

Candidate `f1234525fb744d0b318c2ea65727256cfb71fc6cc31c2380cf6fac93941a0f56` is 24,026,508 bytes. Source fixes are `f2a43ad1` and `b173715f`; verification tools are `089201e3` and `e056d1fe`. Five source gates pass: typecheck, lint, 1,731 web/1,020 rules tests, build and 421 E2E. Rules retain two expected failures and eleven skips. Offline-entry types also pass; the first wrong-path invocation is retained. No new game-rule or 3D change.

## Real toggles and rendered text
REFERENCE: l0-reviewfix/1024/checks.json; l0-reviewfix/1280/checks.json; l0-reviewfix/1440/checks.json; tools/cardrpg-big/look-contrast.py

| Viewport | Real toggles / screenshots | Text rectangles | Active failures | Inactive failures | Minimum active contrast |
|---|---:|---:|---:|---:|---:|
| 1024×600 | 10 / 10 | 386 | 0 | 0 | 5.66384:1 |
| 1280×720 | 10 / 10 | 496 | 0 | 3 | 5.60834:1 |
| 1440×900 | 10 / 10 | 612 | 0 | 5 | 5.60834:1 |

All thirty toggles preserve account, selected companion and screen; active miniature scenes recreate. No runtime errors, remote requests or horizontal overflow. Measurements sample every rendered background pixel under visible text rectangles, with text masked and DPR1. Inactive controls are reported separately, so this is not a whole-page accessibility certification. The earlier 1440 capture had three failing question marks at 2.109–2.330:1; a dark token backing fixes them. Earlier selected studio-tab contrast was 1.079:1; the paired foreground/background fix awaits the new full gallery receipt.

| Screen | Baseline styling on the same candidate | LOOK styling |
|---|---|---|
| Team | [Before](l0-reviewfix/1280/team-off.png) | [After](l0-reviewfix/1280/team-on.png) |
| Collection | [Before](l0-reviewfix/1440/collection-off.png) | [After](l0-reviewfix/1440/collection-on.png) |
| Equipment | [Before](l0-reviewfix/1280/equipment-off.png) | [After](l0-reviewfix/1280/equipment-on.png) |
| Invitations | [Before](l0-reviewfix/1280/invitations-off.png) | [After](l0-reviewfix/1280/invitations-on.png) |

These off/on screenshots compare the CSS switch on the exact new HTML. They are not relabelled baseline-v1 browser runs. The preserved baseline-v1 HTML and its original captures remain `9a5f6ebb`.

## Original materials and actual gloss
REFERENCE: materials.json; ../../../../assets/provenance/look-meta.md; foil-l0/checks.json; foil-l0/pixels.json

Three original, seeded, seamless 256px tiles total 105,652 source bytes; exact indexed-RGBA round trips and seam checks pass. No external art or image-generation call. Rarity body/edge/foil parameters come from B's JSON. The foil sits behind the portrait and text. Actual legendary-card crops 2.25 seconds apart differ in 25,291 of 58,647 pixels; reduced motion produces zero changed pixels. State is unchanged and no browser errors occur. This proves visible motion and its opt-out, not a quality score or performance budget.

## Startup and size
REFERENCE: flagoff-reviewfix/{checks,comparison}.json; l0-asset-sizes.json; l0-size-exception.json

Fresh default production entry loads 11 JS files, 3,522,500 bytes and 686 modules, matching the published baseline inventory: zero added/removed modules, Three.js modules, GLB requests or runtime errors. The existing Google Fonts request is blocked in the harness; the offline demo performs no remote requests. Byte-identical whole-app behavior is not asserted.

| Embedded class | Count | Decoded bytes | Gzip bytes | HTML base64 bytes |
|---|---:|---:|---:|---:|
| Models |25|15,650,856|6,433,548|8,578,096|
| Portraits |41|2,976,280|2,916,325|3,888,484|
| Icons |52|19,256|15,153|20,280|
| Other art |71|6,081,366|6,034,564|8,046,172|

All 189 manifest source assets are unchanged from baseline; CSS tiles are packed in the separate JS/CSS payload. All 93 comparisons/160 embedded comparison images remain. The 24 MB target misses by 26,508 bytes; HTML grows 89,508 bytes (0.37393%) from baseline. The explicit LOOK brief permits up to 32 MB when before/after evidence justifies the gain. The lab exception pins this exact hash, bytes and six screenshot hashes; its default remains 24 MB. The material and palette cohesion shown above justify this small increase. Loading/cast performance must still be remeasured by B; no earlier timing is promoted.

## Remaining acceptance
REFERENCE: functional-l0/functional.json; functional-l0-reviewfix/functional.json; ../memory/STATE.md

The first candidate `a1ae7ea4` retains its failed gallery/size receipts and ongoing diagnostic pack. Its completed functional groups are not reused as passes for `f1234525`. The new ten-group pack runs with the shared timing lock and seven-second handoffs. Publish an exact-hash A CHECKPOINT only after all groups, final main rebuild and saved-evidence audit pass. The one final 860-case matrix remains LOOK B's L7 responsibility.
