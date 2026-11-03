# CXQ1 funded Fuji run — prepared, not executed

Status: **NOT VERIFIED**. The local receipt verifier passed 37 adversarial controls; this does not establish a funded live run. The official faucet observation and owner prerequisite remain in [FUNDING.md](FUNDING.md) and [OPTIONAL-USER-STEPS.md](../../OPTIONAL-USER-STEPS.md).

Use two throwaway accounts in an existing wallet controlled by the owner, on Avalanche Fuji chain43113. Obtain free test AVAX through the supported faucet/login flow. Never share or save a seed/private key in a report, command, environment variable or chat. Do not create a browser-stored Console key for this run.

Record the actual UTC start time before performing these actions. The seller must earn eligible **server** progress through the live game and obtain its legitimate mint authorization. Guest storage cannot establish server eligibility; do not inject progress, manufacture a voucher, deploy a backend, change flags or edit the database.

1. Mint one Relic through the live application's normal wallet flow at NFT `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`. Record the public mint transaction hash after confirmation. Never persist the voucher/signature or raw calldata in evidence.
2. Approve only Market `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93` through the expected wallet prompt, then list one copy of that same Relic for a small positive amount of free test AVAX. Record the public listing transaction hash and displayed amount/price.
3. Switch to the distinct funded buyer account. Buy that exact listing through the normal Market flow. Record the public purchase hash and resulting ownership. Capture the actual UI outcomes separately; no private wallet information belongs in screenshots.
4. After at least one later Fuji block, use the public receipt checker below. The checker cannot send a transaction and does not accept keys, signatures, custom RPC URLs or arbitrary manifest fields.

Create a local JSON manifest with exactly these fields, replacing every placeholder with public data from the run:

```json
{
  "chainId": 43113,
  "startedAt": "2026-11-03T00:00:00Z",
  "seller": "PUBLIC_SELLER_ADDRESS",
  "buyer": "PUBLIC_BUYER_ADDRESS",
  "mint": "PUBLIC_MINT_TRANSACTION_HASH",
  "list": "PUBLIC_LIST_TRANSACTION_HASH",
  "buy": "PUBLIC_BUY_TRANSACTION_HASH"
}
```

The date above is a format example, not an actual run time. Choose new evidence filenames; the verifier refuses to overwrite an existing report.

```sh
node /Users/bao/taskbar-hero-system-ledger/reports/cards/CXQ1-FRESH/verify-wallet-receipts.mjs \
  /Users/bao/taskbar-hero-system-main-cxs2 \
  /ABSOLUTE/PATH/public-wallet-run.json \
  /ABSOLUTE/PATH/new-receipt-proof.json
```

Verification checks Fuji identity, three distinct successful canonical transactions after the stated run start, expected senders/contracts/methods, matching mint/list/buy values, ERC1155 mint/escrow/buyer transfers, paid value, inactive final listing and buyer balance at the purchase block. It rechecks block hashes for reorgs. It retains only public hashes/addresses and a small normalized receipt summary, never transaction input or voucher material. It reports failure without echoing supplied input or RPC payloads.

Receipt success proves those public chain events. UI operation, throwaway-wallet custody, server eligibility and a fresh live journey still require their separate evidence; do not replace them with historical transactions or local fixtures. If funding/login/eligibility is unavailable, keep the run pending and continue independent work.
