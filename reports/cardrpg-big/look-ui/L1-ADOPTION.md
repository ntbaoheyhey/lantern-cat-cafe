# LOOK L1 portrait integration preparation
REFERENCE: memory/PROMPT.md ADDENDUM LOOK2; coord/cardrpg-big/B-OUTBOX.md 2026-11-07T05:12:27Z; apps/web/src/game/cardrpg/depth/assets.ts

The B manifest was inspected read-only as unpublished working material. No B L1 assets or source have been adopted. Observed version2, phaseL1, complete=false; only mochi/soot/clover, frames/skills empty. Re-read the published checkpoint contract before implementation; this is preparation, not an acceptance receipt.

## Adapter and call sites
REFERENCE: apps/web/src/game/cardrpg/depth/{assets.ts,CompanionCard.tsx,TeamCollection.tsx,Invitations.tsx,Pages.tsx,App.tsx}; tools/cardrpg-big/build.mjs

- Resolve repository-root manifest paths through Vite URL globs in the lazy card-RPG module; never embed raw filesystem paths in DOM URLs. Keep classic portrait and SVG icon fallback when lookV2 is off or an ID is absent from the partial manifest.
- Portrait contract: assets/cardrpg-look/portraits/<id>-1x.webp256x320 and -2x.webp512x640. Card images retain contain sizing; provide srcset1x/2x so DPR2 gets native resolution without replacing the flag-off source. Small battle HUD callers of portrait(id) need a safe default; coordinate any Battle.tsx edits with B instead of editing its file.
- CompanionCard covers Collection, Team, featured Invitation card, reveal and results. TeamCollection covers two skill lists. Pages enemy portraits use classic fallback until matching published assets exist. Equipment/rewards have no separate cat portrait call: inspect their actual DOM before adding presentation. L6 frames/icons wire only when their contract is published.
- App already subscribes to lookV2 and rerenders root, and CompanionPreview recreates its scene preserving account. Verify actual portrait img currentSrc after a real live toggle; module-level look selection would leave stale images.
- Builder automatically embeds ?url WebP references and conditionally allows WASM when an embeddedGLB declares EXT_meshopt_compression. Confirm new compiled decoder loads successfully under file:// CSP; do not claim positive Meshopt proof from uncompressed L0.

## Acceptance after published adoption
REFERENCE: tools/cardrpg-big/{delivery-functional.mjs,audit-look-checkpoint.mjs}; look-ui/l0-reviewfix

Rebase-copy published B source onto an A-owned integration branch, preserving B draft ancestry and Bworktree. Record adopted upstreamSHA and A copySHA. Keep baseline-v1.html9a5f6ebb and previousf123 receipts immutable. Build main and pin its new hash.

Verify three portraits at three sizes and DPR1/2: naturalWidth/currentSrc/decoded complete, whole face/crown visible, screenshot crop review, real LOOKoff/on toggles preserve account/route. Check default production startup modules/requests unchanged and no model/Three imports. Check no remote loads/CSPerrors or broken fallback for remaining cats and enemies. Rerun five source gates and ten functional groups under short locks before A CHECKPOINT. Cold/cast timing and final860matrix belong to LOOK B.

## Pending upstream
REFERENCE: coord/cardrpg-big/B-OUTBOX.md

L1 published tip/visual evidence; eventual L6 complete portrait/skill/frame manifest and assets. No art-grade increase follows from files existing. User visual complaint remains open.
