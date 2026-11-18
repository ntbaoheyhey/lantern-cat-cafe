#!/usr/bin/env python3
"""Install a local study only after verifying identities and preserving the prior artifact."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('new_build', type=Path)
    parser.add_argument('previous_build', type=Path)
    parser.add_argument('label')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    assert re.fullmatch(r'v8-[a-z0-9-]+', args.label)
    assert not any((Path('/Users/bao/taskbar-hero-mailbox')/name).exists() for name in ('STOP-ALL','STOP-CXI'))
    now = datetime.now(timezone.utc)
    digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    build, previous = (json.loads(path.read_text()) for path in (args.new_build,args.previous_build))
    assert re.fullmatch(r'[a-f0-9]{40}',build['sourceCommit'])
    assert not build['productionRegistryChanged'] and not previous['productionRegistryChanged']
    assert {x['url']:x['sha256'] for x in build['files']} == {x['url']:x['sha256'] for x in previous['files']}, 'This installer preserves all six media payloads'
    assert len(build['files']) == 6
    for source in build['runtimeSources']:
        assert digest(Path(source['path'])) == source['sha256']
    assert not subprocess.check_output(['git','diff',build['sourceCommit'],'--','apps/web/src','packages/game-rules/src'],cwd=root)
    assert json.loads((root/'apps/web/src/game/cardrpg/spine/designer-idle-registry.json').read_text()) == {}
    active = root/'apps/web/dist'
    assert digest(active/'index.html') == previous['indexSha256']
    inventory = lambda base: {str(path.relative_to(base)):dict(bytes=path.stat().st_size,sha256=digest(path)) for path in sorted(base.rglob('*')) if path.is_file()}
    prior_inventory = inventory(active)
    assert prior_inventory == inventory(Path(previous['dist']))
    current_inventory = inventory(Path(build['dist']))
    assert current_inventory['index.html']['sha256'] == build['indexSha256']
    stamp = now.strftime('%H%M%S')
    staged = root/('apps/web/dist.'+args.label+'-'+stamp)
    preserved = root/('work/v5/CXI/releases/'+args.label+'-prior-'+stamp+'-dist')
    receipt = root/('reports/v5/CXI/evidence/'+args.label+'-install.json')
    inventory_path = args.new_build.parent/'installed-inventory.json'
    assert not any(path.exists() for path in (staged,preserved,receipt,inventory_path))
    shutil.copytree(build['dist'],staged)
    assert inventory(staged) == current_inventory
    active.rename(preserved)
    try:
        staged.rename(active)
    except Exception:
        preserved.rename(active)
        raise
    url = 'http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3'
    assert hashlib.sha256(urllib.request.urlopen(url,timeout=10).read()).hexdigest() == build['indexSha256']
    assert inventory(active) == current_inventory
    inventory_path.write_text(json.dumps(current_inventory,sort_keys=True)+'\n')
    report = dict(utc=now.isoformat(),url=url,buildPath=str(args.new_build.resolve()),
                  buildSha256=digest(args.new_build),sourceCommit=build['sourceCommit'],indexSha256=build['indexSha256'],
                  previousSourceCommit=previous['sourceCommit'],preserved=str(preserved),
                  previousFiles=len(prior_inventory),previousBytes=sum(x['bytes'] for x in prior_inventory.values()),
                  files=len(current_inventory),bytes=sum(x['bytes'] for x in current_inventory.values()),
                  fullInventoriesMatch=True,commissionedPayloadsUnchanged=6,
                  inventory=dict(path=str(inventory_path.resolve()),sha256=digest(inventory_path)),
                  productionRegistryEmpty=True,localPreviewOnly=True,productionAcceptance=False,artAcceptance=False)
    receipt.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
