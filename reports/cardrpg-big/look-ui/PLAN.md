# Lane A LOOK integration
REFERENCE: ../memory/PROMPT.md ADDENDUM LOOK; ../../../../apps/web/src/game/cardrpg/depth/App.tsx; ../../../../tools/cardrpg-big/offline.tsx

Baseline publication is complete at b092ed0c; ledger a2728798831acc86619e6772205c7fefb4b58fcf. Keep baseline-v1.html SHA9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3. All baseline receipts remain attached to that artifact. These preparation files do not claim a LOOK adoption.

## Published contract required
REFERENCE: sync/coord/cardrpg-big/B-OUTBOX.md LOOK-L0 HEADS-UP 2026-11-07T04:30:00.655231+00:00

B supplied the helper path/API: `apps/web/src/game/squad/turn3d/look-v2.ts`, exports `isLookV2(): boolean`, `setLookV2(boolean): void`, `subscribeLookV2(listener): unsubscribe`. The helper imports no renderer/assets. B's local tokens are at `apps/web/src/game/cardrpg/look-tokens.{json,css}`; local commit663277c6 contains tokens/Bible, but not yet the helper. Published f3091a44 (draft360) adopted by fast-forward after resume; exact helper/API now available. Historical663277c6 pilot retained as preparation evidence.

App remains default OFF. Only an explicitly chosen look demo initializes ON. The live toggle subscribes to the cosmetic store; it must preserve account, screen, playback and default-off mechanics. Set `data-look-v2` on the app root, import the opt-in token CSS only through the existing lazy card-RPG entry, and scope every new meta rule to the flag. Root cleanup must not leave the next normal app mount opted in accidentally. Verify off→on→off with real clicks, plus a fresh normal startup.

## Meta surfaces and art
REFERENCE: ../../../../apps/web/src/game/cardrpg/depth/meta.css; ../../../../assets/provenance/look-meta.md; materials.json

| Surface | Existing hook | Treatment / evidence |
| --- | --- | --- |
| Sidebar, header, status | .cr-sidebar/.cr-topbar/.cr-status | Night/ink palette, honey active edge, readable supporting text; preserve approved layout |
| Panel, formation tray | .dp-panel/.dp-formation-row/.dp-team-heading | Felt/wood material, consistent 14px corners and layered shadow |
| Card/rarity | .dp-cat/.dp-card-common/rare/epic/legendary | Token body/edge/foil, gloss behind portrait; no animated text overlay |
| Collection and team | .cr-portrait/.dp-card-rarity/.dp-card-stars | L1 portraits when published, preserving label, object fit and 1024px controls |
| Equipment, skills and rewards | .dp-doll-slots/.dp-preview-skills and result rows | L6 art manifest only after publication, meaningful labels retained |
| Invitations/reveal | Existing invitation/reveal card components | Same rarity/material family, earned odds/pity/history always reachable |

No 3D, battle pacing, game rules, Fuji/chain readers or B-owned artwork changes. Texture preparation is complete; all usage, foil motion, visual grades and real-text contrast remain pending. Preview is a material sample, not an after screenshot of the game.

## Artifact acceptance
REFERENCE: ../integration/delivery/functional-audit.json; ../../../../tools/cardrpg-big/meta-check.mjs; ../../../../tools/cardrpg-big/with-timing-lock.mjs

1. Merge/rebase only B's published checkpoint; record source tip and zero protected-path diff. Build main HTML and record fresh hash/input manifest; keep all old receipts.
2. Run typecheck, lint, unit, build and E2E plus offline-entry types. Use short timing locks on ports5910–5913 and 6.5-second handoffs. No baseline/full-roster matrix.
3. Capture the normal path and ten functional groups at 1024×600,1280×720,1440×900. Add live toggle state-preservation and fresh default-entry checks. Baseline before images remain from exact9a5f6ebb; after images always carry the new hash.
4. Measure text foreground/background contrast for headings, supporting labels, nav, cards, filters, focus and rarity chips; inspect textured-background pixels as well as flat token ratios. Keep text outside postprocessing. Check reduced motion and foil behind portraits.
5. Publish A CHECKPOINT with exact HTML hash, source/gate/functional receipts and misses. B alone measures the final860 matrix after L7. Final report copies B's actual rubric and A UI before/after.

## Preparation finding: texture contrast
REFERENCE: palette-contrast-preparation.json; materials.json

Four of seven candidate text pairs fail a conservative full-bright texture alpha bound, despite passing or nearly passing on flat colour. Muted/raised drops from4.888 to4.000, honey/raised5.293→4.332, danger/panel4.898→3.960, sky/raised4.551→3.724. Do not use these as small text on textured surfaces. Use paper/cream for raised-panel supporting text; keep muted on a darker flat backing. Use honey as a button background with night text, and danger/rarity accents as borders with readable text. Real browser samples still required; no token changes in B-owned files.

## L0 wiring contract
REFERENCE: ../../../../tools/cardrpg-big/build.mjs; ../../../../tools/cardrpg-big/offline.tsx

`BIG_LOOK_V2=1 node tools/cardrpg-big/build.mjs` creates the chosen main offline LOOK demo with V2 initially ON. Without that explicit environment switch the builder defaults OFF, like the normal app. `BIG_OUTPUT_DIR=docs/cardrpg-look` lets B reuse this builder without touching main. Offline Look A/B uses the published setter/subscriber. App root carries the flag and token-derived rarity variables; CompanionPreview disposes/recreates its scene on flag change without replacing the account model, selected card, rotation control or route. Model rendering awaits B L1.
