# Independently reached on-chain actions
Runtime source `b1e4398a8844fa51d2784760e92ed24528d13d2b`; fresh1440×900 production journey.
18 successful receipts were independently read from owned Anvil RPC; payer and computed fee match the rendered event values.
11 distinct named contract/function pairs plus native guest funding are reachable through the visible UI.
**Public five-action explorer DoD remains unverified.** These are local Anvil transactions; their displayed Snowtrace URLs cannot establish public Fuji receipts.

| Contract | Function/action | Receipt count |
|---|---|---:|
| unknown | `Guest funding` | 2 |
| RelicNFT | `mint` | 4 |
| SeasonRewards | `claimTester` | 2 |
| YarnToken | `transfer` | 1 |
| YarnToken | `seal` | 2 |
| RelicNFT | `safeBatchTransferFrom` | 1 |
| RelicNFT | `setApprovalForAll` | 1 |
| RelicMarketV2 | `list` | 1 |
| YarnToken | `approve` | 1 |
| RelicMarketV2 | `buy` | 1 |
| RelicMarketV2 | `withdraw` | 1 |
| SeasonRewards | `claim` | 1 |

UI path: Play free → Start trial → Mint trial reward → Fund workshop → Seal Epic → Forge Legendary → List for5YARN → Buy with demo wallet → Withdraw Spool → Face the boss → My café on Avalanche.
Each observed transaction had fee, confirmation time, payer label/address tooltip and a hash-based explorer link in the visible toast. Native sponsorship plus both wallet identities are retained in raw evidence.
Raw evidence: `q1-cold-1/results.json`; all locally observed receipts showed successful status, matching payer and matching gasUsed×effectiveGasPrice fee.
