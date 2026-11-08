# Original E2E failure retained

The first source suite passes 420/421. The unchanged Squad storage/network test times out while waiting for the run-time label to reach 3.x seconds; the label remains 0.1s. The three specialty runtime files are outside the Squad code path. The captured failure and Playwright last-run selection are retained. No root-cause claim or product/test fix is made.

Run only the last failed case with one worker on the unchanged runtime, preserving the original suite log. A pass establishes 420 original plus one retry, not an all-green original run. Do not rerun the other 420 cases. Build continues after the bounded retry. If it fails again, retain the second failure and investigate before another attempt.
