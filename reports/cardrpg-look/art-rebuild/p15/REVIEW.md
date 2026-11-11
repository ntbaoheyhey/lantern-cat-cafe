# P15 — phase-three reinforcement visibility

The full P10 boss film and A6's live three-helper report exposed a gap in P13: slot modulo two put newly summoned Binding Threads on existing helpers. P13 remains accepted for its initial pair; this repair extends the formation to all four possible living helpers without changing rules, actor slots, boss/cat scale or camera.

A render-only map assigns each living actor ID the first unused lane. Existing actors retain their lanes if actor order changes or another helper dies; a later helper reuses the vacated lane. Initial positions remain (2.85, 1.25) and (4.15, 0.15). Summoned positions are (0.40, 1.15) and (1.60, 1.35). These coordinates are world x/z; feet stay on the cafe floor. Shadows and VFX sockets follow the same actors.

Attempt1 preserved outside Git shows why four distinct coordinates alone were insufficient: two right-hand faces were only 57px apart and two helpers extended 15px below the canvas. Attempt2 moves only the two summoned lanes across the foreground. Manual review confirms four distinguishable thread faces and clear boss faces, including Rain Spool's face between the first two foreground helpers. A6's initial two-helper composition is unchanged.

The harness resolves real current-A6 battles, retains both four-helper and later three-helper states, and renders them in their natural order so surviving IDs keep their established lanes. Twelve views cover Yarn Giant/Rain Spool/Pantry Crown × three/four helpers × 1440×900/1280×720. Actual canvases are 1440×670/1280×490. All views have zero page errors, outside unit bounds, missing live HP labels and face/HP overlap. Minimum helper-face distance is 151.1px/112.5px; manual inspection, rather than that metric alone, establishes visibility. Static review does not claim natural playback or performance; the complete P10 film is separate.

Source preview: A6 15f5653d0711284b45b6495b40e0ab33b5b5029a (six A6-owned updates; source receipt attached) plus B. Main B contains no A6 merge. The raw boss phase remains legacy value2 while both A6 labels correctly display phase3.

Evidence: attempt2/phase3-review.json; attempt2/phase3-contact.webp; representative Yarn1440 and Rain1280 views. All12 originals and failed attempt are preserved locally; only selected compact evidence enters Git to respect the120MB cap. Reproduce using phase3-review.mjs and boss-replay.json. Final check/budget receipt follows below.

Final validation: typecheck/lint and6focused tests PASS; five rules seeds remain exact across six art modes and102resolved plans remain unmodified. Actual combined artifact38,175,926B, headroom1,824,074B under40MB; Bembedded assets unchanged23,545,868B. Receipts: parity/parity.json and budget/budget.json. No gameplay or DOM markup changes.
