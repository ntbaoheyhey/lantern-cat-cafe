# Hosted Linux symbol-font diagnosis
2026-11-04. Candidate build, not live.

Native run 41863629344, commit b46a691, retained actual PNG bytes in artifact 13341362610 (`browser-failure-evidence`). The direct-file fallback was necessary because the existing console reporter did not retain attached image bodies. The six-case preflight passed all four delayed-font checks and failed both exact Landing comparisons. Earlier Art/UI full suites passed the other 397 cases.

`native-failure-41863629344/` contains the original artifact files, unedited. `native-pixel-diff.py` uses the existing lossless PNG decoder to compare decoded RGBA values. Both widths differ in exactly **859 pixels**: the two external arrows, the checkmark, and the adjacent "Guest play is local" label. The full page outside those proof-strip glyphs is pixel-identical. Font diagnostics report the pinned web fonts loaded. Visual inspection confirms identical scene, layout, art, body text and buttons; the check and arrows resolve to different system glyph shapes, with a slight adjacent baseline difference.

The reviewed Linux captures came from the Playwright Noble container. Hosted Ubuntu has a different fallback symbol-font environment even with identical Chromium and pinned web-font bytes. The fix pins the E2E job to that same image, digest `sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f`. Application code, fonts, baseline bytes, assertions and tolerances are unchanged. A deliberate future browser/container update must review native captures again.

Reproduce the comparison from the repo root:
```sh
python3 reports/gameplay/native-pixel-diff.py reports/gameplay/native-failure-41863629344/flag-off-native/unexpected-landing-1280-0-0.png apps/web/e2e/ui/art2-baseline/linux/landing-stable-1280.png
python3 reports/gameplay/native-pixel-diff.py reports/gameplay/native-failure-41863629344/flag-off-native/unexpected-landing-1600-0-2.png apps/web/e2e/ui/art2-baseline/linux/landing-stable-1600.png
```

The preceding exact six-case suite already passed in this local image with Chromium 156.0.8078.4 (`logs/native-suite-reproduction.log`). Hosted verification of the image pin is recorded separately in the final CI receipts; local success alone is not a hosted-green claim.

The initial pinned-container GitHub run 41865231768 passed all six preflight cases in31.5s at16:17:14 UTC. Its full run was cancelled by the final commit, which prevents apt from upgrading the pinned system fonts during browser installation. The cancelled log is retained as `logs/ci-pinned-preflight-superseded.log.gz`; full final-suite results are separate.
