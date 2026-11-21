# Avalanche in Lantern Café

Verified 16 November 2026. Source IDs resolve to [the source catalog](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/LEARN/sources.json). Network samples are observations, not performance promises.

A guest should play immediately, then see a real relic transaction with its measured wait, AVAX fee, payer and explorer link. Our submitted build uses Fuji C-Chain. A dedicated Lantern Café L1 and verifiable randomness remain roadmap work; neither is deployed by this lane.

## What exists and what we measured

| Observation | Result | Evidence |
|---|---:|---|
| Existing Fuji contracts with bytecode |5/5|[Fuji probe](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S1/fuji-readonly.json)|
| Fuji recent block gaps,20 samples |median 900 ms|S1-PROBE|
| Mainnet C-Chain gaps,20 samples |median 701 ms|[Mainnet probe](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S1/mainnet-readonly.json)|
| Fuji instantaneous gas quote |160 wei/gas|S1-PROBE|
| Mainnet instantaneous gas quote |7,500,000,150 wei/gas|S1-MAINNET-PROBE|
| Ten historical Fuji network receipts |median fee0.000000000012000000AVAX|S1-PROBE; not game/sponsored receipts|
| Ten sequential read calls / one batch of ten |4,247.83 ms /497.00 ms|S1-PROBE; RPC timings only|
| Sponsored game submit-to-receipt timing |not measured|No local sponsor credential configured|

Bytecode presence does not certify deployed source or prove the V4 flow. The five addresses are the committed RelicNFT, RelicMarket v1, YARN, SeasonRewards and RelicMarketV2 deployments. [S1-PROBE]

## Why the chain fits this demo

Accepted Avalanche blocks have finality; the application still waits for execution and a successful receipt. Current documentation distinguishes receipt availability from acceptance and settled-state tags. The toast must time the entire user-visible transaction request, show receipt-derived gas cost and link the actual hash. A network block interval is not that measurement. [S1-EXCHANGE]

Granite activated Fuji 29 October 2025 and mainnet 19 November 2025. ACP226 enables dynamic millisecond block spacing. By this verification date Helicon is active and v1.15.3 is the recommended release, so the pitch must not describe Granite as the latest upgrade. [S1-GRANITE,S1-MAINNET-GRANITE,S1-ACP226,S1-RELEASES]

Cheap confirmations can make ownership moments practical without requiring the guest to acquire gas first. Our method is a browser guest EOA funded by the café's limited drip. Sponsorship and ERC1155 ownership are general EVM techniques; the Avalanche-specific opportunity is pairing C-Chain settlement with a configurable game L1 and native interchain messaging later. The player sees evidence, not an unsupported uniqueness claim. [S1-ERC4337,S1-ICTT; our product design]

ACP176 makes fee targets dynamic. Nansen reports a historical Q2 C-Chain median transaction fee of$0.000014, published5 August 2026. This is useful context, not our November fee quote, mainnet launch budget or a fiat valuation for test AVAX. [S1-ACP176,S1-NANSEN]

## Lantern Café L1 roadmap

An own L1 could use a native YARN-denominated gas asset or sponsored access, with admission and fee policy chosen for the game. Native gas and our current ERC20 YARN are different assets until an explicit mint/bridge design connects them. Prototype locally after submission before making any public deployment claim. [S1-PRECOMPILE,S1-ICTT; our design]

| Configuration | Game purpose |
|---|---|
| TxAllowList |Restrict transaction senders if choosing controlled access|
| ContractDeployerAllowList |Restrict contract deployment|
| NativeMinter |Manage issuance of the L1's native asset|
| FeeManager |Tune gas parameters|
| RewardManager |Choose fee recipient or burn policy|

These precompiles configure an owned L1; the game cannot change Fuji C-Chain policy. A zero-fee design needs a separate spam-control decision. [S1-PRECOMPILE,S1-REWARD-MANAGER]

ACP77's minimum continuous validator fee is512 nAVAX/s:1.327104 AVAX for30 days per validator at the floor. The rate is dynamic above its target, and this calculation excludes hosting, operations and our chosen validator incentives. It is not the whole cost of running a game chain. [S1-ACP77]

ICM supplies interchain messages. ICM contracts/Teleporter provide EVM messaging; ICTT adds home/remote token contracts. A future YARN bridge to C-Chain needs deployed contracts, bidirectional relayers, supply accounting and failure handling. This is roadmap, not part of the present five-contract demo. [S1-ICTT]

DFK Chain uses JEWEL gas to remove a separate gas-asset requirement; Beam uses BEAM as native gas; GUNZ uses GUN and controlled deployment. These precedents show practical configuration choices, without implying our scale or economics match theirs. [S1-DFK,S1-BEAM,S1-GUNZ]

## Services and randomness

AvaCloud's managed gas-relayer setup requires an L1, subscription plan, forwarder and funding. It is not an established free C-Chain replacement for the existing drip. Its Data API documents an unauthenticated6,000 CU/min and1.2M CU/day tier; endpoint cost/availability must be tested before using it for counters. [S1-RELAYER,S1-DATA]

Avalanche lists embedded-wallet partners such as Openfort/Privy. Native EIP7702 set-code transactions are currently unsupported on C-Chain and ACP209 remains Proposed. ERC4337 smart accounts are a different contract-and-bundler approach; replacing the already-built guest wallet before submission adds unnecessary scope. [S1-INTEGRATIONS,S1-ACP209,S1-ERC4337,S1-EXCHANGE; our decision]

Chainlink lists VRFv2.5 on Fuji. After 21 November, an Anvil-only prototype can prove request/fulfillment and published-odds handling before the user decides whether to deploy. Current random outcomes must not be labelled VRF-backed. [S1-VRF; work order]

## What the judge should verify

Open the guest route, finish the battle, seal a relic, then follow the real receipt. Forge/list/buy/Spool should each produce the same time/fee/payer/link evidence, and the wallet's café page should reconcile it. Landing counts must read actual chain state or show an aged last-known value. These are V4 acceptance requirements; S1 has not yet passed those runtime gates.
