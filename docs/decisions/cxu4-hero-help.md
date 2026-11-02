# CXU4: Hero, Help and shared states

Date: 2026-11-01. Authority: resumed mega mission CXU4.

Context: reference drawings use placeholder items and sample power; existing rules and guide content must stay authoritative.

Choice: reuse nine existing item slots and CatPortrait in a three-column Hero sheet. Power is rounded full power; Level is bare power at current class/level; Gear is rounded power without bonus lines minus Level; Bonuses is full minus unbonused power. This telescoping allocation preserves total power exactly, including nonlinear terms. Alternative independent stat contributions do not sum because power is nonlinear. Reverse by removing the explanatory breakdown, never changing rules.

Help keeps six existing topics and every answer/config branch, rendering one answer at a time. Search includes answer text. Existing tests that expected six *visible* headings now explicitly inspect hidden inventory plus assert one visible answer. Classic help remains the original list. Extra tabs are typed component props, not placeholder promises.

Class changes use the existing loop and compare its adopted state after completion (loop catches errors). Shared primitives are apps/web/src/ui/index.ts. ConfirmModal is controlled; Cancel receives initial focus. Errors persist. Other screen modals are reserved for CXR2. No new dependency, art, gameplay, backend or flag.

Tier 2: StageLayout supplies the existing class action and hosts HeroScreen; documentation and browser harness prove integration. No shell/HUD/Phaser baseline repair is included.

Validation adaptations: the Help audit contract now requires the visible topic list, search input and active answer instead of the initially hidden Cat Key answer. Exact key-source assertions and baseline answer inventory remain tested. The U4 capture check now selects the outer Hero panel exactly because its union with the newly nested Character panel matched two elements. Slot-count checks target the Gear slots group because Change class adds a distinct action; the count remains exactly nine. Browser screenshot compression only repacks PNG IDAT, preserving pixels and the200KiB threshold.

User-supplied reference use: sources.csv, pages/wiki__mechanics.json and skill-trees-all-heroes.json in the2026-10-31 TBH Index research archive were inspected for search/navigation/topic relationships. The existing six-topic inventory already supplies that structure. No third-party names, art, claims or balance were imported. Source page: https://tbhindex.com/wiki/mechanics, captured2026-10-31; website observations are not engine evidence.

CXR2 migration inventory: apps/web/src/onboarding/HowToPlay.tsx, apps/web/src/layout/loot/ChestReveal.tsx and apps/web/src/layout/loot/WelcomeBack.tsx retain their existing dialog implementations. They are intentionally not migrated by this item.

2026-11-03 fresh builder repair: an added regression proved that per-dialog restoration unlocked the background when an older modal closed before a newer one, then could leave it inert after final cleanup. The shared modal stack now owns one original-attribute snapshot, keeps only the top portal usable and restores the background after the final dialog closes. Focus returns to the original page opener if a nested opener was removed. New tests cover out-of-order closure and simultaneous portal opening; existing focus, Escape, backdrop and preexisting-attribute assertions are unchanged.

The focus candidate filter also explicitly rejects native disabled controls that declare a tabindex. This closes the selector-union loophole without excluding intentionally focusable aria-disabled explanations. A reverse/forward Tab regression verifies the real active element.

Fresh gate repair: restore Start Exploring as Help's primary action; the existing one-primary-action assertion remains unchanged. The independent static shell stub now contains the new Help topic/search/visible-answer contract, still without importing the manifest or application code. Search indexing preserves inline adjacency (for example Warrior: sword and configured30 Yarn), separates block text and normalizes whitespace; visible guide strings remain byte-for-byte covered by the existing inventory test. New unit/browser phrase checks and a return-to-Home action check protect these fixes.
