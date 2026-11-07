# Invitation result visibility
REFERENCE: ../../memory/PROMPT.md lines136–150, invitations-v5/checks.json, fixed-v5/checks.json, dependency-rebuild.json

The original 1024×600 result extended to 692.09375 px. The ceremony now uses a side-by-side model/card layout on short screens, and the completed invitation list scrolls below the persistent odds and pity summary. Compact headings and captions preserve the entire first earned card.

| Measurement at 1024×600 | Corrected value |
| --- | ---: |
| Welcome / ten-pull first result bottom | 599.375 px |
| Legendary card bottom | 570.015625 px |
| Epic card bottom | 566.015625 px |
| View results action bottom | 582.9375 px |
| Document horizontal overflow | 0 px |

Four invitation configurations produced 36 captures; eight epic/legendary cases produced 32 captures. All use fresh pages at 1024×600, 1280×720, 1440×900, plus 1280×720 CPU4. The result guard checks the full card and action, not only the canvas. Images finish decoding before screenshots. These functional captures carry screenshot overhead and are not performance measurements.

## Artifact and source gates
REFERENCE: ../../../docs/cardrpg3/build.json, ../../validation/reveal-fit-v7.json, dependency-pilot/

Runtime source 9db6b57e; offline HTML SHA-256 `419fc50dc6d9ce518d9a847807cf6f35b8d7bf3f830ef2ffb8671bc979655d95`, 23,377,025 bytes. Restoring worktree-local dependencies produced byte-identical HTML and 26 passing focused tests. V5's three unit failures came from cross-worktree configuration identity; V7 passes all 1,722 web and 1,020 rules tests. V5 E2E was interrupted (238 passed, 30 failed, 4 interrupted, 149 not run), and V6 unit tests were terminated with exit143. Both failed runs remain retained. V7 passes all five gates, including 421 E2E tests.

## Visual follow-up
REFERENCE: fixed-v5/1024-cpu1-legendary-settled.png, ../../FRESH-EYES.md

The retained legendary capture exposes a separate floating Feel lab button over the role label. Integration source e43dca84 places the home button in the header. Seven focused tests pass; integrated browser verification is pending. The invitation result dimensions above remain measurements of this source checkpoint.
