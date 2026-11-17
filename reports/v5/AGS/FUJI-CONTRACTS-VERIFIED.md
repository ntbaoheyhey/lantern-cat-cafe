# Avalanche Fuji Testnet Contract Verification (REFILL-R12)

**Audit Date**: 2026-11-17  
**Chain ID**: `43113` (Avalanche Fuji C-Chain)  
**Verified Block**: `61,223,309`  
**RPC Endpoint**: `https://api.avax-test.network/ext/bc/C/rpc` (Latency: 442 ms)  
**Verification Method**: Zero-key, read-only JSON-RPC queries (`eth_getCode`, `eth_call`)  

---

## 1. Verified Contract Deployments

| Contract | Role | Fuji Address | Bytecode Size | On-Chain State / Metadata | Snowtrace Link | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **RelicMarket** | Legacy Escrow | `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93` | 7,713 B | Escrow & Trade Settlement Logic | [View on Snowtrace](https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93) | **VERIFIED** |
| **RelicNFT** | Items & Vouchers | `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D` | 14,200 B | ERC-1155 Multi-Token Standard (`0xd9b67a26` verified) | [View on Snowtrace](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) | **VERIFIED** |
| **YarnToken** | Utility Token | `0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b` | 8,352 B | ERC-20: **YARN (Fuji Testnet)** (`YARN`), Decimals: 18, Supply: 999,999,997 YARN | [View on Snowtrace](https://testnet.snowtrace.io/address/0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b) | **VERIFIED** |
| **RelicMarketV2** | AVAX/YARN Market | `0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4` | 11,477 B | Escrow & Trade Settlement Logic | [View on Snowtrace](https://testnet.snowtrace.io/address/0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4) | **VERIFIED** |
| **SeasonRewards** | Seasonal Claims | `0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11` | 10,585 B | Signed Voucher Reward Claims | [View on Snowtrace](https://testnet.snowtrace.io/address/0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11) | **VERIFIED** |

---

## 2. Technical Evidence & Bytecode Proof

1. **RelicNFT (`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`)**:
   - Bytecode Size: **14,200 bytes**
   - Implements ERC-1155 interface `0xd9b67a26` (verified via `supportsInterface`).
   - Handles multi-tier relic minting from cryptographically signed server vouchers.

2. **YarnToken (`0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b`)**:
   - Bytecode Size: **8,352 bytes**
   - ERC-20 Token: **YARN (Fuji Testnet)** (`YARN`)
   - Decimals: **18**
   - Total Supply: **999,999,997 YARN**

3. **RelicMarketV2 (`0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4`)**:
   - Bytecode Size: **11,477 bytes**
   - Supports atomic AVAX and YARN trade settlement with seller proceeds and market burn mechanisms.

4. **SeasonRewards (`0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11`)**:
   - Bytecode Size: **10,585 bytes**
   - Manages bounded seasonal reward distributions with nonce tracking to prevent replay attacks.

5. **RelicMarket (Legacy) (`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`)**:
   - Bytecode Size: **7,713 bytes**
   - Retained for backwards compatibility with earlier milestone test escrows.

---

## 3. Judge Quick-Check One-Liner

Judges can independently verify all 5 contracts from any terminal without wallet or keys:

```sh
node tools/v5audio/verify_fuji_contracts.mjs
```
