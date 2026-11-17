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

## Temporal replay rejects the static choice

Semantic key/id/elapsed replay sampled304states around42retained frames at720p/900p. All measured candidate intersections were zero and text/IDs stayed intact, but a stable-text relative offset changed82.26px between adjacent encoded samples. The narrow gap between HUD and Soot face disappears, causing an abrupt sideways relocation. Only38/42 original failure classes reproduced at720p and35/42at900p; the other original failures are retained. No image was reopened and no production correction installed. Next private method: consistent actor-relative side lanes, followed by retaining the prior relative placement while feasible. R1 paused-start and R2 reused-action-ID harness failures remain saved.

## Banner and number follow-up: private preparation, 2026-11-16T23:40:22.434696+00:00

The six sources above continue to guide this A11 subproblem: measure actual DOM boxes including padding/borders, keep text content and size, and hold a chosen location over an action. Current focusBannerBox assumes38px height, and its caller protects actor/body/status rectangles without explicitly reserving the portrait HUD. These are candidate causes, not yet a measured reproduction. Two private drills will compare vertical HUD clearance with a measured-size obstacle search held for each action, at the first/middle/last recorded focus sample across all16 ultimates at720/900. Both keep the source runtime unchanged; production adoption requires fresh same-scale comparison and the existing gates.

An offline check of all900 encoded wave3 frames from V4-A11-PLACEMENT-R1 found zero pairwise intersections among recorded number ink rectangles. That does not accept readability or target association: retained shield/result density is a composition problem even when rectangles do not overlap. This observation does not justify reducing text size or hiding values; any number redesign still needs private comparison.

The96-state private banner experiment reproduced45 title/HUD intersections. Vertical correction removed HUD contact but introduced8 face-hit samples,45 body-hit samples and9 label-hit samples. The obstacle search had zero sampled intersections and no text loss, yet all four fresh comparisons placed Panko’s title beneath Clover, weakening caster association. Both candidates are rejected in REVIEW/A11/banner-r1/decision.json. Next design must carry explicit caster identity; numeric empty space is insufficient. No production banner change was installed.

## Caster-identified banner design, 17 November 2026 UTC

After two rejected placement-only attempts, drills3/4 change the caption content hierarchy. Drill3 retains the source16px skill text and adds the caster name inline. Drill4 pairs an existing36px portrait with separate caster/skill rows at the same16px glyph size. Both measure the rendered box, reserve HUD/body/face/status rectangles and hold the chosen position for the action. No new artwork, skill renaming, text shrinking or hidden values. The six cited sources and retained96-state experiment motivate temporal consistency and measured geometry; explicit naming is our design inference, not an accessibility conformance claim.

Private comparison will cover all16recorded ultimates at720/900 and eight fresh same-scale sheets spanning Panko, Soot and Needle Moth. Each baseline DOM style/content is restored before the next sampled state. Portrait decode, full skill text, identity text, font size, clipping and intersections are recorded. Runtime source hashes remain fixed; failure of these two further attempts requires a different method, not relaxed gates.

The96-state identity experiment completed with zero measured HUD/face/body/status intersections, clipping, text/font loss or portrait-decode failures for both candidates. Eight fresh comparisons were inspected once. Inline-only remains visually like a neighboring actor label; the portrait/owner/skill hierarchy is selected privately because its matching thumbnail makes the owner explicit. Spatial detachment remains, and user blind association is not established. Dense focus-sample replay must precede production; no runtime change yet. See REVIEW/A11/banner-r2/{drills,comparisons,decision}.json.

Dense follow-up sampled all554available encoded focus states across the three captures at720/900. The selected portrait caption had zero measured intersections, clipping, text/identity loss or position delta within each action, with102runtimehashes unchanged. The final bossPanko focus reaches the capture boundary and cannot prove its uncaptured end. This is the pre-install temporal selection evidence, not continuous or full-film acceptance; see banner-r2/temporal-assessment-r1.json.
