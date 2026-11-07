# Focus stage and studio controls
REFERENCE: tools/cardrpg-big2/{ReviewStudio.tsx,studio.css,studio-check.mjs,gallery-controls-check.mjs}; checks.json; ../studio-corrected2/checks.json

The Focus stage button hides the selectors and tabs while keeping Play preview, sound and return controls reachable. Three desktop sizes preserve the same model, selected action, camera and animation position. Returning restores the selectors.

| Viewport | Full controls stage height | Focus stage height |
|---|---:|---:|
|1280×720|276.4px|476.9px|
|1440×900|519.9px|656.9px|
|1024×600|189.4px|390.9px|

All views fit within the viewport. Checkboxes measure17px with8px caption gaps. Selected-tab contrast is8.50. The studio functional receipt covers25 units,86 actions×3 sizes,258 actual action selections and scrubs, sound/mute/volume, three cameras, comparisons, checklist navigation and account restoration. Runtime errors and remote requests are zero.

The first studio failure retained focus on the slider across Playwright selectOption calls. Its input stayed0.459 while the next action reset to0. The corrected driver focuses the select and waits for the normal RAF synchronization. A later strict-selector failure matched both the sidebar and studio Before / after buttons. The corrected selector uses the Review panels navigation. Original logs, screenshots and receipts remain in sound-studio, studio-diagnostic and studio-corrected.
