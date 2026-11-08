# E1 worker draft, not adopted

Prepared during unchanged H0 measurement. Native worker only; no model requests.
Map forecast-v4.ts into packages/game-rules/src/cardrpg/depth; the worker and component into the A-owned web depth directory.
After B1–B3, wire only the ON Prepare path; preserve OFF five-seed behavior. Worker uses train1–20; never random acceptance seeds.
Pending: constructor-error handling, cross-visit cache ownership (current cache survives build changes only within one Prepare mount), browser CSP/inline worker compatibility, cancellation burst behavior, tests and CPU1/CPU4 receipts. Do not claim the400ms budget until measured.
Wins are internal evidence only; UI renders qualitative band. Run main-thread long-task observer while changing rows repeatedly.
