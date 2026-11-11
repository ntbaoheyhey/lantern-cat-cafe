# C11 — recover from temporary asset failures

Four cold-page cases at both requested sizes reproduced the same failure: after one atlas HTTP503 or invalid PNG response, public gallery switches kept selecting the old puppet, with only one request ever made for the recovered asset. Rejected promises remained in the skeleton cache for the page lifetime. The PNG-sequence cache used the same pattern.

Only rejected cache entries are now removed, guarded by their request identity. Current actors retain the readable fallback; a later ordinary actor request can recover. Pending requests still coalesce and successful data/textures stay cached. There is no background retry loop, additional network request on successful reuse, combat change, or designer-source edit.

All four browser cases pass: first source puppet, second/third placeholder; exactly two resource requests, four current actors, no pending loads/label overlap/page error. Four regressions exercise atlas and skeleton fetch failure, PNG manifest and image failure, shared successful data and independent actor AnimationStates/planes. Together with lifecycle/event checks,12tests pass; workspace typecheck/lint and whitespace pass. Initial test-only ImageBitmap omission is preserved in the failed logs and corrected in the final test environment.

Rebuilt offline demo29,226,045bytes. Two smoke cases with ten public dropdown changes and two actual Pause/Play checks pass, no HTTP/error/overflow/ghost actors. Both recovered source views and both offline views inspected at1280×720/1440×900; silhouettes, faces and outcome rows remain clear. Four final captures total. Evidence119.21MB; no new performance or gameplay measurement and score7.79 unchanged. Source/baseline JSON: shots/c11-asset-retry; offline: shots/c11-asset-retry-offline; logs: checks/c11-asset-retry-*. Large scratch diagnostics stay under /tmp/cardrpg-c-*.

Designer inbox still contains only README. Next inspect whether malformed PNG bytes can pass the structural intake gate; keep previous accepted revisions intact. C8/C11 remain continuous.
