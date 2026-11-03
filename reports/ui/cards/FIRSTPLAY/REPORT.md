# FIRSTPLAY — visible entry and measured first reward

A fresh local guest reaches Home in986ms at1280×720 and926ms at1600×900, including the first-visit Help, Landing, class choice and confirmation. The first natural reward appears at30,531ms/30,438ms. These are real wall-clock measurements with no seeded save, manual claim or clock acceleration. The existing30-second claim cadence accounts for the wait; no economy, API or scheduler number changed. This is not the36-second segmented earned-save demo and not a fresh-to-boss claim.

The new RAF monitor exposed one entirely unlabelled frame after first class confirmation at both sizes. Class state was committed before the passive routing effect selected Home. The existing route synchronization now runs in a layout effect before browser paint. Both full journeys then passed with zero blank frames. Initial failing runs and the test-only Window typing error remain in logs.

Landing now exposes its visible title as a semantic heading and associates guest-play guidance with the primary button. This changes accessibility semantics without changing any pixels: all four accepted main340f88b Landing/Class PNGs still compare byte-for-byte. Existing art, copy and layout are preserved.

Builder:87 affected unit/contrast tests,typecheck,lint,build and8browser cases passed. Returning saves, disconnected wallet, offline/online recovery, and delayed/refused class save retain visible labelled UI. The existing503class recovery spec now uses the same visible-root guard; it still asserts no class persisted on refusal and successful retry. Guest runs have no console errors or network writes. The server fault is an explicit local test fixture.

Fresh A/B gates and release remain pending. Backend auth-nonce502 health hold still blocks merge. Timing evidence is timing-builder.json; captures are indexed in captures.json.

Fresh visual review found an inherited first-reward heading at2.296:1 contrast when the root has no OS-theme attribute. Both real natural-earn journeys reproduced it. The MOTION parent now scopes the existing accent token to this night-card heading; the same rendered4.5:1 assertion passes at both sizes. Added contrast checks for the visible reward heading, lines and item name/meta, and retain computed ratios with fresh timing evidence. The first green attempt correctly passed contrast but failed an evidence-directory ENOENT; the writer now creates its output directory before timing JSON. The corrected green run passes2/2 with zero blank frames. All earlier logs remain.
