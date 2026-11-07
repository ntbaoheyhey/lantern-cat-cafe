# Persistent preview — measured changes
REFERENCE: memory/PROMPT.md WAITING-L1 item1; tools/cardrpg-big/ui-hitch-check.mjs; ui-preview-check.mjs

Source f3fbaeb9. Before f1234525; after 15b97507d4f34092ca3d80b5df3b5bcef49fd5c6e053e5e5b23ea8275db79fa0 (24,027,200bytes). One sample/CPU from cold file open with real clicks; no captures. This is a partial hitch fix: CPU4 cold peak remains over100ms.

|Screen/action|CPU1 before→after max ms|CPU4 before→after max ms|CPU4 after >25 / >50|
|---|---:|---:|---:|
|cold-hub|33.3→33.3|116.6→116.5|7 / 3|
|fixture-settings|33.3→16.8|50.0→50.0|1 / 0|
|hub|16.8→16.8|49.9→16.8|0 / 0|
|team|16.8→16.8|16.8→33.3|1 / 0|
|collection|16.8→16.8|50.0→50.0|1 / 0|
|equipment|16.8→16.8|50.0→33.2|1 / 0|
|invitations|16.8→16.8|50.1→50.0|1 / 0|
|one-pull|16.8→16.8|16.8→16.8|0 / 0|
|ten-pull|16.8→16.8|33.3→16.8|0 / 0|
|return-hub|16.8→16.8|66.7→16.8|0 / 0|
|route-map|16.8→16.8|16.8→16.8|0 / 0|
|prepare|16.8→16.8|16.8→16.8|0 / 0|
|fight|16.8→16.8|50.0→50.1|8 / 1|
|result|16.8→16.8|16.8→16.8|0 / 0|
|rewards-map|16.8→16.8|16.8→16.8|0 / 0|

Preview creations6→1 bothCPUs;CPU1 MAX33.3→33.3ms, >25frames2→1;CPU4 MAX116.6→116.5ms, >25frames36→20, >50frames5→4. All measured post-cold transitions/reveals meet respective50/100ms limits; coldCPU4 FAIL remains. Raw arrays and initial116.6/diagnostic200ms receipts are preserved. Constructor76.346ms and stage84.111ms trace REQUEST sentB(sync5e2cd90f), no engine files changed byA.

Deferred initialization follows two paint opportunities then idle. One app-owned renderer moves between lightweight slots; UI updates do not own its canvas. Scene destroyed on app-unmount/Look change only. Hover/focus model loads are queued across idle boundaries; engine decode/upload internals remainB-owned. ResizeObserver caches reveal clearance, scrolling occurs after paint; offscreen card grids use content-visibility. Existing foil remainsCSS.

Lean functional: three sizes1280×720,1024×600,1440×900;5screenshots/size;one/tenpulls,selection,4gearslots,auto-fight/result/map,liveLooktoggle/account equality;zeroerrors/remote/overflow. 1280contactsheet actuallyreviewed: no blankcanvas; smallportrait/lowcontrols/layoutcomplaintsremain.

Default startup11JS/3,522,500bytes/686modules matchesL0 counts/bytes;0Three/modelmodules/requests,0errors. Freshweb1732/rules1020units,typecheck/lint/buildPASS. E2E420PASS/1page.gototimeout; exact failed case rerun1PASS without sourcechanges. Originalfailure+recovery receipts retained (validation/e2e-recovery.json). Five gates accepted with this explicit recovered E2E miss; no421-in-one-runclaim.
