# A3 task 2 — visible battle shell
REFERENCE: ../../memory/PROMPT-A3.md; functional.json; ../../validation/a3-task2-fixed.json

Before: entering a battle hid and inerted the sidebar, wallet and Look toggle. After: the shell stays visible; route-changing navigation and demo launchers are disabled during the fight, while Look A/B and the frame meter remain usable. Battles remain automatic.
The A-owned wrapper contains the existing Battle without modifying B-owned source. `.dp-app` publishes `--dp-shell-left`, `--dp-shell-top`, `--dp-shell-width`, `--dp-shell-height`: CSS-pixel border-box bounds of `.cr-content`.

| Viewport | Left / top / width / height (px) | Stage/content |
|---|---|---|
| 1024×600 | 160 / 87.09375 / 864 / 512.90625 | 74.65% |
| 1280×720 | 184 / 91.09375 / 1096 / 628.90625 | 75.83% |
| 1440×900 | 184 / 91.09375 / 1256 / 808.90625 | 81.21% |

All three shell checks and the separate 1024 practice entry pass; live Look toggles preserve battle state, all controls fit content bounds, no shell overlap or page overflow. [Before/after and retained practice pilot](shell-contact.png). The short practice-height pilot was fixed with `flex:1` on the content area; original failed evidence stays in ../task2.
Main SHA256 `87c32cfd046b8ff53f471073b88fcfa8ebba7427f33777b3c988455799c4390c`, 26,119,709 bytes. Baseline-v1 remains byte-identical.
Five gates PASS: typecheck, lint, build, 1,735 web / 1,020 rules tests (2 expected failures/11 skips), 421 E2E. All seven shell/practice/automatic-path jobs PASS. The exact-hash audit verifies 1,247 source inputs and all 91 L1 copies. Default 24MB size gate remains missed under the 32MB exception; historical cold hitch and +4 startup bytes remain missed. No new timing/visual quality acceptance, no full204 pack or860 matrix at this checkpoint.
B can consume the shell contract for L3; published L2 remains separate from this requested L1 adoption.
