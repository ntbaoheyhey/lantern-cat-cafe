# C-Chain now, optional Avalanche L1 later

Testnet — no real value. Current scope is Fuji C-Chain, chain ID 43113. No L1 code or deployment.

## Why C-Chain now
Existing RelicNFT and RelicMarket already live there. One SIWE address, one AVAX drip, one explorer and one RPC keep a judge's first loop short. YARN/V2/rewards use the same state atomically. An L1 would add validators, gas funding, bridging and additional wallet switching before this demo has demand. GUNZ is evidence that an L1 is possible, not evidence that this game needs one ([E7](TOKENOMICS-RESEARCH.md)).

## Conditions before considering a move
Measure sustained load, latency, per-player gas and custody risk. Require an authoritative campaign ledger, security review, operational funding and legal approval for any commercial economy. Prove that dedicated blockspace or fee policy materially improves service. Do not bridge merely to add an architecture slide.

## Proposed migration
1. Select an EVM-compatible Avalanche L1; use YARN as its native gas asset. Continue a fixed aggregate supply: never mint a second uncapped genesis allocation. Keep testnet and any later production denomination distinct.
2. Use Avalanche Interchain Messaging and Interchain Token Transfer home/remote contracts for YARN. Lock backing on the home C-Chain before minting remote representations; remote burns/releases return backed YARN. Test native-gas conversion, fee reserves, rate limits, replay and failed-message recovery. Source: [ICTT overview](https://build.avax.network/docs/cross-chain/interchain-token-transfer/overview), read 2026-11-12.
3. **Stock ICTT is ERC-20/native, not ERC-1155.** Relics need separately audited ICM escrow/message adapters preserving collection identity, ID, rarity, quantity and global mint nonces. Lock original NFTs before remote mint; remote burn before release. Keep proof of custody and supply reconciliation public. Never claim the existing NFT is automatically portable.
4. Offer voluntary migration. Freeze only a player's inventory while their bridge transfer is pending; keep offline play. Market escrow must be cancelled/withdrawn before bridging. Preserve original Fuji addresses and records as testnet history.
5. Pilot multiple independent validator operators (provisional target five across regions/providers), with uptime monitoring, signing-key isolation, upgrade quorum, incident drills and funded native validation/ICM fees. Choose actual count/stake/permission model after reviewing current Avalanche requirements; five is a proposed governance target, not a protocol requirement.
6. Multisig-controlled upgrades and timelocks, independent reviews of bridge/token/gas contracts, public supply dashboards and staged limits precede wider access. Signer rotation alone cannot secure a bridge.

## Explicit non-goals
No new L1 now, no mainnet, no claims that validators are free, no promise that gas-token demand creates value. Initial demo and user deployment commands remain on Fuji C-Chain.
