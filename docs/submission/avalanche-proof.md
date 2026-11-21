# Verify Lantern Cat Café on Avalanche Fuji

The live game uses Avalanche Fuji C-Chain, chain ID **43113**. The deployment registry lists the five contracts and the README links each to its verified source. [Registry](../../packages/chain/deployments/43113.json) · [Contract table](../../README.md#how-avalanche-is-used)

1. Open the live Chapter 1 mint. The successful transaction targets RelicNFT. Its ERC-1155 transfer issued one Moon Collar (token ID 3) to the guest wallet in block 61,409,492. [Mint receipt](https://testnet.snowtrace.io/tx/0x566fe1355cad0c4b71dcab6daa8c0f23fe94282e7f601d2f16700800ddf47c56)
2. Inspect the separate sale of Moon Collar on RelicMarketV2. Match listing #6 in the listing and purchase events. The purchase transferred one item from escrow to the buyer for 0.001 test AVAX. [List](https://testnet.snowtrace.io/tx/0xf29d14fa20b80ed2a7bd0675d398b7f96ce89a33d28637a537ca109863815396) · [Buy](https://testnet.snowtrace.io/tx/0x119b1df911379c7cf3dda5029c4a8158c25cc22d22d8fca647bb404533a6a455)
3. Inspect the seller’s withdrawal of 0.00095 test AVAX. The run also records the guest funding transaction and final ERC-1155 balances. [Withdrawal](https://testnet.snowtrace.io/tx/0xa92dc46a1f353db779de9b5080f6dc4b18cdf17c3965b26866be1952d28dcf0c) · [Full record](../avalanche/LIVE-E2E.md)
