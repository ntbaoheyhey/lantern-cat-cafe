# Manual Fuji wallet test

You control Chrome and Core throughout. SYSTEM screen control remains stopped; only public evidence is needed afterward.

## Before starting

- Open https://taskbarhero-eight.vercel.app in Chrome with Core.
- Select Avalanche Fuji, chain43113. Use only free test AVAX.
- Use two distinct accounts: a seller and a buyer. Both need test AVAX for gas; the buyer also needs the listing price.
- Record the start time, including timezone. Keep keys, seeds and wallet passwords inside your wallet.

The supplied seller address, 0x2Bba9a48F7F79d99154108A28d32f1a21d17055c, had0.57499999978920712FujiAVAX at block60447415. It is also the deployed RelicNFT owner, so it is not established as an isolated throwaway account. This test uses normal game mint/list/buy actions only; it requires no administrative contract action.

## Steps

1. Select the seller in Core. In the game, use Connect wallet, then Sign in. Confirm that the sign-in message belongs to taskbarhero-eight.vercel.app and Fuji43113.
2. Open Forge, then Relic. Use legitimate signed-in game progress to meet the displayed requirements. Guest saves do not establish server mint eligibility. If forging is blocked, record the exact visible reason.
3. Forge the Relic when eligible and mint it through the normal Core prompt. Wait for confirmation and save the public mint transaction hash. An already-issued valid pending voucher may be minted through its normal recovery flow; do not forge a replacement manually.
4. In Market, list one copy of that same Relic for a small positive test-AVAX price, for example0.001. Core may request a market approval transaction first, then the listing transaction. Record the listing hash; retain the approval hash too if available.
5. Switch to the distinct buyer account in Core. Reconnect/sign in if requested, locate the exact listing and buy it. Check the network, listing and price in the wallet prompt. Record the public purchase hash and confirm the item reached the buyer.
6. Send SYSTEM the seller and buyer public addresses, the start time, and the three hashes labelled mint, list and buy. Screenshots of the resulting game states are helpful; exclude private wallet information.

If a step fails or a transaction's status is unclear, stop at that step and provide its visible error or public transaction hash. Do not clear the save, expose a voucher/session token, alter backend data or submit another payment merely to get a passing result.

## Verification and limits

SYSTEM can verify the supplied hashes through public Fuji reads without wallet access. The prepared receipt checker checks contracts, senders, order, canonical blocks, matching mint/list/buy events, payment, transfers and the final buyer balance.

The known returning-guest blank-route defect remains open on live1a1b499. UI reports a local candidate fix at911dec1, still awaiting formal grades and release. A successful manual wallet run does not itself clear that separate UI regression.

[Detailed evidence procedure](WALLET-RUN.md) and [current partial report](REPORT.md).
