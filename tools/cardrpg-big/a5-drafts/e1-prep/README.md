# E1 worker draft, not adopted

Prepared during unchanged H0 measurement. Native worker only; no model requests.
Map forecast-v4.ts into packages/game-rules/src/cardrpg/depth; the worker and component into the A-owned web depth directory.
After B1–B3, wire only the ON Prepare path; preserve OFF five-seed behavior. Worker uses train1–20; never random acceptance seeds.
Constructor-error handling, 32-entry cross-visit cache and cancellation are implemented in the staged component. Pending: browser CSP/inline worker compatibility, cancellation burst verification, production tests and CPU1/CPU4 receipts. Do not claim the400ms budget until measured.
Wins are internal evidence only; UI renders qualitative band. Run main-thread long-task observer while changing rows repeatedly.

Post-restart review found the recovered outcome draft had lost the earlier effect grouping correction. The durable draft now separates effect IDs and labels two-piece vs four-piece by the actual effect definition. The historical recovered version remains in git; new isolated receipt tests must verify this revision.
