STATUS: DONE

# Task V29 Prep / A27b Report: Submission Kit Drafts

## 1. What Was Done
- **Video Production Plan (`docs/video-shotlist-v2.md`)**:
  - Developed a comprehensive 2–3 minute (150-second) video plan built directly on `docs/demo-script-v2.md` scenes and `docs/pitch-outline.md`.
  - Structured 7 precise shots with time intervals, on-screen visuals, spoken narration script, target build mode (demo mode vs live build), and dependency status (`READY NOW`, `AFTER V16-V19`, `AFTER CUT-OVER`).
  - Added studio recording setup checklist: 1080p/720p 16:9 resolution, 100%/125% browser zoom, clean guest profile without extension clutter, strict wallet privacy (no mnemonics/private keys on screen), and a dedicated reduced-motion take.
- **Contest Submission Draft (`docs/submission.md`)**:
  - Appended section `## Cat RPG v2 submission (draft)` to `docs/submission.md` while preserving all existing v1 content untouched.
  - Included placeholder tables for Live Site, Repository, Demo Video, and Pitch Slides.
  - Documented "Deadline: TO CONFIRM (D9: 21 Nov vs 24/25 Nov 2026 23:59 UTC+7; official date unconfirmed between team1vn.xyz and Builder Hub)".
  - Documented "Repo visibility: user decision D7 (recommended public 19 Nov 2026 after secrets scan; submission 20 Nov 2026)".
  - Added pre-submit verification checklist: private-window link checks, automated git secrets scan, and live health check verification.

---

## 2. Blockers
None.

---

## 3. Files Touched
```
docs/submission.md
docs/video-shotlist-v2.md
reports/submission-v2-draft.md
```

---

## 4. Gate Check Output
- `docs/submission.md` on origin/main: Present -> PASS
- `docs/demo-script-v2.md` on origin/main: Present -> PASS
- `docs/pitch-outline.md` has v2 section (line 116 / Card A27a #163): Verified -> PASS
- `docs/video-shotlist-v2.md` absent on origin/main: Verified absent -> PASS

---

## 5. Verification Commands Run & Real Output

- `pnpm install --frozen-lockfile`
  ```
  Scope: all 7 workspace projects
  Lockfile is up to date, resolution step is skipped
  Already up to date
  Done in 351ms using pnpm v10.28.0
  ```
- `pnpm gen:deno && git diff --exit-code -- supabase/functions`
  ```
  wrote 18 Edge Function import maps
  (exit code 0)
  ```
- `node scripts/check-links.mjs docs/video-shotlist-v2.md`
  ```
  Checked 1 markdown files and 2 links/paths.
  ✓ All links, image paths, and backticked repo paths exist on disk.
  ```
- `node scripts/check-links.mjs docs/submission.md`
  ```
  Checked 1 markdown files and 6 links/paths.
  Found 1 broken link(s) or path(s) on disk:
    docs/submission.md:3 [backticked repo path]
      Target: `docs/*`
      Not found: docs/*
  ```
  *(Note: Line 3 `docs/*` is a pre-existing glob from the original v1 document on origin/main; all new links and paths in the appended v2 section pass).*
- Full suite skipped: docs only.

---

## 6. Acceptance Checklist
- [x] `docs/video-shotlist-v2.md` created with 2–3 minute video production plan.
- [x] Per-shot breakdown includes time range, visual, voiceover line, build mode, and milestone readiness status.
- [x] Recording setup checklist included (resolution, zoom, clean profile, secrets prevention, reduced-motion take).
- [x] Section `## Cat RPG v2 submission (draft)` appended to `docs/submission.md` with placeholders only.
- [x] "Deadline: TO CONFIRM (D9: 21 Nov vs 24/25 Nov)" and "Repo visibility: user decision D7" documented.
- [x] Pre-submit verification checklist added.
- [x] Existing sections of `docs/submission.md` untouched.
- [x] No unverified features claimed.

---

## 7. User Decisions on Return (D7 & D9)
- **Decision D7**: Schedule repo visibility switch to public (recommended 19 Nov 2026 after secrets scan) and assign who records video / submits.
- **Decision D9**: Confirm official submission deadline (21 Nov vs 24/25 Nov 2026 23:59 UTC+7) with hackathon organizers.

---

## 8. What Is Needed to Continue
- Proceed to G6, G7, G8 checks (check Codex's `ai/codex-v16-stage` branch or evaluate WAITING).
