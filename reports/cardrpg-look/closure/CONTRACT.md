# B presentation integration

Source commit `8ba0a3879`, stacked on L7 draft378. A rule/meta sources have not been adopted into this branch. Three read-only fixtures are copied from A commit1cb68a5c with source hashes in a4-fixtures.json.

- `BattleView` recognizes `battle.v4.version === 1`, the published `plan` and `events`. It shows current actor skill IDs, opening ultimate delay, cooldowns, row, crew and standing plan. Legacy battles keep their charge display. Future versions fall back to legacy presentation.
- `boss-phase` and `boss-finish` use the current action clock starting at impact. They consume at most400/800ms and never extend the action. Pause/speed/skip retain the model's existing behavior. No rules or account mutation occurs.
- A's `CompanionPreview` can provide `SceneView.earnedReveal?: unknown`. The existing `scene.playEntrance(catId)` call reads it; an explicit second receipt argument also works. Omit the value when OFF. Unknown versions, malformed receipts, wrong cat IDs, disposed scenes and previews switched during loading returnfalse.
- A valid new receipt displays its exact text with the existing entrance. Repeating the same current receipt returns true without resetting its start time or duplicating the badge. The badge clears at entrance completion, when the selected cat changes, or on disposal. No new timers, currency, rewards or manual controls are introduced.

This checkpoint verifies fixtures in B's actual browser renderer. A owns live receipt forwarding from Invitations through CompanionPreview, portrait/icon/frame adoption, and the merged delivery. It does not claim those screens are wired on this branch.
