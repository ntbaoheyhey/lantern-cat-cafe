"""Update only reviewed L5 portraits; preserve L6 art and its receipts."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('--round', type=int, required=True)
p.add_argument('--owners', required=True)
p.add_argument('--batch', required=True)
a = p.parse_args()
root = Path(__file__).resolve().parents[2]
art = root/'reports/cardrpg-look/rounds/art'
packed = art/f'portraits/packed-round-{a.round}'
assert (packed/'REVIEW.md').is_file(), 'Personally reviewed selection required'
owners = a.owners.split(',')
assert len(owners) == len(set(owners))
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
load = lambda path: json.loads(path.read_text())
packing = load(packed/'packing.json')
manifest_path = root/'apps/web/src/game/cardrpg/look-assets.json'
manifest = load(manifest_path)
old_manifest_sha = sha(manifest_path)
records = []
for owner in owners:
    assert owner in manifest['portraits']
    row = next(r for r in packing['images'] if r['id'] == owner)
    render_path = art/f'portraits/round-{a.round}/{owner}.json'
    render = load(render_path)
    assert sha(root/row['source']) == row['sourceSha256'] == render['sha256']
    assert sha(root/render['source']) == render['sourceSha256']
    assert render['scriptSha256'] == sha(art/f'sources/round-{a.round}/art-portraits.py')
    outputs = {}
    for scale, info in row['outputs'].items():
        source = root/info['file']
        assert sha(source) == info['sha256']
        image = Image.open(source).convert('RGBA')
        assert list(image.size) == info['size']
        assert hashlib.sha256(image.tobytes()).hexdigest() == info['rgbaSha256']
        outputs[scale] = {**info, 'file': f'assets/cardrpg-look/portraits/{owner}-{scale}.webp'}
    records.append((owner,row,render,outputs))

archive = art/f'l5/{a.batch}-before'
assert not archive.exists(), 'Preserve existing delivery; choose a new batch receipt'
paths = [manifest_path, root/'assets/cardrpg-look/portraits/packing.json']
for owner, _, _, outputs in records:
    paths += [root/info['file'] for info in outputs.values()]
    paths += [root/f'assets/cardrpg-look/portraits/{owner}-{suffix}.json' for suffix in ['render','packing']]
for path in paths:
    target = archive/path.relative_to(root)
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(path,target)

index_path = root/'assets/cardrpg-look/portraits/packing.json'
index = load(index_path)
for owner,row,render,outputs in records:
    for scale, info in outputs.items():
        shutil.copy2(root/row['outputs'][scale]['file'], root/info['file'])
    directory = root/'assets/cardrpg-look/portraits'
    (directory/f'{owner}-render.json').write_text(json.dumps({**render, 'tier':'improved-roster-model',
        'selectedRound':a.round, 'sourceRender':row['source'],
        'status':'L5 reviewed static portrait; runtime acceptance separate'},indent=2)+'\n')
    (directory/f'{owner}-packing.json').write_text(json.dumps({'sourceRender':row['source'],
        'sourceSha256':row['sourceSha256'],'outputs':outputs,'decodeExact':True},indent=2)+'\n')
    index['images'][owner] = {'round':a.round,'sourceRender':row['source'],'outputs':outputs}
    manifest['portraits'][owner] = {'id':owner, 'portrait':{
        '1x':outputs['1x']['file'], '2x':outputs['2x']['file'], 'display':[256,320],
        'sizes':[[256,320],[512,640]],'renderSource':render['source'],
        'modelSha256':render['sourceSha256'],'sourceRender':[1024,1280]},
        'tier':'improved-roster-model','provenance':{'round':a.round,'sourceRender':row['source'],
        'sourceSha256':row['sourceSha256'],'authorSha256':render['scriptSha256'],
        'deliveredSha256':{scale:info['sha256'] for scale,info in outputs.items()}}}
index['phase'] = 'L5'
index_path.write_text(json.dumps(index,indent=2)+'\n')
manifest['phase'] = 'L5'
improved = sum(row['tier']=='improved-roster-model' for row in manifest['portraits'].values())
manifest['note'] = (f'Complete 12-portrait/48-skill/4-plate contract. Three look-slice heroes and {improved} '
    f'improved roster models; {9-improved} inherited roster portraits still await L5. '
    'Portrait selection does not imply runtime/performance acceptance. Lane A owns card-screen adapters.')
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
receipt = {'batch':a.batch,'owners':owners,'round':a.round,'beforeManifestSha256':old_manifest_sha,
    'manifestSha256':sha(manifest_path),'archive':str(archive.relative_to(root)),
    'review':str((packed/'REVIEW.md').relative_to(root)),
    'bytes':sum(info['bytes'] for _,_,_,outputs in records for info in outputs.values()),
    'files':{info['file']:info['sha256'] for _,_,_,outputs in records for info in outputs.values()}}
(art/f'l5/{a.batch}-delivery.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
