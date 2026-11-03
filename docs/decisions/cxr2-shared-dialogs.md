# CXR2 shared dialog migration (implementation in progress)

The CXU4 inventory names HowToPlay, WelcomeBack and ChestReveal as remaining custom dialogs. They now delegate portal/focus trapping/background locking/stack order/Escape/cleanup to the shared Modal. Loot keeps its single action and ignores backdrop clicks; Help keeps its close label and first-visit fallback to the menu toggle. Existing classic text, economy, artwork, reveal cadence and reduced-motion semantics are preserved.

The shared API adds optional presentation classes and close-control options. Explicit return-focus refs may resolve after the DOM commit; cleanup reads the current connected target. The default behavior is unchanged.

Old→new test notes: loot previously rendered inside the RTL container; portal tests now query RTL baseElement/document while retaining exact artwork/count/aria assertions. Two focus tests previously expected background focus while their mocked onClose/onDone left a dialog open. They now unmount from the callback, matching StageLayout ownership, and retain the immediate same-event focus assertion with no wait. Returning focus behind an open inert modal is not valid behavior. All timing, reward, callback count and keyboard assertions remain.

Historical CXR2 edits from the separate clone are preserved in ledger CXR2-FRESH/preserved-old. CXR1 already covers the overlapping landing/class/Home/Bag/token findings. This card will record finding dispositions and recheck every currently merged screen. Forge/Market redesign remains PARTIAL in252; no completion claim. No backend, settings/flags, assets, economics or transactions change.


First browser builder:1 pass/10 fail. Nine runs reached the shared build guard while a real Help/Welcome dialog hid the background h1 from assistive technology. The guard now still requires the painted h1 and unchanged project/origin/build marker, and additionally requires a visible active dialog and inert/aria-hidden root whenever that heading is inaccessible. One reduced-motion loop resolved directly to a chest, hiding its painted Boss arena; that geometry assertion now includes the hidden background only in reduced mode. All visibility assertions remain, with no timeouts/retries changed. New dialog tests explicitly demand background isolation; exposing the background to satisfy old queries would regress accessibility.

Second browser builder:7PASS/4FAIL. The new offline fixture seeded an old claim but omitted the UI's separate v2-last-visit marker and normal30s claim tick. The test now seeds a genuine hour-old visit before loading and advances only that existing loop tick. No production state/behavior or assertion is changed; this is explicitly local fixture evidence, not live offline earnings.


Third visual correction: the long offline-loot capture focused OK by scrolling its whole dialog, leaving the title and earnings rule offscreen. Only the loot-summary area now scrolls; tests require the title, rule and OK visible together. Visual review also found v2 initial Help still using classic boss/key/recipe advice. StageLayout now explicitly selects v2 guidance derived from the existing V2_CONFIG/RELIC_RECIPE, while App's classic default and all existing classic copy tests are unchanged. New unit/browser checks require current daily-key, win-only cost,200 capacity and30Yarn/1MoonPearl truth. No rule/flag/backend behavior changes.

The same final visual pass closes the deferred rail detail: square2px active frames, page-background rail and high-contrast Fuji badge. Existing logo/icons, navigation semantics, header context row and integer-stage sizing are retained. The browser checks the actual active frame at both sizes/motion preferences.
