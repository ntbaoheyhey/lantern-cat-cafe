# C11 — Sound startup and retry feedback

Settings and the battle menu previously kept the same active Sound-off button during a pending or failed device start. Two component regressions and eight baseline captures reproduced the missing feedback. The shared control now shows Starting sound…, prevents duplicate requests, announces a concise app-owned failure and offers Try sound again. Enabled/pressed state and the Settings lamp follow the actual audio state.

Context resume now has a four-second deadline after the existing bounded media warmup. Timeout, rejection, unsupported audio and disposal release pending state. A late resume cannot enable sound or play the confirmation cue; another gesture can retry. The master gain starts at zero. No combat, reward, save-schema or audio-composition changes.

Final 40 focused tests across controls, startup, sound scores, Settings and battle HUD PASS; workspace typecheck/lint and diff check PASS. Runtime tests include coalescing, rejection, synchronous throw, cancellation, timeout, late completion, retry and mute. These tests use local fake devices and do not certify audible output or every browser implementation.

Browser review PASS: 72 state/layout checks at 1280×720/1440×900 with both motion settings; 40 final captures inspected in ten sheets plus two full-size views. Covered pending, rejection, retry, enable/mute, suspended/unsupported contexts, leaving and reopening a view during startup, timeout and late resolution. Keyboard activation, focused retry, account/battle invariance except intended sound settings and zero page errors verified. Only local device fixtures; external requests blocked. Baseline eight views also inspected. Two harness issues were corrected: hidden empty status has no layout box; Settings closes via Escape, not an absent Back to cafe button. All final gates pass.

Two representative captures retained in shots/c11-sound; full screenshots and failure logs stay under /tmp/cardrpg-c-sound-*. Evidence remains below120MB; demo30,018,753bytes and weighted7.79 retained. No new balance seeds, account acceptance run or full E2E claim. Designer inbox still empty, final exports0/25.

Next actionable screenshot issue: the existing right-side More menu overlaps part of an enemy HP plate at720p; the added status makes its vertical footprint more visible. Review menu geometry against normal and boss framing without changing battle progression. Continue C8/C11.
