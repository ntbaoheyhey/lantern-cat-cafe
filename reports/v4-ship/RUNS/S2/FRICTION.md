# S2 funnel friction — completed baseline

Measured20/20 clean desktop profiles,10per size, completed 2026-11-16T05:59:31.551235+00:00. Production code remained unchanged during collection. Every profile passed navigation/battle/reward steps1–3 and failed steps4–7. G-FUNNEL FAIL. Development fixture redirect and fixed shared local backend are explicit limits.

| Size | First battle median | Clicks | First campaign reward median | First receipts | Complete | Guest popups | HTTP429 / console errors |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1280 | 3.2805s | 3.0 | 144.0385s | 0/10 | 0/10 | 0 | 8 / 8 |
| 1440 | 3.6285s | 3.0 | 144.5395s | 0/10 | 0/10 | 0 | 10 / 10 |


| Rank | Observed blockage | Cost / evidence | Next diagnosis |
|---|---|---|---|
| 1 | Café Seal has zero selectable inventory after the first campaign reward | Step4 fails20/20; no first receipt | Trace guest authentication and earned inventory bridge. Do not assume local play established a funded burner session. |
| 2 | Fusion has zero matching Epic inputs | Step5 fails20/20; subsequent market buy/Spool unmeasured | Find a legitimate path using existing economy rewards/judge setup; no invented balances or mint history. |
| 3 | No boss CTA matching the harness exists at this point in the guest route | Step6 fails20/20 | Establish actual reachable boss route and label; distinguish a missing shortcut from an overly narrow selector. |
| 4 | My café on Avalanche is not present in the observed guest navigation | Step7 fails20/20 | Implement wallet activity page with real receipts, linked from the hub. |
| 5 | Root development redirect hides the shipping entry difference | Earlier route experiment: root2376ms vs index.html2108ms with different entry flows | Make production flags/entry intentional and rehearse the built artifact. |
| 6 | First campaign reward consumes almost all of the180s receipt budget | Median144.038s, excluding any seal transaction | Preserve deterministic timing; improve the route and class balance with measured evidence. |
| 7 | Harness does not yet execute fusion/list/second-wallet buy/Spool after prerequisites | Explicit unimplemented branch; no pass claimed | Complete traversal after reachable product actions are in place. |

Harness limitations: guest step2 currently verifies local entry and absence of a wallet dialog; it does not verify burner creation/drip. Step6 requires specific CTA text. No complete-chain, sponsored-fee, counter, boss-duration or proof gate can pass from this baseline. Both sizes are now collected. Raw screenshots remain ignored; select at most8evidence images after numeric review.

Observed local fixture contamination: eight guest-drip HTTP429responses across the first ten1280profiles, each also emitted one console error (16recorded error entries total). This is a real gate failure, not third-party noise. The repeated clean browsers share one backend/IP quota. Diagnose disposable-fixture isolation separately from production anti-abuse behavior; never silently waive the429s. Entrance.tsx confirms Play free calls guestSignIn when flags enable it. The missing receipt is therefore not established to be missing authentication. Seal UI exposes an Import earned gear action not yet driven by the baseline harness; investigate that path before assigning the empty inventory solely to product behavior.

Source diagnosis: CampaignPanel accepts only server-earned, unequipped Epic+ gear after a completed route, then imports it through chain-economy-v3. The current local hero battle and server campaign are separate paths. A manual gear ID is not a legitimate bridge for local-only loot. S3 must connect the visible battle to server-authoritative progression, or clearly route players through an existing legitimate server journey; never manufacture eligible items.
