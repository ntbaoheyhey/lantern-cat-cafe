"""Capture a command and its real exit status without shell interpolation."""
import pathlib
import shlex
import subprocess
import sys

root = pathlib.Path(__file__).resolve().parents[3]
name, *command = sys.argv[1:]
result = subprocess.run(command, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
log = f'$ {shlex.join(command)}\n'.encode() + result.stdout + f'\nEXIT: {result.returncode}\n'.encode()
(root / 'reports/scorecard/CXL1/logs' / f'{name}.log').write_bytes(log)
print(log.decode(errors='replace'))
sys.exit(result.returncode)
