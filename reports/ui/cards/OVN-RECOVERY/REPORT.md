# Overnight session recovery and keyboard repair

Frozen head `afd06992b05b4c98a15c77ec4903166ef892b0f1`, based on accepted FIRSTPLAY `7d0d08e`. Self-graded (fresh pass) A95/B95. Release remains parked under the deployment quota hold.

The existing session-expiry notice now appears as a persistent polite status on class selection and guest screens. Fresh and saved-guest 401 recovery preserves the guest run and keeps all text visible at both desktop sizes. The class confirmation focuses Confirm, supports Escape and Cancel with focus return, and exposes its expanded state and controlled region. Navigation avoids stealing focus already inside the destination.

A passed 16 commands and B passed 14 commands in a clean detached checkout of the exact head, with tests before diff review. Each passed 1,455 web units, typecheck, lint, build, art checks, 33 changed browser executions per size with repeat-each=3, 20 resize executions, 18 strict audit views and 28 pinned axe scans. A alone ran the full browser matrix once per size, 391/391 each. Supplemental native recovery review adds six axe scans per reviewer and verifies keyboard Enter, Escape and focus return. No confirmed violations, clipping, overflow or unexpected errors.

The original keyboard reproducer failed before repair. The initial builder exposed a delayed navigation animation-frame focus race at 1600px. Both failures and logs remain available. Corrected builder passed 100 targeted executions, followed by these fresh gates. No timeout or assertion threshold changed.

All four changed paths belong to UI. Both reviewers confirmed 1,141 original image blobs unchanged, additive public assets and append-only provenance. Cumulative scope is UI-only. The PR must be refreshed under the merge lock after its parent reaches main.

Native recovery evidence is in [review A](../OVN-U3/expiry-keyboard-a/review.json) and [review B](../OVN-U3/expiry-keyboard-b/review.json). Raw command receipts are linked from [grade A](grade-a.json) and [grade B](grade-b.json).
