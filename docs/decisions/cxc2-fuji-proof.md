# CXC2 — public Fuji proof in Help

Approved under the user's implementation authority, 2026-11-03. This frontend card is independent of CXN3 #244 and the partial CXU3 draft. It uses the deployed Fuji addresses already committed in packages/chain. No backend, contract, flag, dependency or provider-setting changes.

Help gains an On-chain proof tab through its existing additionalTabs host. An opt-in lazy property on the shared tab primitive prevents the proof component from mounting under Guide. StageLayout separately disables its query while Help is hidden. Existing tabs keep their previous mounted-state behavior unless explicitly marked lazy.

The reader uses the existing public Fuji client and verifies eth_chainId=43113 before reading a block or contract. Both deployed-code reads, the market's relicNFT and activeListingCount getters, block hash and events refer to that same block. The event request spans at most500 blocks from the two contract addresses, returns at most10 displayed events, and filters removed/out-of-window/other-address responses. It never scans full history or requests signing/writes.

Each fact can be unavailable independently. Zero active listings and absent bytecode remain explicit, rather than being confused with RPC failure. A market→NFT mismatch is shown as a mismatch. Lifetime minted totals are not exposed by this NFT ABI; recent events are labelled as a limited window. Explorer links remain usable if reads fail. The panel makes no claim about server signer custody, backend deployment identity, or a full wallet journey.

Successful, failed and in-flight snapshots are cached for at least30 seconds per public client, in memory only. React Query also uses30-second freshness and disables window-focus refetch. Manual refresh respects the same cache. The component displays previous-snapshot wording if a later refresh fails.

Tests cover the requested addresses, chain refusal, exact block/range/limit, partial/zero/empty data, coalesced and failed-read caching, lazy mounting, hidden-screen gating and unchanged tab behavior. Browser fixtures intercept only public RPC reads, with explicit wrong-chain and partial-event scenarios at1280×720 and1600×900. These fixtures are not live-chain or wallet evidence. Live read-only snapshot and deployed UI validation remain separate release gates.

The first browser harness failed before test collection because Node24 requires JSON import attributes; the harness now reads committed deployment JSON with fs and imports generated ABI directly. Its exact eth_getLogs expectation includes viem's serialized empty topics array. Neither repair changes runtime behavior or relaxes an assertion.

The browser cache test installs its virtual clock before loading the app, so the reader and query cache share that clock. Installing it after module initialization left the reader on real time; that initial harness failure remains recorded. All four corrected desktop browser cases pass, including the unchanged30-second cache expiration assertion.
