# Integrated Feel lab checks
REFERENCE: ../../memory/PROMPT.md lines146–150, screens/checks.json, ../readability/pilot-overflow/failure.log

The integrated source at `644a0fe056e3bdff89a192289cdd3aaa40fe92df` includes the scoped tab, checkbox and range-control fixes. The measured HTML contains 23,925,527 bytes and has SHA-256 `1bd16da4c2699d95b41ba33318c46b86c7bb6870091cebdccf18a7b738f0d768`. The build receipt records runtimeDirty=false.

| Check | Result | Evidence |
| --- | --- | --- |
| All five lab panels reachable through real clicks | PASS at 1024×600, 1280×720 and 1440×900 | screens/checks.json |
| Page, panel and drawer-body horizontal overflow | PASS, 0 px across 21 captures | screens/checks.json |
| Selected/hovered tab text contrast ≥4.5 | PASS, minimum 10.1397 | screens/checks.json |
| Checkbox aligned with its label | PASS, 8 px gap | screens/checks.json |
| Gallery restores the prior account | PASS, 3/3 sizes | screens/checks.json |
| Offline console errors and remote requests | PASS, 0 each | screens/checks.json |
| Gallery captures wait for model geometry | PASS, draw/model guard before the stage capture | ../../../../tools/cardrpg-big/lab-check.mjs |

The prior 380 px gallery body overflowed by 2 px. Resetting full-width control margins reduced the same assertion to 0 px. The failed pilot remains in `pilot-overflow/`. The first screenshot review also identified low-contrast selected tabs and a detached checkbox label. Explicit tab colors and a horizontal control label now pass the browser geometry and contrast checks.

The 1024 gallery-stage and 1280 performance screenshots were inspected visually after capture. The narrower drawer scrolls vertically to its camera controls. The performance overlay occupies stage space while enabled.

The captures exercise controls and include screenshot overhead. Controlled frame timings remain in the separate performance harness. The integrated five-gate run, rare entrance checks and invitation checks continue under the same pinned HTML receipt.
