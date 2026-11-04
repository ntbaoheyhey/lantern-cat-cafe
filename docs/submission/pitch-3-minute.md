# Three-minute pitch — DRAFT, not submitted

Target: about 411 spoken words plus screen changes. Rehearse with the actual recording before claiming a three-minute runtime. The screen recording must identify local candidate `1eefc3e` or the subsequently verified live release. Do not mix their evidence.

## 0:00–0:25 — Problem and promise (Impact 15, Creativity 15)

Taskbar Hero is a desktop idle RPG starring a cat adventurer. We want the first experience to be a game: choose a class, watch the cat fight, and understand the next goal. You can start as a guest without connecting a wallet. Progress and rewards arrive through ordinary play. We have no adoption or retention figures to claim yet; this is a working prototype with a measurable first-play path.

## 0:25–1:00 — Play and interface (UI/UX + Demo 10)

The persistent navigation connects Home, Bag, Map, Forge, Market, Hero and Help. Bag separates equipment from its details. Forge explains requirements and unavailable actions. A fresh guest's first natural reward is expected within 36 seconds; show the uninterrupted measured run rather than inventing progress. Keyboard users can enter and cancel confirmations and recover focus. Reduced motion preserves the same outcomes. Rune, skill and companion previews are explicitly samples, with their feature flag off by default.

## 1:00–1:40 — Why Avalanche (Avalanche Integration 25)

Everyday combat and crafting run off-chain. Relics are the optional on-chain boundary: an ERC-1155 contract on Avalanche Fuji accepts EIP-712 mint vouchers bound to the intended player, chain, contract, nonce and expiry. A second contract holds Relics in escrow for fixed-price trades in test AVAX. This prototype uses Fuji, chain 43113, and makes no mainnet claim. Help exposes read-only code, linkage and recent-event checks so a reviewer can inspect the integration without signing. Those reads do not prove a new mint, listing or purchase; fresh wallet receipts remain a separate owner task.

## 1:40–2:20 — Engineering and trust (Technical 25)

Guest data lives in the browser and is not trusted as server progress or NFT ownership. Authenticated play uses server-owned state, shared deterministic rules and tested request boundaries. Local tests cover voucher replay, row access, request limits, recovery and concurrent spending. The integrated candidate combines the held frontend repairs and has exact-commit receipts at two desktop sizes. Explain the final receipt's actual results, including inherited skips, rather than presenting historical test counts as current. A local passing build is not certification of deployed backend source or policies.

## 2:20–3:00 — Evidence, limits and next step (Pitch 10)

The gallery distinguishes the local candidate, historical captures and the live baseline. Wallet service failure keeps guest play available; expired sessions explain what happened. Deployment is held until account capacity is verified. Backend changes also need a complete supported backup and a successful restore rehearsal. We are preparing a reviewable release, not claiming those steps have happened. Our next milestone is a verified live demonstration and a fresh throwaway Fuji transaction journey. The goal is a cozy game whose optional blockchain boundary is visible, understandable and independently inspectable.

Evidence: [release identity and exact receipts](../release-status.md), [90-second shot list](shot-list-90-second.md), [Fuji proof](avalanche-proof.md), [FAQ](judge-faq.md). Rubric weights are the supplied planning rubric, pending organizer confirmation.
