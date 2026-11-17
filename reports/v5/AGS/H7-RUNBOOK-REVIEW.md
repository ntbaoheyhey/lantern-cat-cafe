# H7: Owner Runbook & Fuji Proof Kit Review (Read-Only)

**Document**: `reports/v5/AGS/H7-RUNBOOK-REVIEW.md`  
**Reviewer**: AGS (Antigravity SHIP lane)  
**Date**: 2026-11-17 (UTC)  
**Reviewed Sources**:  
- `reports/v4-ship/NEEDS-USER-VI.md`  
- `reports/v4-ship/USER-DEPLOY-VI.md`  
- Fuji Proof Kit (`scripts/fuji-proof.mjs`, `reports/m3-avalanche-proof.md`)  
- Milestone BOARD & `OWNERSHIP.md`  

---

## 1. Executive Summary & Verification

The owner runbook outlines the required human-only actions for the November 20 deploy and November 21 submission (deployments, private keys, wallet funding, and final submission portal actions).

Our read-only audit identified **three critical discrepancies** that must be updated by CXI in `reports/v5/CXI/NEEDS-USER-VI.md` before the owner executes the deploy.

---

## 2. Identified Runbook Discrepancies & Recommendations

### Discrepancy 1: Outdated Branch Reference in Deploy Commands (CRITICAL)
- **Current Runbook Text**:
  ```bash
  cd /Users/bao/taskbar-hero-chain
  git switch codex/v4-ship-2026-11-16
  git pull --ff-only origin codex/v4-ship-2026-11-16
  ```
- **Issue**: `codex/v4-ship-2026-11-16` is the old V4 branch. If the owner executes this command, they will inadvertently build and deploy the legacy V4 build, completely missing all V5 features (UI-v3, Spine/rig animations, additive VFX, and new procedural sound).
- **Required Fix for CXI**: Update the deploy guide to reference the V5 release branch/tag:
  ```bash
  git switch codex/v5-int-2026-11-17
  # Or checkout the final green milestone tag:
  git checkout v5-m3
  ```

### Discrepancy 2: Fuji Proof Kit Execution Path
- **Current Runbook Instruction**: Instructs the owner to run `node scripts/fuji-proof.mjs`.
- **Issue**: In secondary git worktrees (e.g. `th-v5-ag4`), running bare `node scripts/fuji-proof.mjs` fails with `Cannot find module 'viem'` because `node_modules` is not installed inside sibling worktrees.
- **Required Fix for CXI**: Specify the exact package execution command that resolves from the pnpm workspace:
  ```bash
  pnpm --filter @taskbar-hero/chain exec node scripts/fuji-proof.mjs
  # Or ensure running from /Users/bao/taskbar-hero-chain where node_modules is populated
  ```

### Discrepancy 3: Dual Submission Portals Clarification
- **Observation**: `NEEDS-USER-VI.md` highlights two submission portals:
  1. `team1vn.xyz/dashboard.html` (Deadline: 21 Nov 23:59 VN)
  2. Avalanche Builder Hub / Devpost portal (Deadline: 25 Nov 05:59 UTC)
- **Action for Owner**: Maintain the strict target of **21 Nov 23:59 VN**. Submit on `team1vn.xyz` first, and cross-submit on the Builder Hub if required by the organizers.

---

## 3. Dispatched Request (REQ) to CXI
- Appended REQ to `INBOX-CXI.md` requesting updates to `reports/v5/CXI/NEEDS-USER-VI.md` reflecting the V5 branch switch (`codex/v5-int-2026-11-17` / tag `v5-m3`) and the explicit `pnpm` command for `fuji-proof.mjs`.
