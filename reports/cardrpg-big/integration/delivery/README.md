# Combined delivery candidate
REFERENCE: ../../memory/PROMPT.md F7; ../F7-GATES.md; ../../../../tools/cardrpg-big/offline.tsx

The source combines Lane A's items, invitations, meta screens and automatic journey with Lane B's complete roster, stage, audio, isolated Mechanics lab and review studio. Lane B source `b6bab0b4` is published. Main wrapper source is `edae4110`; the header evidence merge is `7499b4e4`.

The offline artifact is 23,937,000 bytes, SHA256 `9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3`. `docs/cardrpg3/build.json` records source and input hashes, runtimeDirty=false, and 93 embedded comparison items. Historical phase artifacts and the old demo remain separate.

## Accepted local checks
REFERENCE: pilot/wrapper/checks.json; pilot/packing/browser-pixels.json

Twelve screenshots across 1024×600, 1280×720 and 1440×900 pass. Header controls stay inside their header, do not intersect each other or game content, and cause no horizontal overflow. The home 3D scene unmounts before the review scene starts. Escape restores the account and sidebar. All four Mechanics lab checkboxes start unchecked and reset when reopened. Twelve brief destinations remain reachable. No page errors or HTTP(S) requests were observed.

All five selected opaque texture transports have identical decoded Chromium RGBA: zero changed channels. Original texture sources remain untouched.

Visual inspection of 1024 home/studio and 1280 Mechanics lab confirms the captured controls and content. The gallery's ordinary view is compact; Focus stage supplies the larger viewing area. This is a functional checkpoint, not an art-quality score.

## Remaining acceptance
REFERENCE: run.sh; functional.json; ../../validation/delivery-v1.json

Combined typecheck/lint/build, 1,730 web tests and 1,020 rules tests pass (2 inherited expected failures, 11 skips). All421E2E also pass. Offline-entry TypeScript passes after correcting the command to select the web workspace; the root-workspace invocation failure is retained in demo-types-current.log. Scope verifies0protected changes, identical Fuji reader hashes and2,319,608startup bytes with0Three/model modules. Source acceptance is recorded in source-acceptance.json. The subsequent series covers all 86 actions, gallery focus controls, all embedded comparison images, the original Feel lab, meta screens, rare reveals, invitations, collectible designs, normal game journey and isolated Mechanics fights. Each step preserves its own log and checks the unchanged artifact hash. Videos and sequential visual review follow. The final 860-case performance matrix belongs to Lane B after the accepted integrated source checkpoint.

## Source and simulation reconciliation
REFERENCE: source-reconciliation.json; sim-source-parity.json

All 1,150 inputs recorded by the artifact builder still match their stored SHA256. No runtime, asset or builder paths changed after the build; the two new verification drivers are outside the application import graph. Every one of 51 rules inputs matches in each of the six saved gear/economy ON/OFF receipts. This verifies that the existing completed simulations apply to the combined rules source; it is not a new simulation claim.
