# ART2 — original additive pixel artwork

33 new PNGs total9,489 bytes (largest487 bytes): five rune frames and five rune slots, five companion portrait frames and five companion slots, seven frames for the existing original skill icons, and six illustrations for empty Bag, empty Market, no forge materials, no wallet, offline and Landing. All use the existing cafe-night-v1 palette, at most16 colors, binary alpha, native integer pixels and transparent32px frame centres. No existing image is replaced or deleted.

Exact recipe and per-asset briefs/hashes are appended to reports/asset-provenance.md and tools/art/ui-art2.json. Run `python3 tools/art/ui_art2.py`; it reproduces identical existing bytes and refuses conflicting replacements. No media inputs, model or new dependency. The source is original coordinate code.

The sole runtime gate is existing `CONFIG.features.originalEconomy` (still false). Disabled helpers render no nodes and request no art. Enabled art decorates Landing, empty Bag, Market and no-material Forge; all frames and offline artwork are available in the explicitly labelled Art samples preview. Existing icons/class/Relic/chapter art remain intact. The sample preview is lazy; individual tiny images load lazily except the flagged Landing illustration. No new flag or ownership state is introduced.

The new owned catalog lives in docs/ui/art. Its generation retains every original inventory, palette, reservation and provenance assertion; docs/art remains untouched. Static preview: [all33 assets](../../../../docs/ui/art/art2.html). It works with file://. Test fixtures enable the existing flag only inside their isolated sidecar bundle, outside production output.

Builder evidence:44 art/pipeline/catalog tests;51 focused + unchanged contrast cases; typecheck, lint, build;7 art/catalog browser cases;2 byte-exact flag-off visual cases. Main340f88b supplied four immutable Landing/Class reference captures at1280×720 and1600×900; all four candidate PNGs match byte-for-byte. Snapshot provenance is in apps/web/e2e/ui/art2-baseline/source.json. An initial local IPv4/localhost capture binding error is retained in the builder log; reference capture succeeded on the preview server's documented localhost binding.

Paint-aware screenshots decode each visible image/atlas, inspect opaque clipped pixels and color diversity, and wait two browser paints before capture. Both common and Rare level6 catalog states are captured; this addresses SYS-UI-006's premature capture risk. No contrast threshold, failed test or assertion was weakened. Initial new-unit matcher API errors were fixed with the repository's existing DOM assertion style before passing typecheck.

The extended pipeline validation passed10 deterministic repeats,8/8 mutation controls, source preservation for148 files and zero new broken links. Fresh A/B scores, locked release and live acceptance are still pending and will be recorded on the UI ledger. This report does not claim live activation of a default-off feature.

Fresh pass A96/B96 on `a9afaadf263593d6849dbbd0934238d4b1289403`: each2533 core,44art,300changed browser,20/20resize,18strict audit views pass; full373per size shared once from A. All1141 prior image blobs unchanged;97owned paths; no critical defect found. Merge/live acceptance parked by SYSTEM auth-nonce502 hold.
