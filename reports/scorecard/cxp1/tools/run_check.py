"""Run an explicit argv and retain its command, cwd, raw output and exit code."""
import datetime
import pathlib
import shlex
import subprocess
import sys

root = pathlib.Path(__file__).resolve().parents[4]
name, cwd, *command = sys.argv[1:]
log = root / 'reports/scorecard/cxp1/logs' / (name + '.log')
with log.open('w') as output:
    output.write(f'UTC: {datetime.datetime.now(datetime.timezone.utc).isoformat()}\n')
    output.write(f'CWD: {cwd}\n$ {shlex.join(command)}\n')
    output.flush()
    result = subprocess.run(command, cwd=root / cwd, stdout=output, stderr=subprocess.STDOUT)
    output.write(f'\nEXIT: {result.returncode}\n')
print(log.relative_to(root))
print('\n'.join(log.read_text().splitlines()[-16:]))
sys.exit(result.returncode)
