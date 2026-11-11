# C11 — pending actor lifecycle

Six cold-load cases reproduced an obsolete Practice Cushion reserving enemy lane zero and keeping the next preview unready. The visible replacement used lane one; loading remained 4/5 after the old actor was discarded. Removed and disposed requests now release pending/failure/lane records immediately. Each request has a token, so an old success/failure cannot overwrite or complete a newer request for the same ID. Late successful actors are disposed. Loading counters describe the current roster; surviving enemy slots keep their identity.

Verification: six cold-load cases now pass at both sizes (remove, return before completion, dispose). Ten retained-actor/removal/replacement/KO lifecycle checks also pass on the new implementation. Four new asynchronous regression tests cover obsolete success, remove/return racing, obsolete versus current failure, and disposal; 34 focused tests total pass. Workspace typecheck, lint and diff whitespace checks pass.

Rebuilt the file-only demo and exercised 526 rapid dropdown changes in six batches at both sizes. No stale actor/lane, duplicate scene children, pending gate, label overlap, horizontal overflow, HTTP request or browser error. Exact current loading counts and party order match. Two real Pause/Play checks pass. Inspected four final captures (two source, two offline), with the 720p source comparison also inspected. Removed enemy reservation is visibly reclaimed; faces, HUD and damage labels stay clear.

Demo 29,225,553 bytes, evidence about111.87MB. No frame-time or new gameplay claim; score7.79 unchanged. Preserve the six failing baseline cases. Designer inbox still empty, no additional published PSD character. Current lifecycle change is independent of the previous four forced-redraw differences. Full421E2E results predate the later C11 changes.

Next inspect whether the main battle/preview playback clock waits when a new actor starts loading after the scene first became ready. The completed checks deliberately paused source previews; the offline player already gates its clock on scene readiness.
