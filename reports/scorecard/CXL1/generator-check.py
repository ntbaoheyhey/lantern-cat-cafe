"""Exercise the documented CLI without retaining its large generated JSON."""
import hashlib
import json
import pathlib
import subprocess
import tempfile
root = pathlib.Path(__file__).resolve().parents[3]
with tempfile.TemporaryDirectory(prefix='json-', dir=root / 'reports/scorecard/CXL1') as temp:
    out = pathlib.Path(temp) / 'codex.json'
    command = ['node', 'scripts/gen-codex-json.mjs', '--out', str(out.relative_to(root))]
    result = subprocess.run(command, cwd=root, capture_output=True, text=True)
    print('$ ' + ' '.join(command))
    print(result.stdout + result.stderr + f'EXIT: {result.returncode}')
    assert result.returncode == 0
    raw = out.read_bytes()
    data = json.loads(raw)
    assert len(data['entries']) == 209
    assert len(data['chestOdds']) == 10
    print(f'Parsed entries: {len(data["entries"])}; chest IDs: {len(data["chestOdds"])}; bytes: {len(raw)}')
    print(f'SHA-256: {hashlib.sha256(raw).hexdigest()}')
    print('Generated JSON exceeds 200 KB; excluded from delivery and removed on exit.' if len(raw) > 200_000 else 'Generated JSON removed on exit; no generated artifact committed.')
