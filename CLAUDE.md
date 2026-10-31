# Token-saving rules

From a 7-day audit of session logs (script: `token-audit.mjs`).

1. **Keep sessions short.** About 62% of cost came from turns with context over 150k tokens. After ~2 hours or when context gets large, write a progress summary to a file and start a new session (or /compact). One batch per session.
2. **Use subagents sparingly.** About 16% of cost was subagent work. Only for broad searches or independent tasks, with a short prompt naming exact file paths. Sonnet for routine work, Opus only for planning or hard bugs.
3. **Keep tool output small.** Read files with offset/limit or grep first. Filter build/test output, e.g. `| tail -n 40` or `grep -E "error|fail"`.
