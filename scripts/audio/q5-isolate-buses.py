#!/usr/bin/env python3
"""Diagnostic-only bus isolation, with owned economy jobs paused for capture."""
import datetime
import json
import os
from pathlib import Path
import signal
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
HANDOFF = Path('/Users/bao/taskbar-hero-cardrpg-a6/reports/v3-solo/HANDOFF-SOLO.md')


def command(pid):
    result = subprocess.run(['ps', '-p', str(pid), '-o', 'command='], capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else ''


def note(message):
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print(stamp, message, flush=True)
    with HANDOFF.open('a') as stream:
        stream.write(f'PERF {stamp}: {message}\n')


paused = []
try:
    while 'q5-render-current.py' in command(68133):
        time.sleep(1)
    for pid in [37303, 59609, 67137]:
        if 'tools/chain/economy-lab/' in command(pid):
            os.kill(pid, signal.SIGSTOP)
            paused.append(pid)
    note(f'paused owned economy jobs {paused} for diagnostic bus isolation')
    env = os.environ.copy()
    env.update(AUDIO_RUNTIME_ROOT=str(ROOT/'work/v3solo-integration'),
               AUDIO_URL='http://127.0.0.1:5996',
               AUDIO_PYTHON=str(ROOT/'tools/.venv/bin/python'),
               AUDIO_SCENES='battle', AUDIO_SECONDS='45')
    for label, muted in [('voice', 'sfx,ui'), ('effects', 'voice,ui')]:
        env.update(MIX_TRIAL=f'diagnostic-q5-{label}', DIAGNOSTIC_MUTE_BUSES=muted)
        subprocess.run(['node', 'scripts/audio/render-runtime.mjs'], cwd=ROOT, env=env, check=True)
finally:
    for pid in paused:
        if 'tools/chain/economy-lab/' in command(pid):
            os.kill(pid, signal.SIGCONT)
    note(f'resumed owned economy jobs {paused} after diagnostics')
