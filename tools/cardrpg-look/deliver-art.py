"""Publish explicitly reviewed Blender rounds into the version-2 art contract."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('selection', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
art = root / 'reports/cardrpg-look/rounds/art'
selection = json.loads(args.selection.read_text())
assert selection['personallyReviewed'] is True
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
expected = {'portraits': 12, 'icons': 48, 'frames': 4}
compositions = json.loads((root / 'tools/cardrpg-look/blender/icon-compositions.json').read_text())
expected_ids = {
    'icons': {row['id'] for row in compositions['rows']},
    'portraits': {row['id'].split('-')[0] for row in compositions['rows']},
    'frames': {'common', 'rare', 'epic', 'legendary'},
}
sources = {}
for kind, count in expected.items():
    choices = selection[kind]
    assert len(choices) == count
    assert set(choices) == expected_ids[kind], kind
    for name, round_number in choices.items():
        packed = art / kind / f'packed-round-{round_number}'
        packing = json.loads((packed / 'packing.json').read_text())
        row = next(row for row in packing['images'] if row['id'] == name)
        source = art / kind / f'round-{round_number}' / f'{name}.png'
        assert sha(source) == row['sourceSha256'], name
        archived = art / 'sources' / f'round-{round_number}'
        if kind == 'icons':
            receipts = [json.loads(p.read_text()) for p in source.parent.glob('receipt-*.json')]
            receipt = next(r for r in receipts if any(item['id'] == name for item in r['rows']))
            image_receipt = next(r for r in receipt['rows'] if r['id'] == name)
            assert image_receipt['sha256'] == sha(source)
            assert receipt['solidAuthorSha256'] == sha(archived / 'icon_solids.py')
            assert receipt['formsSha256'] == sha(art / 'sources/icon-forms.json')
        else:
            receipt = json.loads(source.with_suffix('.json').read_text())
            assert receipt['sha256'] == sha(source)
            if kind == 'portraits':
                assert sha(root / receipt['source']) == receipt['sourceSha256']
        assert receipt['scriptSha256'] == sha(archived / f'art-{kind}.py')
        outputs = {}
        directory = root / 'assets/cardrpg-look' / kind
        for scale in (1, 2):
            info = row['outputs'][f'{scale}x']
            path = root / info['file']
            assert sha(path) == info['sha256']
            im = Image.open(path).convert('RGBA')
            assert list(im.size) == info['size']
            assert hashlib.sha256(im.tobytes()).hexdigest() == info['rgbaSha256']
            delivered = directory / f'{name}-{scale}x.webp'
            outputs[f'{scale}x'] = {**info, 'file': str(delivered.relative_to(root))}
        sources[(kind, name)] = {'round': round_number, 'sourceRender': str(source.relative_to(root)),
                                'sourceSha256': sha(source), 'receipt': receipt, 'outputs': outputs}

# Validate every image and source before replacing any runtime delivery.
historical = art / 'before/portrait-receipts'
historical.mkdir(parents=True, exist_ok=True)
for path in (root / 'assets/cardrpg-look/portraits').glob('*.json'):
    archived = historical / path.name
    if not archived.exists():
        shutil.copy2(path, archived)
for (kind, name), record in sources.items():
    for scale, info in record['outputs'].items():
        source = art / kind / f"packed-round-{record['round']}" / f'{name}-{scale}.webp'
        target = root / info['file']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    directory = root / 'assets/cardrpg-look' / kind
    (directory / f'{name}-render.json').write_text(json.dumps({
        **record['receipt'], 'status': 'Source render selected for L6; runtime validation separate',
        'selectedRound': record['round'], 'sourceRender': record['sourceRender'],
    }, indent=2) + '\n')
    (directory / f'{name}-packing.json').write_text(json.dumps({
        'sourceRender': record['sourceRender'], 'sourceSha256': record['sourceSha256'],
        'outputs': record['outputs'], 'decodeExact': True,
    }, indent=2) + '\n')
for kind in expected:
    index = {name: {'round': record['round'], 'sourceRender': record['sourceRender'],
                    'outputs': record['outputs']}
             for (row_kind, name), record in sources.items() if row_kind == kind}
    (root / 'assets/cardrpg-look' / kind / 'packing.json').write_text(json.dumps({
        'phase': 'L6', 'kind': kind, 'images': index,
        'note': 'Prior portrait receipts preserved in reports/cardrpg-look/rounds/art/before/portrait-receipts',
    }, indent=2) + '\n')

manifest = {'version': 2, 'style': 'Lantern atelier', 'complete': True, 'phase': 'L6',
            'pathBase': 'repository-root', 'portraits': {}, 'frames': {}, 'skills': {}, 'atlases': {}}
for (kind, name), record in sources.items():
    one, two = [record['outputs'][f'{scale}x']['file'] for scale in (1, 2)]
    provenance = {key: record[key] for key in ('round', 'sourceRender', 'sourceSha256')}
    provenance['authorSha256'] = record['receipt']['scriptSha256']
    provenance['deliveredSha256'] = {scale: info['sha256'] for scale, info in record['outputs'].items()}
    if kind == 'portraits':
        receipt = record['receipt']
        manifest[kind][name] = {'id': name, 'portrait': {'1x': one, '2x': two, 'display': [256, 320],
            'sizes': [[256, 320], [512, 640]], 'renderSource': receipt['source'],
            'modelSha256': receipt['sourceSha256'], 'sourceRender': [1024, 1280]},
            'tier': receipt['tier'], 'provenance': provenance}
    elif kind == 'frames':
        manifest[kind][name] = {'id': name, 'plate1x': one, 'plate2x': two,
                               'display': [256, 320], 'sizes': [[256, 320], [512, 640]],
                               'ornament': record['receipt']['ornament'], 'provenance': provenance}
    else:
        manifest['skills'][name] = {'id': name, 'icon1x': one, 'icon2x': two,
                                    'display': [64, 64], 'sizes': [[64, 64], [128, 128]],
                                    'provenance': provenance, 'atlas': {}}

for scale in (1, 2):
    side, padding = 64 * scale, 2 * scale
    stride = side + padding * 2
    image = Image.new('RGBA', (8 * stride, 6 * stride))
    for index, (name, row) in enumerate(sorted(manifest['skills'].items())):
        x, y = (index % 8) * stride + padding, (index // 8) * stride + padding
        icon = Image.open(root / row[f'icon{scale}x']).convert('RGBA')
        image.paste(icon, (x, y))
        row['atlas'][f'{scale}x'] = {'rect': [x, y, side, side], 'padding': padding}
    path = root / f'assets/cardrpg-look/icons/skills-atlas-{scale}x.webp'
    image.save(path, 'WEBP', lossless=True, exact=True, method=6)
    assert Image.open(path).convert('RGBA').tobytes() == image.tobytes()
    manifest['atlases'][f'skills{scale}x'] = {'file': str(path.relative_to(root)),
                                            'size': list(image.size), 'sha256': sha(path)}
manifest['note'] = ('Complete 12-portrait/48-skill/4-plate image contract. Three sculpted hero models; '
                    'nine inherited game models receive new studio portraits and remain awaiting L5 sculpture. '
                    'Availability is separate from runtime/performance and visual acceptance. '
                    'Frames and icons need adoption by lane A; portrait keys preserve its existing adapter.')
target = root / 'apps/web/src/game/cardrpg/look-assets.json'
target.write_text(json.dumps(manifest, indent=2) + '\n')
receipt = {'selection': str(args.selection), 'selectionSha256': sha(args.selection),
           'manifestSha256': sha(target), 'counts': expected,
           'individualBytes': sum(o['bytes'] for r in sources.values() for o in r['outputs'].values()),
           'files': {o['file']: {'sha256': o['sha256'], 'bytes': o['bytes']}
                     for r in sources.values() for o in r['outputs'].values()}}
(art / 'delivery.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'counts': expected, 'bytes': receipt['individualBytes'], 'manifestSha256': sha(target)}))
