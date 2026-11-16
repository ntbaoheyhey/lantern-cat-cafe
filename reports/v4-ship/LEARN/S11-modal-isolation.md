# S11 modal background isolation

Learned 2026-11-16 before product edits. Scope: landing wallet and ShellPages dialogs, owned by SHIP. No ART change, transactions, screenshots or image opens.

## Sources and consequences

1. [WHATWG HTML, inert subtrees (formal)](https://html.spec.whatwg.org/multipage/interaction.html#inert-subtrees): inert nodes cannot receive user hit testing or focus and are excluded from accessibility APIs. A modal native dialog makes the rest of its document inert.
2. [W3C APG modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): modal content must isolate interaction and contain keyboard navigation, then return focus appropriately.
3. [MDN inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert): a sibling-tree implementation must cover all background branches; inert styling is not automatic.
4. [MDN showModal](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal): the native modal enters the top layer and isolates its containing document. An open attribute alone is not equivalent.
5. [React useLayoutEffect](https://react.dev/reference/react/useLayoutEffect): setup runs before repaint, cleanup precedes replacement/unmount, and StrictMode exercises a setup/cleanup/setup cycle. Native close and focus return need matching cleanup.
6. [Playwright Mouse](https://playwright.dev/docs/api/class-mouse): coordinate clicks use viewport CSS pixels. Use browser pointer input plus observed state, not dispatchEvent, to test actual hit testing.
7. Local sources: `Entrance.tsx`, `ShellPages.tsx`, `MenuDialogB2.tsx`, `motion-b2.ts`, `AudioControls.tsx`; the existing menu dialog already uses showModal and preserves the modal through its animated exit.

## Measured comparison before build

`S11/modal-isolation-1.json`, production9/source2337820ba, frozen harness `modal-isolation-1.harness.mjs.gz`; Chromium headless, four landing dialogs at each required viewport, eight rows/method. Each row attempts two real background pointer actions, all visible focusable background nodes, and an accessibility-tree check for three background controls.

| Method | Passing rows | Pointer leaks | Programmatic focus leaks | Exposed background AX nodes |
| --- | ---: | ---: | ---: | ---: |
| Existing role/aria-modal + Tab trap | 0/8 | 16/16 | 133 | 24 |
| Raised backdrop z-index | 0/8 | 4/16 | 157 | 24 |
| Inert sibling branches | 8/8 | 0/16 | 0 | 0 |
| Native showModal wrapper | 8/8 | 0/16 | 0 | 0 |

The raised wallet backdrop remains inside the landing stacking context. Visible background-focus sample counts differ because leaked mixer clicks change details state; the exact samples are preserved, so focus counts are descriptive, not a fixed-denominator effect size. Every baseline row leaks focus; both isolation primitives block every sampled background focus. Injected methods establish mechanism behavior, not final shipping layout or acceptance.

Decision: convert these owned panels to native dialogs and pair their lifecycle with showModal/close. This reuses the application's menu convention and covers new background DOM automatically, avoiding a custom sibling-inert restoration/stack manager. Keep Escape cancellation during sign-in busy state, focus return, existing Tab handling and the ShellPages 180ms exit. Preserve panel dimensions and painted styles; move backdrop treatment to ::backdrop. Validate the real committed production build with no injection, including cancellation, exit animation, focus, pointer isolation and the existing contrast/overflow audit. No whole-product accessibility or screen-reader acceptance is implied.

Controlled repeat: `S11/modal-isolation-2.json` retains a harness restoration failure. The mixer summary moves when expanded, so the second coordinate click missed it; reacquiring its bounding box and verifying the original state fixed the harness. Attempt3 completes all 32 rows with the same isolation conclusion. `S11/modal-comparison-1.json` derives the same eight named background controls in every row: current 64/64 focus leaks, raised 64/64, inert 0/64, native 0/64; pointer leaks remain 16/16, 4/16, 0/16, 0/16 respectively. The original varying samples and failed attempt remain preserved.
