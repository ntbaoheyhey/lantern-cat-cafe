# CHAIN report (in progress)
| Card | State | Evidence | Score |
|---|---|---|---|
| H0 | complete | H0-AUDIT.md; 96 Forge + 2383 web baseline | 9 |
| H1 | complete | guest-wallet.spec.ts; repeated SIWE retains address; no key transmitted | 9 |
| H2 | complete | check-drip.mjs + SQL tests; real 0.05 AVAX/idempotency/recovery | 9 |
| H3 | complete | chain-guest.spec.ts 3 consecutive fresh runs; CI own job | 9 |
| H4 | complete for judge demo | real boss/mint/list/buy/cancel in 13–15s; on-chain bag; history; bot script | 8 |
| H4b–H9 | queued | no completion claim | — |

Proof images: shots/H3-market.png, shots/H3-history.png, shots/H4-mobile.png.
H4 limitation: fixed server-run judge boss is authoritative; ordinary offline campaign saves cannot authorize minting. C2 integration request in REQUESTS-TO-C2.md. On-chain treasures are cosmetic and never set the older combat-bonus field. Public Fuji smoke awaits user deployment. Local transaction hashes do not exist on Snowtrace. History scans a bounded recent window. No real key read or public transaction sent.
