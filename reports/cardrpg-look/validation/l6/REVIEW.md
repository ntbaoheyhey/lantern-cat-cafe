# L6 delivered card-art review

REFERENCE: art-browser/1280-dark.png; art-browser/1280-light.png; ../../rounds/art/selection.json; selected-art-metrics.json

Both complete corrected 12-card browser sheets were personally viewed. Each card has its four delivered skill miniatures; this gallery is a handoff preview, not a claim that A's game screens already use the icons or rarity plates. The old failed gallery and runtime receipts remain in ../l6-pilot-1.

Observed defects and corrections:

1. Original gallery Mochi shield crossed the left plate edge, and tall accessories nearly touched the upper plate. The corrected preview reserves 16 CSS px inside the portrait box. Both corrected sheets show the shield and tall props clear of the plate.
2. Initial runtime navigation requested file:///art/turn3d/alchemist.glb and hit the offline CSP. An actor from the old preview was resolved against the next screen's model map. The source now passes its original SceneView through ensure(); two focused regression cases verify named-model and legacy-role resolution, including cancellation. Full offline navigation acceptance is recorded separately in checks.json.
3. Initial Collection capture after scrolling could contain content-visibility placeholders. The harness now allows two animation frames after restoring the viewport before capture; this changes evidence capture, not A's screen code.
4. Pale whiskers and ear tips lose separation on the light backdrop, especially Clover/Mochi (right column, portrait upper half). Faces and clothes remain readable; the dark backdrop is stronger. This is a remaining art limitation.
5. The inherited nine models retain angular ears and simple costume panels. Brioche/Panko head arcs and Mallow's tall wire form still look detached. These are explicit L5 model tasks; studio lighting does not establish sculpture completion.
6. The 64px miniatures have recognizable cups, bells, leaves, paper and shields; several tiny secondary glyphs remain weak at 1x. Metallic plate ornaments vary by rarity, but the shared rectangular structure is visibly repetitive. Frames are static lighting plates, not dynamic foil.

Fresh-eyes self-review:

- First-time player: faces are visible and the four keepsakes form a clear row; tall inherited hats still compete with faces.
- Art director: cream/teal/plum materials are coherent, with improved rounded hero anatomy. Nine inherited models visibly belong to an older quality tier.
- VFX director: icon material language matches ceramic/paper/yarn effects; baked highlights cannot prove in-game animation quality.
- Three-minute judge: the complete set is reviewable offline, but the preview must not be presented as a fully resculpted roster or integrated invitation UI.

Self-grades for this art delivery: hero portraits 7.5/10; inherited-model portraits 6/10; miniatures 7/10; rarity plates 6.5/10. These are subjective and do not replace runtime checks or measurements.

Actual UI review: personally inspected Collection and Team at 1280/DPR1 and all twelve unscaled portrait crops in portraits-1280-dpr1/all12-actual-size.png. The fresh account correctly grays the nine locked companions and places question badges on them; those overlays are existing screen behavior. Three owned hero faces, equipment and full bodies remain inside their cards. Team text/nav/HUD are legible. The Collection screenshot catches the separate 3D preview's loading state; it proves portrait layout, not that the 3D preview has finished warming. The six size/DPR checks decode all twelve Collection portraits in each mode plus three Team portraits in each mode, preserving account/route/selection on all four toggles per configuration, with zero recorded errors or remote requests.

The separate six-action ready-preview check then completed: Hub→Collection while warming; Mochi→Soot→Clover→Cinnamon; two real Look toggles. Every selected model reached ready with exactly its expected asset and no errors/remote requests. Personally viewed preview-ready/collection-ready.png after warming. It shows the actual rendered miniature, with face/props inside the viewport; the loading placeholder is gone. This closes the observed navigation-load failure on the corrected artifact, without claiming every possible route race was tested.
