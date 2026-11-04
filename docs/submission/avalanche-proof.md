# Avalanche integration proof — DRAFT, one-page review guide

**Network: Avalanche Fuji, chain ID 43113. Test assets only.** Local frontend candidate `1eefc3e` is separate from live baseline `340f88b`. This page supplies a read-only verification path; it is not a fresh transaction receipt or a deployed-source audit.

| Boundary | Implementation / evidence |
| --- | --- |
| On-chain Relics | ERC-1155 RelicNFT: [`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`](https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D/contract). EIP-712 voucher mint binds intended caller, chain, contract, nonce and expiry. |
| On-chain market | RelicMarket: [`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`](https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93/contract). Fixed-price ERC-1155 escrow trades use test AVAX. |
| Off-chain play | Combat, idle rewards, ordinary gear and crafting. Guest saves are editable browser data. Authenticated progress is server-owned; neither guest balances nor sample previews certify ownership. No separate ERC-20 game currency. |
| Evidence | Public proof panel reads contract code, Market→NFT linkage, active listings and bounded recent events. Local voucher/replay/recovery tests support source claims. See [security overview](../security-overview.md). |

## Verify in 60 seconds, without a wallet

1. **0–15s:** Open [the live site](https://taskbarhero-eight.vercel.app), enter guest play and open Help → On-chain proof. Check that the panel identifies Fuji 43113 and the two exact addresses above. This observes the currently deployed frontend, not automatically the local candidate.
2. **15–35s:** Run the public read-only check. Inspect code presence, configured Market→NFT linkage and the displayed status/time. An RPC error means unavailable evidence; do not treat a cached or mocked green state as a current chain read.
3. **35–50s:** Follow an explorer link and compare the complete address and network. Read the actual event window/listings reported, including an empty result.
4. **50–60s:** State the limits: code presence is not verified source equivalence; bounded events are not lifetime supply; a read does not demonstrate a mint/list/buy. RelicNFT has no totalSupply getter.

**Still unverified in this packet:** fresh throwaway-wallet mint/list/buy receipts, exact deployed backend bundle and production policy enforcement. No wallet signature, transaction, contract deployment, backend deployment or live write was performed for SINGLE2. Complete deployed-function backup and local restore rehearsal remain required before backend changes or #244. [Release status and receipt links](../release-status.md).
