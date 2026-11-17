"""Resume only supplemental 900p layouts; never overwrite completed audio films."""
from pathlib import Path
from datetime import datetime, timezone
import json
import subprocess

root = Path(__file__).resolve().parents[3]
review = root / 'reports/v4-art/REVIEW/A7/yarn-giant'
report = {'started': datetime.now(timezone.utc).isoformat(), 'steps': []}
for fixture in ['wave3', 'wave1', 'boss']:
    output = review / 'raw' / (fixture + '-900')
    metadata = output / fixture / 'capture.json'
    if metadata.exists():
        data = json.loads(metadata.read_text())
        assert data['width'] == 1440 and data['height'] == 900 and data['parity']
        report['steps'].append({'fixture': fixture, 'status': 'existing complete metadata retained'})
        continue
    if output.exists():
        retained = output.with_name(output.name + '-interrupted-20261116T1426')
        assert not retained.exists(), 'Do not overwrite an earlier interrupted capture'
        output.rename(retained)
    log = root / 'reports/v4-art/jobs' / ('a7-yarn-' + fixture + '-900-resume.log')
    command = ['node', 'scripts/v3a2/battle-capture.mjs', '--fixture', fixture,
               '--width', '1440', '--height', '900', '--seconds', '30', '--complete-actions', '--out', str(output)]
    with log.open('wb') as stream:
        result = subprocess.run(command, cwd=root, stdout=stream, stderr=subprocess.STDOUT)
    report['steps'].append({'fixture': fixture, 'exitCode': result.returncode, 'log': str(log)})
    (review / 'layout-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
    print(fixture + '_900_EXIT=' + str(result.returncode), flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)
report['finished'] = datetime.now(timezone.utc).isoformat()
(review / 'layout-jobs.json').write_text(json.dumps(report, indent=2) + '\n')
