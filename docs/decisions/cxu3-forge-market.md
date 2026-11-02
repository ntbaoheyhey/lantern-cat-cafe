# CXU3 — Forge and Relic Market

Approved under the user's full implementation authority, 2026-11-03. Frontend work is independent of CXN3 #244. This change does not activate server behavior.

The approved redesign brief supplies the layout: Forge has gear choices on the left, a preview and in-place result in the center, and materials/chances on the right. Market has rarity filter chips, a sortable table, listing details with actions, and the user's listings. Existing art is retained unchanged.

## Facts and behavior

- Crafting uses the existing recipe costs and guaranteed recipe rarity from game-rules. Bonus lines still roll. Mockup success/break percentages and upgrade prices are not game rules. The Great Success proposal remains inactive.
- Bag capacity, busy state, material refusal, confirmation/cancel, equipped/locked/starter salvage protections, Relic daily limit and voucher/mint flow retain their existing controllers. Result identity keys a single reveal; parent updates cannot restart it. Reduced motion removes reveal animation.
- Market displays actual ERC-1155 token/listing IDs, quantity, rarity, seller and total test-AVAX price. Relics have no gear Power or Weapon/Armor classification. Sorting keeps bigint precision and a stable listing-ID tie break.
- Buy/Cancel appear in listing details. Sell is a separate mode; read failures hide stale actions and disable listing until reads recover. Errors/empty/loading states remain explicit.
- Wallet writes, approval-before-listing, amount/price validation, explicit Fuji chain IDs and receipt-success checks are preserved. Contract explorer links use the existing Snowtrace/Routescan Fuji address route. No contract/ABI/backend changes.

## Verification and scope

Desktop targets are 1280×720 and1600×900. Existing compact tests remain required. The Forge header/navigation reserve their own flex height so content cannot shrink and clip tab controls. Cancel has secondary styling; the main action retains the accent.

New rules-backed tests compare every recipe's displayed costs/chance with actual craft outcomes across slots/seeds. Browser tests exercise Craft, confirmation, reveal identity across parent updates, Salvage guards and Relic refusal with normal/reduced motion at both desktop sizes.

The Market browser sidecar renders the production MarketView and ScreenFrame with visibly labelled synthetic rows and mock callbacks. It tests layout, keyboard sorting/selection, Buy/Cancel/List argument wiring, loading/error/empty states, and zero network writes. It does not prove real wallet transactions; MarketTab's existing and extended unit tests cover those controller calls, with the live throwaway Fuji run reserved for CXQ1.

The sidecar is built only by the browser-test harness into an isolated dist-v2/e2e-N/market-fixture directory; it is not a production entry. No dependency or production build configuration is added. A39-declaration TypeScript AST comparison against merged main confirms the preserved transaction and Forge calculation/handler declarations.

Saved dirty AGR3 work is preserved separately and was used only for layout input. Its fabricated Relic power, odd/even categories, conditional hook and transaction rewrites were rejected. The immutable source patch/hash is recorded in the ledger's CXU3-FRESH inventory. All new product text is original.
