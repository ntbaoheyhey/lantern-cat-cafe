# Restore a paused battlefield after GPU loss

Native failure injection confirms that both motion modes remain blank after WebGL restores: no fresh draw is scheduled and the reload notice persists. Six measured1280x720captures and two fresh sheets confirm the failure; rules and seven-unit geometry remain unchanged.

The isolated candidate marks the scene dirty on restoration and clears the context-loss notice only after a successful draw. It retains the latest asset/effect preparation failure across loss/restoration, cancels a queued recovery on another loss, and removes the restoration listener during disposal. The existing battle clock, controls, rendering during loss, art and poses are unchanged.

The exact candidate passes35focused tests including nine new recovery regressions and full web typecheck. The candidate01826fc7 now passes six native-event prototype captures with exact full-frame restored RGB in both motion modes, unchanged seven-unit geometry/rules, and two fresh sheet reviews at03:18:13UTC. Two real-event lifecycle runs cover resize/DPR/motion updates, retention of a synthetic resource error, and cleanup during a third loss. The first fixture incorrectly hid the battle without unmounting it; that timeout is preserved. Corrected real navigation proves listener removal and rejection of late callbacks.

The exact candidate is adopted and passes35native tests plus full web typecheck. Untransformed production and ordinary-play validation now pass.

Native production source 9efabfa865f95cb4f020b9a68bba6b9f388356da (after announced m1.12 merge), index 6f27065a021e115c3acec1e7c985d690af7fea26d4bdd6f6248b8ac595bc353d, empty runtime patch, zero transforms. All 3764 artifact files and 13 tool snapshots verify. Both modes recover58GL calls with exact restored full-frame RGB. Two lifecycle runs preserve rules across density/motion changes and resource errors, remove both listeners on real unmount, and reject late callbacks. Two32s DPR2 boss trials each contain26actions/6ultimates, zero errors/blocked requests; frame p95 is16.7/33.4ms at1x/4x CPU. Eight full captures measured; four new images reviewed exactly once at 2026-11-18T03:29:33.882315+00:00.

Scoped READY: application scene.ts plus scene-context.test.ts from172c317d4. Evidence: V7-F-battle-context-native-verified.json and its linked reports. This is local validation; independent CXI acceptance remains pending. The prior lifecycle fixture failure and original blank-restoration evidence remain preserved.
