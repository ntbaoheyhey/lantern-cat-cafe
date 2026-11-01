"""Reproduce CXN3 mutations in disposable copies under this checkout; never call live URLs."""
from pathlib import Path
import datetime
import json
import os
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[3]
LOGS = ROOT / "reports/scorecard/cxn3/logs"
SCRIPT = "scripts/check-live.mjs"
DOC = "docs/cutover-v2.md"
SQL = "docs/proposals/sql/check-live-schema.sql"
COPIES = [
    "package.json", "pnpm-workspace.yaml", "README.md", SCRIPT,
    "scripts/check-live.test.mjs", DOC, SQL, "docs/go-live.md", "docs/runbook.md",
    "supabase/tests/package.json", "supabase/tests/vitest.config.ts",
    "supabase/tests/global-setup.ts", "supabase/tests/sql/bootstrap.sql",
    "supabase/tests/src/live-schema.test.ts", "supabase/tests/src/game-db.ts",
    "supabase/tests/src/standalone-db.ts",
]
LINKS = [".github", "packages", "node_modules", "supabase/tests/node_modules",
         "supabase/migrations", "supabase/functions"]
MUTANTS = [
    ("anonymous-500", SCRIPT, "status === 401 :", "[401, 500].includes(status) :", "unsigned POST requires exactly 401"),
    ("oversized-401", SCRIPT, "[400, 413].includes(status)", "[400, 401, 413].includes(status)", "oversized body requires 400 or 413"),
    ("cors-origin", SCRIPT, "allowedOrigin === origin", "Boolean(allowedOrigin)", "preflight requires 2xx"),
    ("budget-hint", SCRIPT, "budgets migration missing?", "service unavailable", "503 fails with a budget migration hint"),
    ("network-pass", SCRIPT, "{ ok: false, detail: 'network error' }", "{ ok: true, detail: 'network error' }", "network errors fail"),
    ("missing-route", SCRIPT, "['v2-boss-fight', 'v2-choose-class'", "['v2-choose-class'", "all nine routes get three probes"),
    ("small-body", SCRIPT, "'x'.repeat(8193)", "'x'.repeat(8000)", "all nine routes get three probes"),
    ("missing-migration", DOC, "| [20261107000000_voucher_race_guard.sql]", "REMOVED [20261107000000_voucher_race_guard.sql]", "migration table matches the branch exactly"),
    ("user-only-authority", DOC, "user-approved mission section 7", "user-only deployment", "optional release follows section 7"),
    ("wrong-existing-table", SQL, "('public.cat_state')", "('public.players')", "all 17 expected objects are present"),
    ("missing-cxn1-signature", SQL, "public.game_voucher_reissue_resolve(uuid,bigint,uuid,boolean)", "public.game_voucher_reissue_resolve(uuid,bigint,uuid,text)", "all 17 expected objects are present"),
]


def run(name, target=None, before=None, after=None, witness=None, schema=False):
    with tempfile.TemporaryDirectory(prefix=".cxn3-mutant-", dir=ROOT) as directory:
        scratch = Path(directory)
        for file in COPIES:
            dest = scratch / file
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / file, dest)
        for file in LINKS:
            dest = scratch / file
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.symlink_to(ROOT / file, target_is_directory=True)
        if target:
            path = scratch / target
            source = path.read_text()
            assert source.count(before) == 1, (name, "mutation must match exactly once")
            path.write_text(source.replace(before, after, 1))
        env = os.environ.copy()
        for key in ["SITE_URL", "SUPABASE_URL", "FUJI_RPC_URL"]:
            env.pop(key, None)
        env.update({"NO_COLOR": "1", "CI": "true", "VITE_SUPABASE_URL": "", "VITE_SUPABASE_ANON_KEY": ""})
        (scratch / "tmp").mkdir()
        env["TMPDIR"] = str(scratch / "tmp")
        command = (["pnpm", "exec", "vitest", "run", "src/live-schema.test.ts", "--reporter", "verbose", "--silent=false"]
                   if schema else ["node", "--test", "scripts/check-live.test.mjs"])
        cwd = scratch / "supabase/tests" if schema else scratch
        result = subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True)
        output = result.stdout + result.stderr
        # A killed mutant needs an assertion failure in its intended test, not a broken harness.
        failure = re.search(r"(?:✖|not ok \d+ -|FAIL .* >|×).*" + re.escape(witness), output) if target else None
        killed = bool(result.returncode == 1 and failure and ("AssertionError" in output or "ERR_ASSERTION" in output)) if target else None
        text = (f"UTC {datetime.datetime.now(datetime.timezone.utc).isoformat()}\n"
                f"scratch cwd: {cwd.relative_to(ROOT)}\n$ {' '.join(command)}\n")
        if target:
            text += f"mutation: {target}\nBEFORE: {before}\nAFTER: {after}\nexpected failing test: {witness}\n"
        text += output + f"\nEXIT_CODE={result.returncode}\n"
        if target:
            text += f"KILLED={killed}\n"
        (LOGS / f"mutation-{name}.log").write_text(text)
        print(f"{name}: exit {result.returncode}; killed={killed}", flush=True)
        if not target:
            assert result.returncode == 0, f"unmutated control failed: {name}"
        else:
            assert killed, f"survived or harness error: {name}"
        return {"name": name, "file": target, "before": before, "after": after,
                "command": command, "exit": result.returncode, "killed": killed}


if __name__ == "__main__":
    LOGS.mkdir(parents=True, exist_ok=True)
    run("control-node")
    run("control-schema", schema=True)
    results = [run(name, target, before, after, witness, schema=target == SQL)
               for name, target, before, after, witness in MUTANTS]
    (LOGS / "mutations.json").write_text(json.dumps(results, indent=2) + "\n")
    print(f"{len(results)} mutants killed; scratch copies removed.")
