# A5 C1 player-facing screens — measured closure

The Gameplay v4 player shell hides Feel lab, Review studio, Mechanics lab, Frame meter, Look A/B, Before/after and header seeds. Review tools remain reachable with `?dev=1`; OFF retains its historical shell. Prepare uses native keyboard-accessible cat and Front/Back buttons, with a fixed encounter seed and enemy snapshot. Standing-plan and equipment filters use buttons.

Invitations retain the next Legendary chance and guarantee in the main view. Exact rarity/item odds, independent pity, daily limits and saved-draw semantics sit together behind Odds and rules. Secondary equipment, skill and saved-crew details have explicit expandable headings. Equipment names actual changed HP/attack/defense and newly activated two/four-piece effects; it makes no unmeasured survival-hit claim.

Reviewing the original screenshot exposed an error missed by the first interaction tests: the Outfit filter could leave a hidden weapon selected by Equip. Reviewed source c4a883e5 derives the action and comparison from visible items, and hides both for empty results. Original screenshots/checks are retained under c1/original-browser; the reviewed overlay has SHA 788ff719e42c7f595615fcf2f60ae4e0021ba32419f47ed2057dae785587be82, 26,217,950 bytes.

Original C1 source: typecheck/lint/web 1,737/rules 1,106 (+2 expected failures, 11 skipped)/E2E 421/build PASS. The recorded gate head predates adoption; c1/source-tested.json identifies the actual inputs. Reviewed source c4a883e5 separately passed typecheck, lint, 1,737 web tests, 1,106 rules tests (+2 expected failures, 11 skipped), 421 E2E tests and build; exact successful logs are preserved under c1-reviewed/gates. No successful source suite was repeated after the host restart.

Original targeted browser: 30 captures across 1280×720, 1440×900 and 1024×600; keyboard/click placement, player/reviewer modes, two looks, exact odds and filters PASS. No recorded page errors, remote requests or horizontal overflow. The measured new-component text contrast minimum is 8.376:1; this is a scoped check, not the full Z contrast pack.

The paired same-state copy audit passes on all six screens. Its corrected word counter excludes descendants of closed details while retaining the summary and selected option. Original H0 timeline/word counts remain immutable; results must distinguish this methodology correction from engagement improvements. The H0 elapsed journey is not being repeated in C1.

|Same-state screen|A4 words|C1 words|Change|
|---|---:|---:|---:|
|Hub|350|341|-9|
|Prepare|407|252|-155|
|Result|136|110|-26|
|Invitations|263|185|-78|
|Equipment|391|338|-53|
|Journal|170|165|-5|

Reviewed browser captures also pass at all three sizes. Personal inspection includes 1024 Prepare and 1440 Invitations; exact artifact hashes and scoped contrast remain in the receipts. After the host restart, the identical HTML was rebuilt and only the lost targeted browser receipts were restored. Reviewed closure is PASS in c1/reviewed/audit.json. The OFF 8,250-route digest is reused with byte parity of all 63 rule files; baseline-v1 and 13 historical sims remain exact.

Still open beyond C1: causal Result guidance/available retries and worker forecast in E1; Hub pull/celebration in E2; display calibration in B1; exact revised reward odds in B3; complete screenshot/contrast pack and rebuilt public offline artifact in Z. No human playtest or balance acceptance claim. Draft only; no merge or deploy.

C1 closure does not claim that every sentence is at most 18 words or that Inventory/RunMap had a paired word reduction: those checks remain unmeasured. The measured comparison is the six screens above. The public docs/cardrpg3/index.html remains the A4 baseline until Z; this phase validates the isolated C1 artifact.
