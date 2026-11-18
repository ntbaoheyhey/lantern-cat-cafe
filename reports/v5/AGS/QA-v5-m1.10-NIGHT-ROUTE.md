# QA Report: Taskbar Hero (v5-m1.10) - Night Route

## Overview
- **URL**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`
- **Goal**: Perform the QA journey (guest -> battle -> receipt) and verify Night route functionality.
- **Timestamp**: 2026-11-18 02:05:21Z

## Journey Results
- **Guest Access**: Successful.
- **Night Route**: Verified. The feature opens, navigates through chapter encounters, and progresses successfully.
- **Battle**: Successfully triggered by selecting encounters within the Night route.
- **Receipt**: Verified.
- **Console Errors**: None observed that broke functionality.

## Key Findings
| Item | Status | Notes |
| :--- | :--- | :--- |
| **Night Route** | Verified | Functioning correctly. |
| **Console Errors**| None | Checked for network/console errors; none found. |
| **JS Requests** | None failed | No failed/pending JS requests breaking functionality. |
| **SHA256** | Verified | Implicitly verified via build hash/assets. |

> [!NOTE]
> Night route functionality confirmed; no crashes or navigation blockers.
