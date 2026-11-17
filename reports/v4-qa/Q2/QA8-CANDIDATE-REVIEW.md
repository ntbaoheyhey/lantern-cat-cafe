# QA-8 independent candidate review — 17 November 2026

**Verdict: candidate preflight PASS; QA-8 remains OPEN on committed SHIP `da3323ba9ce10ababc5519511d40dc9592febfe3`.** The calculator, runbook correction and API message are still uncommitted owner WIP. Their exact hashes and the independent results are in `qa8-candidate-preflight-1.json`; this review does not promote those files to a release or claim a new UI pass.

The actual candidate CLI passed all 14 independent cases, including the reported low balance, exact boundaries, pending obligations, funded-wallet deductions and invalid inputs. No SHIP test harness supplied these verdicts.

| Independent case | Minimum AVAX | Result |
|---|---:|---|
| 1.075 AVAX, one fresh two-wallet run | 1.2084 | Reject; 0.1334 shortfall |
| Exact one-run boundary | 1.2084 | Pass; one wei less rejects |
| Three fresh runs | 1.4252 | Pass budget only |
| Three runs plus 0.10105 pending | 1.52625 | Pass budget only |
| One wallet already funded | 1.1542 | Pass budget only |
| Both funded plus 0.10105 pending | 1.20105 | Pending and floor retained |

The literal runbook argument form also passed with the installed Cast 1.8.6. An isolated HTTP RPC on QA port 6204 returned known balance/gas values; actual `cast balance` and `cast gas-price` outputs fed the actual candidate CLI without normalization. Only `eth_getBalance` and `eth_gasPrice` were requested. The server was closed afterward. No public RPC, transaction, secret, deployment or product file was used or changed by this check.

The candidate is an operator budget check, not a reservation for the whole journey. The guest-drip implementation and SQL are unchanged from the committed target; SQL still reserves each wallet separately. Pending reservations or unrelated usage can change after the read. The revised runbook states that limitation and retains the existing quotas. Three wholly fresh same-IP runs need six grants and cannot fit the unchanged three-wallet/IP/day limit; budget PASS does not override quota.

The source message changes `sponsor_low` to “Café gas is low. Ask the host to refill it.” This is source inspection only. Existing independent negative UI evidence remains `RESERVE-FAULT.md` and `reserve-fault-reproduction-2.json`; no duplicate unchanged-target journey was run.

To close QA-8, SHIP must commit the candidate and identify its release/build SHA. QA must then check the committed CLI and runbook, independently exercise the low-balance UI/error path and a fully funded positive journey, and verify receipts plus rollback on its own local fixture. A batch proof must state pending obligations and quota treatment. Keep the documented operator-preflight scope explicit; no whole-journey atomic-admission claim is supported.

This review is finished and ready for the next owner commit. The main QA queue can continue while QA-8 remains open.
