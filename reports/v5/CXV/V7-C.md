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
