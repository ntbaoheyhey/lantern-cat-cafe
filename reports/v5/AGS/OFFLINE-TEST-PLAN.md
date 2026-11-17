# Web3 & Offline Resilience Test Plan for Integrators (OFFLINE-TEST-PLAN.md)

**Author:** AGS (SHIP Lane - Sound & QA)  
**Date:** 2026-11-17  
**Target:** Integrator (CXI) & Frontend Engineering  
**Application Path:** `apps/web/src/game/cardrpg/chain/`, `apps/web/src/game/errorStates.test.tsx`  
**Purpose:** Ensure bulletproof hackathon demo resilience under hostile network conditions, wallet anomalies, and RPC failures.

---

## 1. Resilience Philosophy: Zero Dead Ends
A hackathon judge will never forgive a blank white screen, an unhandled unhandled promise rejection, or a frozen "Loading..." button. The application must obey three core resilience axioms:
1. **The Game Never Freezes**: All core combat and loop simulations run 100% client-side in memory. Network drops must never pause an ongoing battle.
2. **Deterministic Fallbacks**: Every blockchain call (mint, claim, transfer) has a clean, graceful fallback path (Guest demo mode $\to$ Local state cache $\to$ Retriable queue).
3. **Honest Proof & Telemetry**: If a transaction succeeded on Fuji, show the hash and link to Snowtrace. If running in guest demo mode without on-chain finality, clearly badge it as **"Local Demo Mode (No Gas Used)"** rather than fabricating a fake hash.

---

## 2. Test Matrix: 8 Critical Error & Offline Scenarios

| Scenario ID | Test Case & Trigger | Expected UI / Engine Behavior | Audio Response | Fallback / Recovery Mechanism | Automated Test Reference |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **TC-01** | **No Wallet / Cold Guest**<br>Judge opens demo URL without MetaMask/Core extension. | Instant entry into Café Hub; ephemeral key provisioned in `localStorage` (`GUEST_KEY`). No blocking prompts. | `ui.click` | Full gameplay available; victory receipt badges "Local Demo". Option to connect wallet anytime. | `guest.test.ts` |
| **TC-02** | **User Rejects Signature**<br>User cancels MetaMask prompt (EIP-1193 Error 4001). | Modal closes; non-destructive toast: *"Signature request cancelled by user."* Button resets to active. | `ui.error` | State remains 100% intact; user can click button again to re-attempt. | `FujiProofPanel.test.tsx` |
| **TC-03** | **Wrong Network (Chain != 43113)**<br>Wallet connected to Ethereum (1) or Polygon (137). | Prompt banner: *"Wrong Network. Switch to Avalanche Fuji Testnet (43113)."* 1-click `wallet_switchEthereumChain`. | `ui.error` | Auto-injects Fuji RPC parameters (`https://api.avax-test.network/ext/bc/C/rpc`). Blocks writes until switched. | `guest.ts` (`requireFuji`) |
| **TC-04** | **Avalanche RPC Throttled / 429**<br>Public RPC node times out or rate limits. | Non-blocking warning toast: *"Network busy, retrying..."* Exponential backoff retry (1s, 2s, 4s). | `ui.error` (muted) | Multi-RPC failover pool: publicnode $\to$ ankr $\to$ avax-test. If all fail, queue to local storage. | `indexed-logs.test.ts` |
| **TC-05** | **Gas Sponsor Depleted**<br>Paymaster wallet balance drops below 0.05 AVAX. | UI badges switch from *"Sponsored Gas"* to *"Self-Paid Gas or Free Demo Mode"*. | `ui.confirm` | User can either pay own minimal Fuji gas (~0.00002 AVAX) or proceed with zero gas in local mode. | `GasBalance.test.tsx` |
| **TC-06** | **Mid-Battle Disconnect**<br>Device loses internet connection during Wave 2. | Battle continues with zero interruption. Animations, sound, and card plays operate 100% client-side. | Normal SFX | End-of-battle receipt caches results to `localStorage`. Syncs automatically when `navigator.onLine` fires. | `errorStates.test.tsx` |
| **TC-07** | **Rapid Double-Click Spam**<br>User hammers "Confirm" or "Mint" 5 times in 500 ms. | First click immediately enters disabled pending state with spinner. Subsequent clicks ignored. | 1x `ui.click` | In-flight request lock prevents duplicate transactions and conflicting nonces. | `runtime.test.ts` |
| **TC-08** | **On-Chain Revert**<br>Contract reverts (e.g. claim limit reached, gas limit). | Toast: *"Transaction reverted on Avalanche Fuji: [Reason]"*. Displays Snowtrace link to failed tx. | `ui.error` | Restores unspent resources. Does not deduct in-game currency or burn items. | `receipt-proof.test.ts` |

---

## 3. Step-by-Step QA Execution Runbook (for CXI & Verification)

### Test Run 1: Cold Browser Profile (Pure Guest)
1. Launch Chromium in Incognito mode with disabled extensions:
   `open -na "Google Chrome" --args --incognito "http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3"`
2. Verify:
   - [ ] No MetaMask/wallet error overlays appear.
   - [ ] Hub loads within 2 seconds.
   - [ ] Complete 1 battle.
   - [ ] Victory screen renders with clear distinction: "Local Demo Mode" and "Connect Wallet" CTA.

### Test Run 2: Simulating RPC Outage (Network Throttling)
1. Open Chrome DevTools $\to$ Network tab $\to$ Block request URL:
   Add pattern: `*api.avax-test.network*`
2. Navigate to Relic Minting or Battle Receipt.
3. Verify:
   - [ ] Game does not crash with an uncaught `fetch` error.
   - [ ] Application logs structured fallback notice.
   - [ ] Game progression remains accessible via offline local state.

### Test Run 3: Simulating User Rejection
1. Connect Core Wallet or MetaMask on Fuji.
2. Click "Mint Relic NFT".
3. In the wallet popup, click "Reject" / "Cancel".
4. Verify:
   - [ ] Toast notification reads "Transaction signature cancelled".
   - [ ] `ui.error` plays once.
   - [ ] Mint button returns to enabled state within 300 ms.
   - [ ] Page console shows zero unhandled promise rejections.

---

## 4. Multi-RPC Failover Pool Configuration
Integrators should configure the viem `fallback` transport across the following three independent Fuji RPC endpoints:

```typescript
import { createPublicClient, fallback, http } from 'viem';
import { avalancheFuji } from 'viem/chains';

export const fujiClient = createPublicClient({
  chain: avalancheFuji,
  transport: fallback([
    http('https://api.avax-test.network/ext/bc/C/rpc', { timeout: 4_000 }),
    http('https://avalanche-fuji-c-chain-rpc.publicnode.com', { timeout: 4_000 }),
    http('https://rpc.ankr.com/avalanche_fuji', { timeout: 4_000 })
  ], {
    rank: true,
    retryCount: 3,
    retryDelay: 1000
  })
});
```
