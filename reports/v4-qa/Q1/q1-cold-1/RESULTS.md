# Independent QA journey results
Source: b1e4398a8844fa51d2784760e92ed24528d13d2b; mode: product guest transactions; shared-machine, indicative.

| Run | Verdict | Battle ms | Receipt ms | Clicks | Errors | HTTP/network failures |
|---|---|---:|---:|---:|---:|---:|
| 1-1440x900 | FAIL | 3130 | 102179 | 10 | 0 | 0 |
| 1-1280x720 | FAIL | 2688 | 98563 | 10 | 0 | 0 |
| 1-390x844 | FAIL | 2641 | 95584 | 10 | 0 | 0 |

Read-only runs omit wallet/funding-dependent actions. Local Anvil receipts are not public Fuji evidence.
See results.json for assertions, visual bounds, decoded contract actions, proof and cold-network requests.
