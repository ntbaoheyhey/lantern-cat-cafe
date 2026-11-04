# Repository-source function restore rehearsal — DRAFT

**repo-source rehearsal only; NOT a backup of deployed functions.** This deterministic archive selects tracked source at one commit, per-function import maps, the seven tracked Deno locks, Supabase config, dependency lockfiles, migrations and the actual local test dependencies. Eleven functions lack a tracked Deno lock; remote module payloads are not vendored. Neither a successful archive nor local tests proves complete deployed-source/dependency identity. The supported deployed export/support route remains required. Never bypass UnsafeFunctionDownloadPathError.

## Reproduce without Docker or Deno

From the reviewed tooling branch, use new destinations each time:

```sh
python3 -B scripts/repo-functions-rehearsal.py export /tmp/taskbar-hero-repo-source-a.tgz
python3 -B scripts/repo-functions-rehearsal.py export /tmp/taskbar-hero-repo-source-b.tgz
cmp /tmp/taskbar-hero-repo-source-a.tgz /tmp/taskbar-hero-repo-source-b.tgz
python3 -B scripts/repo-functions-rehearsal.py restore /tmp/taskbar-hero-repo-source-a.tgz /tmp/taskbar-hero-repo-restored --test
```

Each export returns its commit and archive SHA-256. Tar/gzip timestamps, ownership and file order are fixed. Restore verifies every path, mode and content hash before writing; rejects symlinks/traversal/duplicates; and refuses an existing destination. It removes inherited project credential variables before the optional tests. Tests install the pinned Node lockfile, run the strict Deno-import guard and run all Supabase unit/PGlite tests. They use disposable fixtures, no hosted database and no wallet signature. They are not a native Deno/Supabase gateway test.

## Native local Supabase path when Docker becomes available

The session found a Docker binary but no running daemon, and no Deno runtime. No hosted function was downloaded and no native edge-runtime success is claimed. On a later local-only machine:

1. Restore a verified archive to a new directory with the command above. Inspect its SOURCE-MANIFEST.json and the missing-lock list. Obtain the complete deployed backup separately before treating anything as a deployment rollback bundle.
2. Start Docker Desktop. In the restored directory run `supabase start` using the installed supported CLI; its endpoint must be loopback. Local CLI status can display disposable local keys: do not paste them into chat, commit logs or use hosted credentials.
3. Prepare a local-only environment file outside the repository, using only disposable local stack credentials and synthetic auth/game secrets. Consult the checked-in config and per-function maps; do not reuse live values. Serve with `supabase functions serve --env-file /absolute/path/to/local-only.env`. This is local serve, never `functions deploy` or a project link.
4. In another terminal run `npx -y pnpm@10.28.0 --filter @taskbar-hero/supabase-tests test` and the strict import guard. Unit tests continue to use PGlite; separately verify the loopback gateway's CORS and missing-dependency response before claiming native gateway coverage. No hosted probe is part of this script.
5. Stop only this local Supabase stack using `supabase stop`. Preserve the manifest and sanitized result counts, never local credentials. Full native gateway and deployed-backup restore evidence remain pending.

Do not use the disposable SQL gameplay rollback on a live database. SINGLE2's local cutover rehearsal retains shared nonce/voucher/budget protections and verifies sentinel v1 balances after removing only disposable v2 gameplay objects.
