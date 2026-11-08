# C1 specialties verification corrections

- Full E2E attempt1:420passed, one unchanged Squad clock case timed out. The exact failed case passed with one worker; other420 were not rerun. Both logs and failed-case manifest retained.
- Offline ON build attempt1 referenced the retired `/tmp/cardrpg-a4-tools/bin/python`. Attempt2 selects existing `/tmp/cardrpg-a5-tools/bin/python` with Pillow11.3.0. No runtime or image-source change.
- Original42 functional screenshots remain. Collection captures centered a tall detail panel below its heading/job and could show its loading placeholder. Supplemental Collection captures wait for preview readiness and frame the heading/job; they use the same immutable mode artifacts.
- Supplemental1280ON attempt1 scrolled the window although the content uses its own scroll container. The visibility assertion failed; retained at `visual-on-1280/checks.json` and `ui-checks/visual-on-1280-attempt-1.log`. The correction scrolls the actual ancestor. No production change.
- A runner was resumed before the original OFF1024 case finished. Exclusive log creation rejected it with EEXIST before spawning any child or sampling. Original coordinator finished successfully; the subsequent resume skips completed cases.

No seeds, fixture semantics, combat source or pass thresholds changed. These are targeted presentation checks, not the Z screenshot pack or balance acceptance.
