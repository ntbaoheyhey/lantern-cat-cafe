# P3 keyboard, motion, spacing and bundle review

Head `127e3f87c678be5909c4b420c46fd55d75fb5d72` has a runtime tree identical to main `340f88b`. This is a current-main baseline, not final-stack acceptance. All serial measurements completed at2026-11-04T04:57:50.554647+00:00. The combined supplement exits1 for the known keyboard defects; performance passes do not override that failure.

## Keyboard and screen-reader semantics

Automated keyboard traversal, native focus screenshots, the browser accessibility tree and pinned axe are used here. This does not claim a human VoiceOver/NVDA listening session. Current-main class-confirmation Enter/Escape/Cancel focus is covered by accepted #268; the stage role and empty-Bag keyboard region are covered by accepted #263. Their failed baseline receipts remain blocking. All four width/motion combinations reproduce failed confirmation focus after Enter, failed Escape return and failed Cancel return (12 failed checks); class radio arrows pass4/4. Landing tab order is guest→wallet→NFT contract→Market contract→Help, and each interactive control has the2px yellow focus ring. Native1280 landing focus and1600 confirmation screenshots were reviewed. The latter visibly leaves focus on the underlying action. Enter opens all seven routes; application code deliberately moves focus from the rail into panel content. Home accessibility-tree/DOM inspection records labelled navigation, tabpanel/status/currency/experience regions and polite event updates. Axe still rejects the stage label and empty-Bag keyboard region.

[Raw keyboard, focus, accessibility tree and performance record](keyboard-performance.json). [Serial receipt](logs/receipt.json). No product console/page errors or document overflow occur in the four samples.

## Motion and layout shift

Unmodified tools/effects-test.mjs with the existing port-only adapter passes10/10 at1280×720 and10/10 at1600×900. Each measures60.0fps, p95 about17ms, zero frames above250ms and correct reduced-motion behavior. Four separate normal/reduced samples measure60.001–60.004fps, p95≤16.7ms, zero long frames and CLS0. No threshold is reduced. [1280 receipt](effects-1280x720/summary.json), [1600 receipt](effects-1600x900/summary.json).

## Spacing and typography

The approved brief and theme.css specify a92px rail,56px HUD,4/8/12/16/24/32px spacing tokens, Pixelify Sans headings, DM Sans body and JetBrains Mono numbers. Native main Class/Home/Bag/Forge/Market/Help screenshots were reviewed against that hierarchy. A's strict fixture audit finds no document overflow, overlap, missing audit targets or console errors in18 screen/mode views. All28 route/font observations in the four keyboard samples match the body/heading/numeric font tokens and show no document overflow. No new spacing or typography repair is needed from these views. This bounded visual finding does not waive contrast, accessible-role or focus defects.

## Bundle

[bundle.json](bundle.json) records local build sizes: entry141,603bytes gzip, Phaser315,728bytes gzip, web3 106,729bytes gzip (Node zlib level6). Vite's compression estimates differ slightly and are separately labelled. StageCanvas dynamically imports Phaser and StageScene; optional arena/catalog modules already use dynamic imports. No dependency or runtime byte is added by the docs change, and no additional large eager feature was introduced. The bundle remains comparable to the accepted main baseline.

## Product defaults

Original economy remains default OFF. Rune/skill/companion candidates retain Sample/Unavailable status. No economy decision, balance number, production flag, art file, external asset or provenance entry is changed.
