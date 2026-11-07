"""Build a selective publication manifest AFTER the L5 coordinator and audit finish.

Every original stays local. Publish all author-round images/source, actual
turntable frames/videos, committed stills and motion overview sheets; retain
intermediate GLBs, pilot HTMLs and unselected raw pilot/pose captures locally.
"""
import hashlib,json
from pathlib import Path

base=Path('reports/cardrpg-look')
assert (base/'validation/l5/audit.json').exists(), 'Finish phase audit before inventory'
roots=[base/'rounds/roster',base/'rounds/opponents',base/'validation/l5',
       *[base/f'turntables/{name}' for name in ['l5','l5-opponents','l5-corrections']],
       base/'rounds/art/l5',*[base/f'rounds/art/{name}/round-{n}' for name in ['portraits','sources'] for n in [4,5]],
       *[base/f'rounds/art/portraits/packed-round-{n}' for n in [4,5]]]
portable,local=[],[]
for root in roots:
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.name=='evidence-inventory.json':continue
        relative=str(path.relative_to(base))
        reason=None
        if path.suffix=='.html':reason='Intermediate or failed pilot artifact; exact original retained locally with source/build receipt.'
        elif path.suffix=='.glb':reason='Intermediate authoring/compression export; original retained locally. Selected raw/packed runtime models are already committed under assets.'
        elif path.suffix=='.png' and relative.startswith('validation/l5/'):
            keep=('phase-stills/' in relative or '/review-sheets/' in relative or '/sheets/' in relative
                  or '/studio/' in relative or '/comparison/' in relative
                  or '/portraits-' in relative or '/art-browser/' in relative
                  or ('/phase-' in relative and '-poses/' in relative and path.name.endswith('-36.png')))
            if not keep:reason='Original raw pilot/pose screenshot retained locally; portable selection includes full phase stills, all phase contact sheets and each action at36%.'
        elif path.suffix=='.pyc':reason='Preserved intermediate Python bytecode; source is portable.'
        data=path.read_bytes()
        row={'path':str(path),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
        if reason:row['reason']=reason;local.append(row)
        else:portable.append(row)
receipt={'policy':__doc__.strip(),'portableFiles':len(portable),'portableBytes':sum(row['bytes'] for row in portable),
         'localOnlyFiles':len(local),'localOnlyBytes':sum(row['bytes'] for row in local),'portable':portable,'localOnly':local}
(base/'validation/l5/evidence-inventory.json').write_text(json.dumps(receipt,indent=2)+'\n')
Path('/tmp/cardrpg-look-l5-stage-files.txt').write_text('\n'.join(row['path'] for row in portable)+'\n')
print(json.dumps({key:value for key,value in receipt.items() if key not in ['portable','localOnly']}))
