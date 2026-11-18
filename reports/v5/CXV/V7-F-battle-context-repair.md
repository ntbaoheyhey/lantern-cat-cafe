# Restore a paused battlefield after GPU loss

Native failure injection confirms that both motion modes remain blank after WebGL restores: no fresh draw is scheduled and the reload notice persists. Six measured1280x720captures and two fresh sheets confirm the failure; rules and seven-unit geometry remain unchanged.

The isolated candidate marks the scene dirty on restoration and clears the context-loss notice only after a successful draw. It retains the latest asset/effect preparation failure across loss/restoration, cancels a queued recovery on another loss, and removes the restoration listener during disposal. The existing battle clock, controls, rendering during loss, art and poses are unchanged.

The exact candidate passes35focused tests including nine new recovery regressions and full web typecheck. The candidate01826fc7 now passes six native-event prototype captures with exact full-frame restored RGB in both motion modes, unchanged seven-unit geometry/rules, and two fresh sheet reviews at03:18:13UTC. Two real-event lifecycle runs cover resize/DPR/motion updates, retention of a synthetic resource error, and cleanup during a third loss. The first fixture incorrectly hid the battle without unmounting it; that timeout is preserved. Corrected real navigation proves listener removal and rejection of late callbacks.

The exact candidate is adopted and passes35native tests plus full web typecheck. Untransformed production and ordinary-play validation remain required before READY.
