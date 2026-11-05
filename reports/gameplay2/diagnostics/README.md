# Exploratory diagnostics, not shipped runtime

These scripts retain the earlier inspection source. They are archived beside the raw failures; they are not standalone tools in the ledger tree. To replay, copy to the gameplay2 worktree tools directory where their original relative imports resolve.

- gameplay2-preview.mjs: early development snapshot driver, superseded by the final audit.
- gameplay2-visibility.mjs: headed Chromium minimize diagnostic. It timed out waiting for true document.hidden on this host; no real OS-hidden success is claimed. See logs/visibility*.log.

No unfinished runtime mechanic or broken diagnostic was added to the gameplay PRs.
