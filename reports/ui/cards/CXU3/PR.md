Forge now separates the gear picker, in-place result preview and source-backed materials/chances. The Relic Market provides rarity/ownership filters, stable bigint sorting, listing details, Fuji explorer links and separate buy/cancel/list actions through the existing controllers.

Original artwork is preserved, including the embedded empty-shelf icon. Rare/Epic text uses brighter foreground tokens while SVG art retains its original colors. New checks cover every selected rarity at the unchanged 4.5:1 threshold and verify original SVG fills.

Validation: self-graded (fresh pass) A95/B95 on 1e31e37; merge-lock checks pending. A passed 2,528 unit/script cases, 330 browser cases per desktop size, 90 changed-spec executions with 3 repeats, 20/20 resize runs and 18 strict audit views. The inherited 2 expected-failure and 11 skipped unit cases are unchanged. B shares the one exact-head full matrix and reruns its own core/changed/resize checks from a clean checkout on other ports.

Market browser fixtures are explicitly mocked; no real wallet transaction is claimed. Evidence: https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-ui-ledger/reports/ui/cards/CXU3 . Earlier rejected attempts remain recorded. Fresh-main and GET-only live asset verification follow merge.
