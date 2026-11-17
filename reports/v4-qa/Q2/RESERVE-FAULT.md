# Independent local sponsor-reserve fault
Target `b1e4398a8844fa51d2784760e92ed24528d13d2b`; guest-drip/chain policy unchanged at pinned SHIP4b4c4111. No public-chain transaction was attempted.

Own Anvil listener6202 identifies as `anvil/v1.8.6`, chain43113, PID13692 under QA supervisor13685. Chain43113 here is a local fixture configuration, not evidence of a public endpoint. The first attempt stopped before mutation on an incorrect31337 expectation; that setup failure is retained separately.

The corrected attempt snapshots the fixture, sets its independently observed sponsor to1.075AVAX, then uses the visible1440×900 UI. Play free, Start trial and Mint trial reward succeed. One Guest funding receipt, one mint and one claimTester receipt are observed. Clicking Fund workshop produces HTTP503 from the local guest-drip endpoint and leaves the button present with **No gas. Open faucet.** It does not reach Seal Epic. Screenshot: `q2-reserve-gap-2/1-1440x900-failure.jpg`; video remains under work/v4qa/q2-reserve-gap-2/videos.

This establishes a local demo-path failure under a balance admitted by the runbook's one-wallet lower bound. It is not a public Fuji failure and does not establish that every possible503is a reserve error. The response body was not captured; receipt events/rendered labels in this fault run were observed, but the catch path did not independently query their RPC status before rollback. Do not call these three fault-run receipts independently RPC-verified.

The broad reserveFailureVisible regex is not the verdict. The verdict rests on controlled balance, the previously completed normal-balance journey, one funding receipt, second guest-drip503and the inspected visible error. The fixture's sponsor balance was independently read after rollback and restored exactly to10,000AVAX; rollbackVerified=true in reserve-fault-reproduction-2.json.

Suggested runbook correction: distinguish next-drip admission from a complete fresh demo. A two-wallet lower bound is1AVAX + pending reservations +2×(0.05AVAX +21,000×gasPrice), with operational headroom. A fresh N-run batch can require2Nwallet grants; account for quotas and already-funded wallets explicitly. The earlier public read lacks unknown pending reservations and must remain conditional.
