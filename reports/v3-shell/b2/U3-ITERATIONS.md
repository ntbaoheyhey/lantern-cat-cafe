# U3 redesign iterations

Both rounds are implemented changes, not claims that another capture improves quality. Historical capture logs retain intermediate measurements. Final visual judgments deliberately leave weak states below eight. Every failing state below has two revisions; each still needs the stated work in UI-REBUILD.md.

| States | First redesign | Second redesign and evidence |
|---|---|---|
| cats-list, hero-level-star, hero-skills, hero-bonds, hero-gear | Painted garden, portrait tiles, pedestal strip, shorter tab labels and displayed upgrade costs. | Compact 720p detail geometry; dark gear controls and visible costs/deltas. `tests/u3-safe-area-1280.log`, `tests/u3-accept-1280.log`; `shots/u3-safe-area.png` preserves the intermediate appearance. |
| hero-awakening | Painted framed dialog and original constellation node art. | Shortened threshold/cost display and corrected dark-dialog contrast; `tests/u3-pages-first.log`, `tests/u3-verified-1280.log`. |
| bag-item-detail, bag-manage, bag-consumables | Replaced plain supply/item rows with rarity tiles and selected-item workspace. | Added atomic batch preview/quantity dialogs and compact manager tabs; `tests/u3-bag-captures.log`, `tests/u3-accept-1280.log`. |
| invitations-rates | Framed dark odds panel with rules-driven probabilities and compact icon labels. | Replaced ambiguous stars with named rarities, Base/Next, Cost, Soft pity and Guaranteed; final 16 words. `tests/u3-accept-1280.log`; odds unit tests pass. |
| season-track-countdown-edition, season-guide | Original garden, mascot, season medal and edition tile. | Replaced inactive Play/Collect/Grow labels with actual navigation, added concise honest premium-pass roadmap line. `tests/u3-pages-second.log`, `tests/u3-accept-1280.log`. This still does not implement a season pass. |
| economy-odds | Painted shop frame and grouped rule-table tabs. | Compact 720p table and short Bells-only/pity explanation; `tests/u3-safe-area-1280.log`, `tests/u3-accept-1280.log`. |
| settings, settings-audio | Original frame, mascot, icon actions and concise headings. | Darkened controls, compact two-column save desk, short mixer rows and persistent bus controls; `tests/u3-safe-area-1280.log`, `tests/u3-accept-1280.log`. Native form controls remain. |
| chapter-map | Original parchment backdrop and ribbon in owned wrapper. | Compact chapter labels, icon-led dock and short route controls in owned wrapper; `tests/u3-first-captures.log`, `tests/u3-accept-1280.log`. The geometric route still needs a larger rebuild. |
| battle-prep | Original frame/ribbon applied around A's protected stage. | Compact owned heading/tabs and 720p safe-area corrections; `tests/u3-first-captures.log`, `tests/u3-accept-1280.log`. No A-owned stage file edited; its four plain controls remain. |
| wallet-panel | Dark painted frame and illustrated actions replacing plain panel. | Native modal focus/Escape handling, compact balances and key-export controls; `tests/u3-chain-captures1.log`, `tests/u3-accept-chain-1280.log`; native-dialog regressions pass. |
| wallet-history | Illustrated ledger/mascot and receipt cards replace hash rows. | Compact two-column receipt cards, six-icon rail and explorer controls; `tests/u3-chain-pass2.log`, `tests/u3-accept-chain-1280.log`. Ordinal receipt labels still need transaction types. |
| wallet-fusion, wallet-ornament-forge, wallet-offline | Workshop scene, original forge icon and mascot; cost and deterministic recipe retained. | Compact preview/rail/input heights to preserve primary action, real retry state, and broken-image capture check; `tests/u3-chain-safe-area-1280.log`, `tests/u3-accept-chain-1280.log`. An attempted sticky footer overlapped the primary and was removed before final evidence. |

No reference image was fed to a generator or committed. U3 is permitted PARTIAL only; the remaining visual work stays open for the next redesign pass and P9.
