# Repair log

U0 in progress. No published Lane U milestone yet.

- U0-HARNESS / FIXED: `pnpm --dir apps/web exec vite --config ../../tools/ui-v3/vite.config.ts` failed to resolve a package-directory import. Removed unnecessary defineConfig import; explicit repository root and own dependency symlink. HTTP200 verified. No runtime change.

- U1-FOCUS / FIXED pending rerun: shell.spec Escape focus check failed because opening a sheet unmounts the dock button. Preserve its destination and restore focus to the remounted control. No gameplay effect. Exact spec + G1 rerun.
- U0-PUBLISH / FIXED: connector create returned ReadTimeout and immediate search returned empty (index lag). CLI create guard found existing draft #428; no duplicate created.

- U1-DEV / FIXED pending G1: Utility.test expected legacy reviewer grants without dev=1. User section1 now explicitly forbids this. Kept all grant assertions; supplied the required dev=1 in that reviewer fixture. No test disabled or quarantined. Player gating remains tested separately.
- U1-FOCUS verification: exact browser rerun2/2PASS (u1/shell-repair.log); initial failure retained.
