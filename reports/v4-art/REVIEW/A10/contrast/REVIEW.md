# A10 battle-label contrast — scoped checkpoint

Source9205464cb; runtime-contrast-r2.json binds80runtime/art/style hashes. Six real fixture views at1280x720 and1440x900 plus speed/Auto/portrait hover and keyboard focus contain79observed labels. All satisfy the deliberately uniform4.5:1 text threshold. This is development-fixture composition evidence; SHIP production integration is pending.

|Label|Minimum ratio|
|---|---:|
|.b3-auto|7.040958:1|
|.b3-speed|5.958371:1|
|.b3-stars|12.922195:1|
|.b3-statuses b|16.457696:1|
|Overflow +1 status span|13.071725:1|

Dark opaque plaques back portrait stars and status counters. Their foreground colours stay unchanged. Owned hover selectors preserve the existing opaque speed/Auto paint; source-over opacity excludes media under the glyphs. The probe records rendered backing pixels using independent black/white glyph masks, authored foreground, ancestor brightness and unsupported-filter checks. Antialiased edge colours are not substituted for foreground colours.

Retained failures: SHIP originally reported32unknown observations, not failures. Synthetic lab baseline count/stars then failed separately; real r1 hover measured3.4032/3.8159. The empty-style-tag harness error precedes all screenshots. Both design candidates and all failures remain recorded; private comparisons were inspected once. A10 already uses8indexedJPGs, so no additional JPG is staged.

Full regression passed2664tests/318files, typecheck, three-fixture parity and lane audit. All2700selected encoded markers and2799layout900samples pass. All60HUD sheets and three900p layouts were inspected once. Native full-viewport supplements have16/56inspected so far: they confirm real Soot viewport clipping, Yarn boss-bar overlap and Binding toolbar collision; overall film readability is not accepted. Six naturally reached overflow+1 observations pass4.5:1 at720p/900p with minimum13.071725:1, zero browser errors and the same80runtime hashes (runtime-contrast-overflow-r1.json). No rules, clocks, assets, renderer, audio, recorder or production activation changed. Icons, fallen/inactive states and complete WCAG conformance are outside this scoped text result; authoring/measurement time split remains unproven.
