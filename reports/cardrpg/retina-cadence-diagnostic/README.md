# Additional cadence diagnostic

Artifact 4534b9951e2b4f27c44b55e1a8131800a4caad0bf976d4bc2c4c9b842a302772. This separate instrumented repetition does not replace lifecycle-retina-delivery/measurement.json. No source or quality override is applied. CPU render duration excludes other browser work; asynchronous GPU timer samples exclude browser composition.

Reproduce from the integration checkout:

```sh
CARDRPG_DPR=2 CARDRPG_WIDTHS='[[1440,900]]' CARDRPG_PERF_OUT=reports/cardrpg/retina-cadence-repeat CARDRPG_PROFILE=1 CARDRPG_CADENCE_PROBE=1 node tools/cardrpg-demo/lifecycle-performance.mjs
```

Raw render samples are in cadence-1440.json; the CPU sampling profile and full-campaign RAF intervals are retained beside it. summary.json uses sorted samples at floor((N-1)*q), with no threshold rounding. This repetition keeps Medium, but does not establish the cause of the prior intermittent 33.3 ms tail or guarantee it cannot recur.

REFERENCE: docs/cardrpg/index.html; tools/cardrpg-demo/cadence-probe.mjs; reports/cardrpg/lifecycle-retina-delivery/measurement.json.
