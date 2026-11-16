# Secondary landing panels — 16 November 2026

Question: do the production journey checks establish readability and control coverage for wallet sign-in, Economy/Odds tabs, audio settings and the trailer?

Sources read before product edits:

1. [WCAG 2.2, 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum), formal Recommendation: text needs 4.5:1, or 3:1 at the defined large-text threshold. Unknown image contrast is not a pass.
2. [WAI-ARIA dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): opening moves focus inside, Tab stays inside, Escape closes and focus returns to the invoker.
3. [WHATWG details](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element), formal HTML standard: disclosure content requires opening the details element; collapsed-state inspection omits those controls.
4. [MDN Range.getClientRects](https://developer.mozilla.org/en-US/docs/Web/API/Range/getClientRects): measure text fragments, not only parent boxes.
5. [MDN checkVisibility](https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility): box/opacity/visibility checks do not establish contrast or occlusion.
6. [MDN inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert): inert descendants leave interaction and accessibility navigation; aria-modal alone is not a visibility measurement.
7. Local `ui/audit.mjs`, `observe.mjs`, `keyboard-preflight.mjs`, `ShellPages.tsx`, `Entrance.tsx` and `AudioControls.tsx`: existing journeys and controls provide the explicit state matrix. No generator input or ART runtime source edited.

Measured comparison, production8 (source9278ef4df), `S11/secondary-panels-1.json`:

| Method | Samples | Secondary state samples | Contrast unknowns in new panels |
|---|---:|---:|---:|
| Prior complete-journey DOM audit3 | 26 | 0 | Unmeasured |
| Explicit secondary navigation, two desktop sizes | 34 | 32 | 622 |

The expanded method reached all 17 planned states per viewport, retained both whole-document and panel observations, and found zero clipping candidates, unnamed controls, request failures or browser errors in those samples. All six mixer sliders changed with the keyboard and persisted across reload in both profiles (12/12). Four dialog focus-return cases per size passed. These are initial viewport samples: below-scrollport enhancement content still needs navigation coverage.

Most unknowns are text over image-backed panels; wallet heading additionally uses transparent gradient text/filter, and its primary action has a filled border image. This is insufficient evidence of AA, not a measured assertion that every unknown is unreadable. Try opaque surfaces behind the information groups while retaining decorative scene assets around them. Compare the unchanged baseline against a scoped CSS candidate before modifying production source.

The scoped observer keeps the actual ancestors for opacity/filter and overflow. A controlled fixture retained both an ancestor-effect unknown and clipping (1/1 each); selecting a panel must never erase them. No screenshots used. Whole-product G-UI remains open regardless of this item.

Candidate1 (`S11/secondary-panels-candidate-1.css`) passed all 47 observations in attempts2 and3, including the opened Live ratio disclosure and every scroll position through the enhancement tables. The two profiles reached 18 distinct states each; every sampled foreground/background bound met its threshold (minimum5.407:1; smallest normal-text ratio8.302:1). Contrast unknowns/failures, clipping, unnamed controls, broken images and browser/network errors were zero. Six slider values persisted in both profiles; all dialog-return and scroll-coverage checks passed.

Attempt3 also rejects contrast attribution when text extends outside its opaque background's paint box; a controlled 12px backing fixture stayed unknown (1/1). Baseline1 and candidate2's exact harness/observer are frozen alongside their results. The production patch copies the tested CSS exactly, scoped to sign-in and the three landing information dialogs. Actual rebuilt production evidence is required before closing this item; the injected candidate alone does not establish the shipping result.

Full regression1 completed: server742pass; rules1409pass/two expected failures/11skipped; web2677pass with exactly the same seven ART presentation failures as title-contrast-regression1. Typecheck, three-fixture probe and build exit0. `secondary-panels-regression-comparison-1.json` binds the full failure-list comparison. G-REG and official class parity remain false.

Actual production9 verification (`secondary-panels-4.json`, source2337820ba) passed47/47 samples with no injected CSS:18 distinct states per size plus11 scroll samples. Minimum contrast5.407:1, maximum prose13words, zero unknown/failing contrast, clipped text, unnamed controls, broken images or browser/network errors. Keyboard-preflight4 passed6/6; all12 slider settings persisted. One1024px Economy capture was inspected (`secondary-panels-visual-1.json`). The updated observer also keeps body background propagation conditional on transparent root paint. Global ART/UI and nonvisual audio gates remain open; modal background interaction is a separate unmeasured next check.
