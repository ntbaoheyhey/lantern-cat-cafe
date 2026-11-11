# C7 — Bag and the first evening

Applied the retained Q55 portrait containment draft: legacy selected and empty Bag use the bounded original portrait, with a full-width empty card. Equip stays visible even for the longest current gear name. A6 Materials, Consumables, Collectibles and Currencies now use paper cards, dark readable copy, 42px actions and category-specific titles. Legacy category colors and all commands are preserved.

The existing first three steps now show their order, next action and reward on home and the matching Prepare/Recruit/Cats screen. Added the Fight pointer and app reduced-motion handling; kept the existing recruit/level pointers. Practice and recruit messages agree with the next level-up action. No rewards, unlock rules, enemy budgets or economy were changed. HUD sockets retain C6 acceptance.

Checks: workspace typecheck/lint PASS; 32 focused tests PASS (Bag, formation, equipment forecast, introduction, recruit and model). Fresh-account UI clicks completed practice, zero-stamp welcome and exact public level cost at 1280x720 and 1440x900. Bag fixtures verified keyboard equip, public enhancement cost, empty/long-name/capped states, all four category tabs and exact pantry recipe costs/counts. Reduced-motion hands are static. 38 screenshots, no page errors or horizontal overflow; inspected seven uncropped contact sheets and full-size selected views. Four loader-only captures were explicitly replaced with loaded fixtures and labelled in review.json.

Repair notes: the added guide initially displaced the Cats grid and hid Level up at 720p; reserving its own row fixed the viewport gate. Harness assumptions about automatic Recruit navigation and nested summaries were corrected, without changing app behavior. The final thirty-minute unaccelerated run remains C11; these checks are not that run or a balance claim.

Evidence: shots/c7/review.json and 38 WebP views. All lane evidence remains under120MB. Designer inbox was empty at item start.
