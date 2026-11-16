# A11 placement study — preparation, not production acceptance

The retained A10 contrast receipt classifies 42 real defect frames: 37 viewport-clipped status groups, four overlaps with battle HUD, and one global-toolbar overlap. The images remain closed; this study uses their saved observations. A11 delivery filming is still running against unchanged runtime `ae96b7d85`.

## Sources consulted, 16 November 2026 UTC

- [Been, Daiches and Yap, Dynamic Map Labeling (paper)](https://cs.nyu.edu/~visual/home/pub/infovis06.pdf): dynamic labels need temporal consistency; independent placement on changing conflicts can cause distracting appearance/disappearance. Their map algorithm is not a battle-label solution. Inference for this work: compare placement stability across adjacent frames and preserve actor association, rather than evaluating isolated clean rectangles only.
- [W3C CSS Transforms, transform functions](https://www.w3.org/TR/css-transforms-1/#transform-functions): vertical percentage translations depend on the reference-box height. Application: a positive anchor Y does not guarantee a visible label when its transform includes `translateY(-100%)`.
- [MDN getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect): returned geometry includes an element's padding and border and uses viewport-relative coordinates. Application: convert projected canvas anchors to the same coordinate system before constraining visible labels.
- [W3C CSSOM View, element geometry](https://www.w3.org/TR/cssom-view/#dom-element-getboundingclientrect): returned rectangles are snapshots, and the bounding result combines the element's nonempty box fragments. Application: refresh geometry when content changes; explicitly measure overflowing child status rows rather than assuming a fixed parent width includes them.
- [W3C understanding Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): enlarged text should retain content and functionality. Application: do not repair clipping by reducing glyph size or hiding status information. The planned 720p/900p checks are not a 200% text-resize conformance claim.
- [W3C understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): retaining information matters when viewport space changes, with a stated exception for content requiring two-dimensional layout. Application: test both required viewport sizes and keep the scoped game-layout result separate from any full WCAG claim.

## Source diagnosis and planned experiments

`spine/scene.ts` currently overwrites formation-C2 label positions with a minimum Y of 18. `BattleHud.tsx` adds the canvas offset, while `.b3-world` translates by its full height. The clamp does not account for status-row height or occupied HUD rectangles. This explains a plausible mechanism for the saved clipping and overlap defects; a measured replay is still needed to quantify it.

Drill 1 will constrain the actual visible label rectangle to the viewport without shrinking it. Drill 2 will also reserve measured HUD/toolbar regions and protect actor faces, with deterministic candidates close to the owning actor. Both must retain counter content and compare movement over neighboring states. An own experiment and private same-scale comparison remain pending; neither drill is installed in production.

After selection, verify the 42 retained observations, Panko portrait/banner contact, Soot number grouping and 900p wave1 frame111 glow attribution separately. Regression, all three F6 hashes, lane ownership, fresh films and 900p layouts remain mandatory after runtime changes. Process-time percentages remain unproven.

## Own experiment and private comparison

Two DOM-only candidates were run against six naturally advanced fixture states at 720p/900p, with the 100 recorded runtime-source hashes unchanged. Baseline: six clipped status groups and 13 HUD intersections. Viewport-only removed clipping but retained all 13 HUD intersections, so it is rejected. Reserving HUD rectangles, actor faces and already placed labels removed all measured clipping, HUD intersections, face intersections and label-pair intersections in these six states. Label IDs and text were preserved.

All six fresh same-pixel-scale comparison sheets were inspected once. The HUD-aware group stays readable beside Soot head below the toolbar without covering the visible face; overall composition remains recognizable. Large shield-number crowding is unchanged. The selected method is private, with no production installation. Temporal stability, owner association throughout motion and the complete set of 42 retained defects still require validation; these six Soot clipping states do not close Yarn/Binding overlap evidence. See REVIEW/A11/placement-r1/{drills,comparisons,decision}.json.
