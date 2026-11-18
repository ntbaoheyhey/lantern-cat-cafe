# Victory canvas follows desktop density

VictoryCrew fixed its backing density at construction, so DPR1→2/1.5 left the cats rendered at the old buffer size even after container resize. The native repair checks the current capped density before drawing and rearms a resolution media query after each change. Reduced motion requests one frame only when effective density changes; unchanged cap, idle state and disposal schedule none. The existing 1.5× cap, actor poses, art and CSS layout remain the same.

Evidence before native adoption: unchanged production reproduced four stale buffers; eight captures measured, two sheets reviewed once. A retained-page prototype then matched sixteen complete 1280×720 RGB control pairs and sixteen actor/layout sets over two initial densities and both motion preferences. The native renderer API control uses the same buffer history. Four lifecycle probes verified event coalescing and ignored late callbacks. Thirty-two captures were measured; four fresh sheets reviewed once.

The first prototype failed the zero-blocked-request gate because the generic development fixture blocked existing Google Fonts CSS. Its raw failure is retained. The successful retry allows only GET requests to the page's existing font origins; no pixel tolerance or geometry exclusion was added. Synthetic resolution events exercise reduced-mode handlers because CDP did not deliver native media events; physical multi-monitor delivery is untested.

Nineteen focused native tests pass and the complete web TypeScript check reports zero diagnostics. The applied source is the preserved candidate with only constant-true guard expressions removed; browser prototype override code is unchanged by that normalization. Native production transition and ordinary DPR2 CPU1×/4× trials are next. Independent judge acceptance is pending.

Reports: V7-E-victory-density-probe.json, V7-E-victory-density-prototype.json, V7-E-victory-density-tests.json, V7-E-victory-density-types.json. Exact URL/source/runtime patches/capture UTC and raw hashes are recorded in those reports. Fresh artifact evidence will be added after its serial capture job finishes.
