# Generated Fuji chain proof sample

**NOT VERIFIED** — live run started `2026-10-31T17:30:29.038Z` (UTC).

The public Fuji RPC confirmed chain 43113, code at both specified addresses, all 22 NFT and 12 market ABI function selectors, NFT owner/signer getters, and the market’s RelicNFT address.

**Event history is NOT VERIFIED.** The public RPC returned HTTP 429 during the full-history scans. No completed event history or hosted player journey is claimed. This is captured live output, not fixture output.

From the repo root:

```sh
node scripts/chain-proof.mjs
```

Exit code: **1**. No wallet, key, deployment, or write transaction was used.

## Human-readable output (stderr)

Fuji chain proof: NOT VERIFIED

| Check | Result | Detail |
| --- | --- | --- |
| Fuji chain id | PASS | 43113 |
| Snapshot block | PASS | 60312845 |
| RelicNFT: code exists | PASS | 14200 bytes |
| RelicNFT: ABI selectors | PASS | 22 ABI function selectors present |
| RelicNFT: owner() | PASS | 0x2Bba9a48F7F79d99154108A28d32f1a21d17055c |
| RelicNFT: signer() | PASS | 0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000 |
| RelicMarket: code exists | PASS | 7713 bytes |
| RelicMarket: ABI selectors | PASS | 12 ABI function selectors present |
| Market uses this RelicNFT | PASS | 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D |
| RelicNFT: recent events | FAIL | RPC rate limited (HTTP 429): Fuji is NOT VERIFIED. Wait for the public endpoint limit to reset, then retry. |
| RelicMarket: recent events | FAIL | RPC rate limited (HTTP 429): Fuji is NOT VERIFIED. Wait for the public endpoint limit to reset, then retry. |

| Contract | Field | Value |
| --- | --- | --- |
| RelicNFT | address | https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D |
| RelicNFT | name | NOT EXPOSED |
| RelicNFT | symbol | NOT EXPOSED |
| RelicNFT | totalSupply | NOT EXPOSED |
| RelicNFT | owner | 0x2Bba9a48F7F79d99154108A28d32f1a21d17055c |
| RelicNFT | signer | 0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000 |
| RelicMarket | address | https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93 |
| RelicMarket | name | NOT EXPOSED |
| RelicMarket | symbol | NOT EXPOSED |
| RelicMarket | totalSupply | NOT EXPOSED |
| RelicMarket | owner | NOT EXPOSED |
| RelicMarket | signer | NOT EXPOSED |

| Contract | Event (category) | Block | Tx hash | Token IDs | Explorer |
| --- | --- | --- | --- | --- | --- |

ERC-1155 has no name(), symbol(), or totalSupply() in this repo ABI; these are reported as NOT EXPOSED, not guessed.

Transfer means TransferSingle/TransferBatch; Sold means Bought. At most 20 logs per category, newest first; fewer means history exhausted.

This read-only snapshot does not prove the deployed web/server configuration, server signer custody, or an end-to-end player session.

## Complete JSON output (stdout)

```json
{
  "status": "NOT VERIFIED",
  "generatedAt": "2026-10-31T17:30:29.038Z",
  "rpc": "https://api.avax-test.network/ext/bc/C/rpc",
  "expectedChainId": 43113,
  "chainId": 43113,
  "block": "60312845",
  "checks": [
    {
      "name": "Fuji chain id",
      "ok": true,
      "detail": 43113
    },
    {
      "name": "Snapshot block",
      "ok": true,
      "detail": "60312845"
    },
    {
      "name": "RelicNFT: code exists",
      "ok": true,
      "detail": "14200 bytes"
    },
    {
      "name": "RelicNFT: ABI selectors",
      "ok": true,
      "detail": "22 ABI function selectors present"
    },
    {
      "name": "RelicNFT: owner()",
      "ok": true,
      "detail": "0x2Bba9a48F7F79d99154108A28d32f1a21d17055c"
    },
    {
      "name": "RelicNFT: signer()",
      "ok": true,
      "detail": "0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000"
    },
    {
      "name": "RelicMarket: code exists",
      "ok": true,
      "detail": "7713 bytes"
    },
    {
      "name": "RelicMarket: ABI selectors",
      "ok": true,
      "detail": "12 ABI function selectors present"
    },
    {
      "name": "Market uses this RelicNFT",
      "ok": true,
      "detail": "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D"
    },
    {
      "name": "RelicNFT: recent events",
      "ok": false,
      "detail": "RPC rate limited (HTTP 429): Fuji is NOT VERIFIED. Wait for the public endpoint limit to reset, then retry."
    },
    {
      "name": "RelicMarket: recent events",
      "ok": false,
      "detail": "RPC rate limited (HTTP 429): Fuji is NOT VERIFIED. Wait for the public endpoint limit to reset, then retry."
    }
  ],
  "contracts": {
    "RelicNFT": {
      "address": "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D",
      "explorer": "https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D",
      "metadata": {
        "name": {
          "status": "NOT EXPOSED",
          "reason": "No zero-argument getter in repo ABI"
        },
        "symbol": {
          "status": "NOT EXPOSED",
          "reason": "No zero-argument getter in repo ABI"
        },
        "totalSupply": {
          "status": "NOT EXPOSED",
          "reason": "No zero-argument getter in repo ABI"
        },
        "owner": {
          "status": "VERIFIED",
          "value": "0x2Bba9a48F7F79d99154108A28d32f1a21d17055c"
        },
        "signer": {
          "status": "VERIFIED",
          "value": "0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000"
        }
      },
      "codeBytes": 14200,
      "selectors": {
        "ok": true,
        "functions": [
          {
            "function": "VOUCHER_TYPEHASH",
            "selector": "0x94739e87",
            "present": true
          },
          {
            "function": "balanceOf",
            "selector": "0x00fdd58e",
            "present": true
          },
          {
            "function": "balanceOfBatch",
            "selector": "0x4e1273f4",
            "present": true
          },
          {
            "function": "cancelNonce",
            "selector": "0xcfdd7aea",
            "present": true
          },
          {
            "function": "eip712Domain",
            "selector": "0x84b0196e",
            "present": true
          },
          {
            "function": "hashVoucher",
            "selector": "0xfb3539f6",
            "present": true
          },
          {
            "function": "isApprovedForAll",
            "selector": "0xe985e9c5",
            "present": true
          },
          {
            "function": "mint",
            "selector": "0x78233658",
            "present": true
          },
          {
            "function": "owner",
            "selector": "0x8da5cb5b",
            "present": true
          },
          {
            "function": "rarityOf",
            "selector": "0xdd3b5f9a",
            "present": true
          },
          {
            "function": "relicExists",
            "selector": "0xc9f84044",
            "present": true
          },
          {
            "function": "renounceOwnership",
            "selector": "0x715018a6",
            "present": true
          },
          {
            "function": "safeBatchTransferFrom",
            "selector": "0x2eb2c2d6",
            "present": true
          },
          {
            "function": "safeTransferFrom",
            "selector": "0xf242432a",
            "present": true
          },
          {
            "function": "setApprovalForAll",
            "selector": "0xa22cb465",
            "present": true
          },
          {
            "function": "setSigner",
            "selector": "0x6c19e783",
            "present": true
          },
          {
            "function": "setURI",
            "selector": "0x02fe5305",
            "present": true
          },
          {
            "function": "signer",
            "selector": "0x238ac933",
            "present": true
          },
          {
            "function": "supportsInterface",
            "selector": "0x01ffc9a7",
            "present": true
          },
          {
            "function": "transferOwnership",
            "selector": "0xf2fde38b",
            "present": true
          },
          {
            "function": "uri",
            "selector": "0x0e89341c",
            "present": true
          },
          {
            "function": "usedNonces",
            "selector": "0x6717e41c",
            "present": true
          }
        ],
        "method": "Every ABI function selector must appear as an opcode-aligned PUSH1–PUSH4 (zero-padded) followed by EQ in runtime code. This is static compatibility evidence, not source or behavior verification; proxies are not resolved."
      }
    },
    "RelicMarket": {
      "address": "0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93",
      "explorer": "https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93",
      "metadata": {
        "name": {
          "status": "NOT EXPOSED",
          "reason": "No zero-argument getter in repo ABI"
        },
        "symbol": {
          "status": "NOT EXPOSED",
          "reason": "No zero-argument getter in repo ABI"
        },
        "totalSupply": {
          "status": "NOT EXPOSED",
          "reason": "No zero-argument getter in repo ABI"
        },
        "owner": {
          "status": "NOT EXPOSED",
          "reason": "No zero-argument getter in repo ABI"
        },
        "signer": {
          "status": "NOT EXPOSED",
          "reason": "No zero-argument getter in repo ABI"
        }
      },
      "codeBytes": 7713,
      "selectors": {
        "ok": true,
        "functions": [
          {
            "function": "activeListingCount",
            "selector": "0x4681a7c6",
            "present": true
          },
          {
            "function": "buy",
            "selector": "0xd96a094a",
            "present": true
          },
          {
            "function": "cancel",
            "selector": "0x40e58ee5",
            "present": true
          },
          {
            "function": "getListing",
            "selector": "0x107a274a",
            "present": true
          },
          {
            "function": "getListings",
            "selector": "0xc4b04518",
            "present": true
          },
          {
            "function": "isActive",
            "selector": "0x82afd23b",
            "present": true
          },
          {
            "function": "list",
            "selector": "0x19aeb490",
            "present": true
          },
          {
            "function": "nextListingId",
            "selector": "0xaaccf1ec",
            "present": true
          },
          {
            "function": "onERC1155BatchReceived",
            "selector": "0xbc197c81",
            "present": true
          },
          {
            "function": "onERC1155Received",
            "selector": "0xf23a6e61",
            "present": true
          },
          {
            "function": "relicNFT",
            "selector": "0x60c9c82b",
            "present": true
          },
          {
            "function": "supportsInterface",
            "selector": "0x01ffc9a7",
            "present": true
          }
        ],
        "method": "Every ABI function selector must appear as an opcode-aligned PUSH1–PUSH4 (zero-padded) followed by EQ in runtime code. This is static compatibility evidence, not source or behavior verification; proxies are not resolved."
      },
      "relicNFT": "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D"
    }
  },
  "limitations": [
    "ERC-1155 has no name(), symbol(), or totalSupply() in this repo ABI; these are reported as NOT EXPOSED, not guessed.",
    "Transfer means TransferSingle/TransferBatch; Sold means Bought. At most 20 logs per category, newest first; fewer means history exhausted.",
    "This read-only snapshot does not prove the deployed web/server configuration, server signer custody, or an end-to-end player session."
  ]
}
```

This snapshot identifies one block and timestamp. NOT EXPOSED means the generated ERC-1155 ABI has no such getter; selector evidence checks compatibility rather than exact deployed source or behavior.

See [Avalanche integration](../docs/avalanche-integration.md) and [CXC1 report](cxc1.md) for source-backed flow, explorer links, commands, verification results, and limits.
