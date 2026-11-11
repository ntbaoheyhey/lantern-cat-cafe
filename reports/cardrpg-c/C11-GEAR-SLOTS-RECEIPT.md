# C11 — Cat gear slots open the requested shelf

Ten baseline browser checks at1280×720/1440×900 exposed the same navigation mismatch: an empty charm or relic slot opened the previously selected weapon, and an equipped outfit still opened All. No account changes occurred, but the destination did not match the clicked slot.

Cat gear selection now carries a transient slot to the Bag and clears a stale item for empty slots. Equipped slots keep their exact item, and normal Bag entry returns to All. Existing keepsake drawings identify filled slots; empty slots show owned count plus Choose gear, or Find on patrol. Unowned cats remain disabled, and route locks still apply. The note explains manual comparison and the current route state. No automatic equipment, currency, rules or art-source changes.

Final20browser checks pass:12slot/destination/account invariance cases, two exact public equip results, two general-entry resets, two route-lock guards and two unowned guards. All16captures inspected through four uncropped contact sheets, with both Cats captures also inspected full size. Shelf selections, empty messages and actions are visible; 720p preserves the complete first roster row. No overflow, broken images or browser errors.20existing focused tests across CatDetails/Bag/Power/model, workspace typecheck/lint and whitespace pass. No new balance cohort or recovery-rate claim; score7.79 remains.

Compact receipts/logs: checks/gear-slots-{before,final}.json and gear-slots-{tests,types,lint}.log. Two full-size Cats captures retained in shots/c11-gear-slots; all diagnostic images/contact sheets remain /tmp/cardrpg-c-gear-slots-{before,final}. The initial contact-sheet command found no system Pillow; the existing Sharp installation produced the sheets. This was a tooling issue, not a failed product gate. Reproducible harness: tools/cardrpg-c/gear-slot-review.mjs.

Static character/VFX demo inputs did not change, so the accepted29,226,665byte bundle is retained without rebuilding it. Evidence119.54MB (<120MB). Designer inbox still empty; C8/C11 continue. No new performance measurement or full-E2E claim.
