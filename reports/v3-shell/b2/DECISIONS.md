# B2 decisions

- Revision 2 controls this run. Work alone; no agents or model subprocesses.
- Saved safe disabled/empty .env.example leftovers after passing workspace typecheck. Ignore local Supabase CLI metadata; never commit it.
- Keep existing worktree/branch; never touch A-owned battle files, deploy, merge main, or alter contracts.
- Gate evidence is fail-closed: absent/empty evidence cannot pass a maximum or universal check.
- MB budgets use decimal bytes (1 MB = 1,000,000 bytes), a conservative interpretation.
