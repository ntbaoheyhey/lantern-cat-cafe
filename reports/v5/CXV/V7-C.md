# V-C: boss arrival and recipient net

Candidate READY, 2026-11-17T14:03Z. Runtime change f8e4e7ab3; capture HEAD 8ced24830a1fcf476fe3b09dffae3a9ba8cdec79. Integration confirmation remains open until CXI merges and publishes a new green build.

The boss now approaches from +64px X/-58px Y, lands at240ms, and releases its settle at620ms. An action starting at80ms releases the entrance by160ms; incoming contact removes the entrance contribution before impact. Reduced motion has zero entrance displacement. The first-action banner is bounded so it cannot obscure the strike.

Binding's net now surrounds actual recipients. A single target gets a380x280px weave with12 thin18px strands instead of an800x440px field with24 thick strands. The net clears at1640ms; the small local wrap retains the original action lifetime. Basic and ultimate contacts remain350/1100ms.

Validation:16/16 focused tests in boss-arrival,cinematics,thread-snare; typecheck0. Fresh captures on http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1, all1280x720,14:00:58–14:01:46Z, zero page errors. Measured sheets1024x576 and inspected each once.

| Capture | Measured/observed result |
|---|---|
| work/v5/CXV/films/V7-C-arrival/capture.json | 4 cases; arrival feet(921.6,546.8)→(857.6,604.8) at240ms; reduced feet stable; early actions continue without entrance restart |
| V7-C-arrival/arrival-1280x720.webm | Explicit25fps presentation-clock film, not live-performance proof; bounded approach, landing and settle |
| V7-C-binding-yarn/capture.json | Binding lands on recipient at1100ms;12 strands visible at1280ms; only local wrap remains at1760ms |
| V7-C-reduced/capture.json | Same recipient/contact; no lateral shake; neighbouring units remain readable |
| V7-C-binding-yarn/capture.json | Yarn painted-tip/socket error0 at350/1100ms; damage numbers legible |

Fresh BOARD production baseline was also captured14:01:45Z with tools/v5vfx/capture-judge-v7.mjs;3rows/0errors, served index hash checked against integration dist. It predates CXI's14:02 v5-m1.4 announcement and is not claimed as integrated V-C evidence. Rerun this harness against the first green containing this change.

Remaining visual debt: Yarn ultimate's existing large braid fan still occupies much of the lower screen; assess under V-F. V-E still owns a stronger film-worthy outcome/entrance review. No new texture approval and no game-rule changes.

## Independent BOARD production confirmation
2026-11-17T14:46:37.895Z, full BOARD URL6301,1280x720; 4 fresh sheets and zero page errors. BOARD declared v5-m1.5@6b972c4092b705c6ac27ef4d8ba37c3a9da23a74; integration HEAD3b21794deaadb071e604255300bb0c001760a667 has later sheet-recovery UI changes. Served index SHA25639053f70c09fc9de9dd0172c3e271cae816a453f3f3bc3fd0760ae312964532c matched integration dist byte-for-byte. Record exact runtime identity rather than treating the post-tag dist as immutable tag bytes.
Own evidence work/v5/CXV/films/V7-C-production-m15-r1/report.json, capture tool source2847a7028. Only fixture DTOs crossed into the production page; pixels came from its served renderer. Boss feet921.6/546.8→857.6/604.8 at240ms and stay settled620ms. Binding targets the recipient, clears broad weave by1640ms; local wrap remains. Yarn basic/ultimate contact350/1100ms retained. Four1024x576 sheets measured and inspected once. Yarn fan remains excessive and is explicitly V-F debt. This confirms local integrated behavior, not public deployment or an ordinary-play timing claim.
