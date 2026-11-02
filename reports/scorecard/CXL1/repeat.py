"""Ten sequential repetitions of the new pure tests; not an application e2e gate."""
import pathlib
import subprocess
root = pathlib.Path(__file__).resolve().parents[3]
for index in range(1, 11):
    command = ['python3', 'reports/scorecard/CXL1/run.py', f'repeat-{index:02}', 'pnpm', '--filter', '@taskbar-hero/game-rules', 'test', 'src/v2/codex']
    result = subprocess.run(command, cwd=root, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr
    print(f'Repetition {index}: exit 0; raw output in logs/repeat-{index:02}.log')
print('10/10 targeted repetitions exited 0. No application e2e was run.')
