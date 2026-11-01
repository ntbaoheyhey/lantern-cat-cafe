"""Isolate the Deno generator defect without editing the checkout's functions or generator."""
from pathlib import Path
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parents[3]
logs = root / "reports/scorecard/cxn3/logs"
paths = ["scripts/check-deno-imports.mjs", "scripts/gen-deno-json.mjs",
         "packages/game-rules/src", "packages/api-contract/src", "packages/chain/src",
         "packages/auth/src", "packages/chain/deployments",
         "supabase/functions"]
transcript = []


def run(command, cwd):
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True)
    transcript.append("$ " + " ".join(command) + "\n" + result.stdout + result.stderr + f"\nEXIT_CODE={result.returncode}\n")
    return result


try:
    assert run(["git", "diff", "--exit-code", "origin/main", "--", *paths], root).returncode == 0
    with tempfile.TemporaryDirectory(prefix=".cxn3-import-", dir=root) as directory:
        scratch = Path(directory)
        files = subprocess.check_output(["git", "ls-files", "--", *paths], cwd=root, text=True).splitlines()
        for file in files:
            dest = scratch / file
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(root / file, dest)
        before = run(["node", "scripts/check-deno-imports.mjs"], scratch)
        assert before.returncode == 1
        edges = before.stderr.strip().splitlines()
        assert len(edges) == 80
        assert len({edge.split(":")[0] for edge in edges}) == 16
        assert len({edge.split(": ", 1)[1] for edge in edges}) == 5
        generator = scratch / "scripts/gen-deno-json.mjs"
        source = generator.read_text()
        omitted = " && entry.name !== 'index.ts'"
        assert source.count(omitted) == 1
        generator.write_text(source.replace(omitted, ""))
        transcript.append("Scratch generator only: removed exclusion ` && entry.name !== 'index.ts'`.\n")
        assert run(["node", "scripts/gen-deno-json.mjs"], scratch).returncode == 0
        after = run(["node", "scripts/check-deno-imports.mjs"], scratch)
        assert after.returncode == 0
        assert after.stdout.strip() == "Deno import guard: 18 functions clean"
    assert run(["git", "diff", "--exit-code", "origin/main", "--", *paths], root).returncode == 0
    transcript.append("Scratch removed. Checkout generator, maps and function sources unchanged.\n")
finally:
    (logs / "import-diagnostic.log").write_text("\n".join(transcript))
print("80 unresolved edges / 16 maps / 5 import sites; scratch alias repair resolves all 18 functions. Checkout unchanged.")
