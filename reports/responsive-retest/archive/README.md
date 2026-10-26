# A-R2 Independent Retest Archive Manifest

This archive preserves the authentic custom test harness, execution logs, failure history, fixture generation script, and session transcript from the independent A-R2 responsive retest conducted on 2026-10-26.

## 1. Provenance & Target Commits

- **Tested Source Commit:** `ai/codex-responsive-window` @ `282843de2790f0b2e1f3dfecaeae8c44a5cdd3b6` (tested in detached checkout)
- **Inherited Renderer Fix Commit:** `ai/codex-fix-stage-redraw` @ `7760775cd2beae2f87efbcbeef6b849c5ae28a5c`
- **Base Commit:** `origin/main` @ `337977751204b5ea59d8f0cabfb91fb4cd4a391f`
- **Initial Failure Reference:** Finding A-R1-1 on `ai/antigravity-responsive-qa` @ `9980b46c01f60dc41975975f6166e99cff16b918`
- **Report Commit:** `ai/antigravity-responsive-retest` @ `95b1ea4d20286fa29039fe361ebd936b75e32cfe`

---

## 2. Test Environment & Prerequisites

- **Operating System:** macOS (Darwin 24.1.0 arm64)
- **Node.js:** v20.19.2
- **Package Manager:** Pinned pnpm 10.28.0 (frozen lockfile)
- **Browser Automation:** Playwright Chromium 156.0.8078.4 (headless)
- **Application Build:** Built with `pnpm --filter @taskbar-hero/web build` into `apps/web/dist-v2`
- **Preview Daemon Invocation:**
  ```bash
  pnpm --filter @taskbar-hero/web exec vite preview --outDir dist-v2 --port 4174 --strictPort
  ```

---

## 3. Archived File Manifest

| File Path | Description | Result / Status |
|---|---|---|
| `run-full-retest.mjs` | Primary automated harness executing the 12-viewport continuous session matrix (dark & light), geometry assertions, actor pixel sampling via `getImageData`, 4 priority lifecycle scenarios, long values edge cases, CDP `Emulation.setPageScaleFactor` magnification, and phone sheet interactions. | Main harness script |
| `test-harness.mjs` | Initial baseline actor inspection script validating canvas visibility and non-transparent pixel extraction for witch class. | Prototype script |
| `gen-fixtures.test.ts` | Vitest scratch script used to inspect save fixture structures from `mockV2Fixtures`. | Fixture script |
| `logs/run-full-retest-pass.log` | Complete stdout log of the successful test harness execution (`task-190.log`), recording matrix steps, pixel counts, and exit 0. | **PASS** (exit 0) |
| `logs/run-full-retest-fail.log` | Early attempt failure log (`task-134.log`) where the canvas selector timed out before the preview server was fully initialized (`TimeoutError`). Preserved per instructions. | **FAIL** (timeout) |
| `logs/focused-browser-suite.log` | Output log of focused browser command: `playwright test resize.spec.ts stage-redraw.spec.ts --project=stage-layout` (4 passed in 15.1s). | **PASS** (4/4) |
| `logs/full-playwright-suite.log` | Output log of full Playwright test suite: `playwright test` (72 passed in 23.5s). | **PASS** (72/72) |
| `transcripts/original-run-transcript.jsonl` | Authentic, unedited 249-step execution transcript from Antigravity conversation `cb56daaa-b920-4372-a259-dd5034078adb`, recording all tool invocations, commands, and outputs. | Full transcript |

---

## 4. Structured Evidence Qualification

In `retest-summary.json`, the dark session matrix (`matrixDark`) recorded all fields: `expectedLogW`, `actualLogW`, `catPixels`, `monsterPixels`, `actorOk`, `geomIssues`, `noOverflow`, `timeOriginSame`, `identityMatches`, `stepPass`, and `screenshot`.

For the light session matrix (`matrixLightReduced`):
- `noOverflow` (`document.documentElement.scrollWidth <= innerWidth`) was evaluated on line 312 of `run-full-retest.mjs`.
- `timeOriginSame` (`performance.timeOrigin === timeOriginB`) was evaluated on line 313 of `run-full-retest.mjs`.
- Both were enforced by the line 324 assertion:
  ```javascript
  const stepPass = geomIssues.length === 0 && noOverflow && timeOriginSame && actorRes.ok;
  ```
- All 12 viewports satisfied this condition (`stepPass: true` and logged `PASS` in `logs/run-full-retest-pass.log`).
- However, `results.matrixLightReduced.push(...)` omitted `noOverflow`, `timeOriginSame`, and `identityMatches` from the serialized object keys. Furthermore, `identityMatches` was not polled during Part B.
- This structured JSON gap is qualified: the measurements were evaluated in-memory and logged, but omitted from the JSON serialization.

---

## 5. Security & Secret Verification

All archived scripts, logs, and transcripts have been verified to contain zero environment secrets, private keys, authentication tokens, or production credentials. References to `key` in the harness denote the local browser `localStorage` key (`taskbar-hero:v2-demo:1`) or game currency stacks (`catKey: 2`).
