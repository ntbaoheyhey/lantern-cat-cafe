# Current review cold-opening checkpoint
REFERENCE: summary.json; HITCHES.md; trace-attribution.json; *-trace.json.gz

Artifact SHA256 `734d301c5dfc192e6e0a74e03311deff2fde93acd673983724813bec96a7cfec`. Seven fresh-page scenarios with real clicks, RAF and tracing from navigation. Screenshots are disabled. Tracing perturbs timing; this is separate from the still-pending exhaustive cast matrix.

| Size | DPR | CPU | Page MAX ms | After interaction MAX ms | After ready MAX ms | p95 ms |
|---|---:|---:|---:|---:|---:|---:|
| 1280×720 | 1 | 1 | 16.8 | 16.8 | 16.8 | 16.7 |
| 1280×720 | 2 | 1 | 33.4 | 33.4 | 16.8 | 16.8 |
| 1440×900 | 1 | 1 | 16.8 | 16.8 | 16.8 | 16.7 |
| 1440×900 | 2 | 1 | 33.2 | 33.2 | 16.8 | 16.7 |
| 1280×720 | 1 | 4 | 100.0 | 100.0 | 16.8 | 16.8 |
| 1280×720 | 2 | 4 | 150.0 | 150.0 | 16.8 | 16.8 |
| 2560×1440 | 1 | 1 | 33.4 | 33.4 | 16.8 | 16.8 |

Native MAX33.4ms; CPU4 MAX150ms. Whole-page and post-interactive 100ms gates both MISS. CPU4 p95 is16.8ms. All seven scenarios have zero runtime errors. All raw frame arrays and traces remain in this directory. The runner completing successfully means evidence was collected, not that performance gates passed.

## Observed bottleneck and next candidate
REFERENCE: 1280x720-dpr2-cpu4.json; 1280x720-dpr2-cpu4-trace.json.gz; trace-attribution.json; apps/web/src/game/squad/turn3d/{scene,loading}.ts

The worst frame ends at2245.3ms with a150ms delta. Its main-thread click event lasts78.615ms, inside an87.88ms task; another task overlaps33.22ms. CPU leaves include33.07ms in the `warmModels → initTexture` stack,19.70ms in `resizeToHost`,11.43ms in renderer construction,5.79ms in `setSize`, and34.66ms of unattributed program time. These statistical samples and nested tasks are not additive costs. Full source offsets/stacks are retained.

The published code already yields between textures and bounded warmup batches. This trace still places renderer creation, full-size resize and a texture upload within the same long RAF interval. The next candidate is an asynchronous scene initialization that separates context creation, full-size target allocation and first texture upload across independently observed paint opportunities, with cancellation/disposal coverage. That larger lifecycle change has not been implemented or measured; there is no claim it would eliminate the150ms miss. Do not remove this interval from the measurement window.

Loading remains visible:
- CPU1: hub interaction 879.9–890.4ms; battle ready 7019.4–7106.7ms.
- CPU4: hub interaction 1671.5–1743.4ms; battle ready 9570.9–9613.4ms.
