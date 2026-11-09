# L7 cold-open diagnostic

REFERENCE: cold-diagnosis.json; cold-batch-1/1280x720-dpr1-cpu4.json; cold-batch-1/1280x720-dpr2-cpu4.json

The CPU4/DPR1 worst133.4ms frame ends at2084.7ms, before hub-interactive2230.1ms and fight-click2466.9ms. The corresponding long animation frame includes a102.9ms MessagePort callback and58.4ms forced style/layout. CPU4/DPR2 has the same pre-hub pattern:116.7ms worst frame,100.7ms callback,55.9ms forced style/layout. These durations overlap and must not be added together.

This locates the largest measured stall before the battle is requested. It does not prove which source component causes it: the captured callback is minified D and no source mapping is asserted. The next targeted fix should profile initial hub DOM/style/layout and split costly initialization, then compare equivalent cold samples. Do not attribute this pre-hub stall to active VFX. Exact startup byte parity also remains+93bytes despite unchanged module membership.

No source edits or new measurements were made for this diagnostic. The original traces and raw arrays remain intact; the JSON binds the two analyzed files by SHA256.
