"""Compare main and this checkout without changing refs or using an outside worktree."""
from pathlib import Path
import datetime
import json
import subprocess
import tempfile

root = Path(__file__).resolve().parents[3]
logs = root / "reports/scorecard/cxn3/logs"
base = subprocess.check_output(["git", "rev-parse", "origin/main"], cwd=root, text=True).strip()


def check(label, cwd, args):
    command = ["node", "scripts/check-links.mjs", *args]
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True)
    (logs / f"links-{label}.log").write_text(
        f"UTC {datetime.datetime.now(datetime.timezone.utc).isoformat()}\nbase={base}\n"
        f"$ {' '.join(command)}\n{result.stdout}{result.stderr}\nEXIT_CODE={result.returncode}\n")
    print(f"{label}: exit {result.returncode}", flush=True)
    return json.loads(result.stdout) if args == ["--json"] else None


with tempfile.TemporaryDirectory(prefix=".cxn3-main-links-", dir=root) as directory:
    scratch = Path(directory)
    # The checker only inspects existence for link targets. Restore exact main docs/checker;
    # other tracked files need only an empty placeholder, avoiding unrelated file contents.
    files = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", base], cwd=root, text=True).splitlines()
    for file in files:
        # Protected references are unchanged from main; do not copy their contents.
        if file.startswith(".github/"):
            if not (scratch / ".github").exists():
                (scratch / ".github").symlink_to(root / ".github", target_is_directory=True)
            continue
        if Path(file).name.startswith(".env"):
            path = scratch / file
            path.parent.mkdir(parents=True, exist_ok=True)
            path.symlink_to(root / file)
            continue
        path = scratch / file
        path.parent.mkdir(parents=True, exist_ok=True)
        path.touch()
        if file == "README.md" or file.startswith("docs/") and file.endswith(".md") or file == "scripts/check-links.mjs":
            path.write_bytes(subprocess.check_output(["git", "show", f"{base}:{file}"], cwd=root))
    main = check("main", scratch, ["--json"])
current = check("current", root, ["--json"])
check("touched", root, ["docs/cutover-v2.md", "docs/go-live.md", "docs/runbook.md", "docs/deploy.md"])
assert main["brokenCount"] == current["brokenCount"] == 1
assert main["brokenItems"] == current["brokenItems"]
print("main:", main)
print("current:", current)
