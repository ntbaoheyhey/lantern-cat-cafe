"""Run an explicitly supplied scoped command, preserving cwd, public env and exit."""
import datetime
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys

root = Path(__file__).resolve().parents[4]
name, *command = sys.argv[1:]
env = dict(os.environ, VITE_SUPABASE_URL='', VITE_SUPABASE_ANON_KEY='', E2E_PORT_CLASSIC='4380', E2E_PORT_V2='4381', E2E_PORT_SERVER='4382', E2E_PORT_API='4383')
settings = {key: env[key] for key in ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'E2E_PORT_CLASSIC', 'E2E_PORT_V2', 'E2E_PORT_SERVER', 'E2E_PORT_API', 'E2E_VIEWPORT', 'SCREENSHOTS'] if key in env}
record = {'name': name, 'cwd': str(root), 'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(), 'command': shlex.join(command), 'environment': settings, 'started': datetime.datetime.now(datetime.timezone.utc).isoformat()}
if 'test:e2e' in command:
    listeners = subprocess.run(['lsof', '-nP', '-iTCP:4380', '-iTCP:4381', '-iTCP:4382', '-iTCP:4383', '-sTCP:LISTEN'], capture_output=True, text=True)
    if listeners.returncode != 1:
        raise RuntimeError('Assigned ports are not free; inspect owned listeners before proceeding: ' + listeners.stdout)
log = Path(__file__).parent / 'logs' / f'{name}.log'
with log.open('w') as output:
    output.write(json.dumps(record) + '\n')
    output.flush()
    result = subprocess.run(command, cwd=root, env=env, stdout=output, stderr=subprocess.STDOUT)
    record['exit'] = result.returncode
    record['finished'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    output.write(f'\nEXIT: {result.returncode}\n')
with (Path(__file__).parent / 'commands.jsonl').open('a') as output:
    output.write(json.dumps(record) + '\n')
print(json.dumps(record), flush=True)
print('\n'.join(log.read_text().splitlines()[-8:]), flush=True)
sys.exit(result.returncode)
