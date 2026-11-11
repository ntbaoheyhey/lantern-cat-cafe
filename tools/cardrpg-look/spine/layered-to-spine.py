"""Published V3 PSD layers -> temporary Spine rig; source package stays read-only.

Uses the extracted, hash-checked PSD pixels and supplied pivots. The authoring
PSD retains editable eye masks; this limited placeholder bakes the setup eye
apertures into derived atlas regions and animates blink, not pupil travel.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image


def smooth(value):
    value = max(0., min(1., value))
    return value * value * (3. - 2. * value)


def manifest_metadata(meta, read, folder, unit_id):
    """Verify a portable extraction against the authoritative PSD, not its label."""
    from psd_tools import PSDImage

    if unit_id != 'clover' or meta.get('character', '').lower() != unit_id:
        raise ValueError('No temporary rig profile for this portable manifest')
    gates = json.loads(read('quality-checks/final-gates.json'))
    if any(gates.get(name, {}).get('pass') is not True for name in ['G0','G1','G2','G3','G4','G5','G7']):
        raise ValueError('Published artwork gate is not complete')
    read('parts-src/PROVENANCE.md')
    read(f'{unit_id}-rig-notes.md')
    read(f'{unit_id}-rig-pivots.json')
    read(f'{unit_id}-rig-3-4-right.psd')
    psd = PSDImage.open(folder / f'{unit_id}-rig-3-4-right.psd')
    raw = [layer for layer in psd.descendants() if not layer.is_group()]
    leaves = {layer.name:layer for layer in raw}
    names = [item['name'] for item in meta['layers']]
    helpers = meta['hidden_reference_layers']
    if len(leaves) != len(raw) or len(set(names)) != len(names) or set(leaves) != set(names+helpers):
        raise ValueError('PSD layer names differ from its portable catalog')
    if list(psd.size) != meta['canvas'] or any(leaves[name].visible for name in helpers):
        raise ValueError('PSD canvas or hidden reference visibility differs')
    # psd-tools yields bottom-to-top order, including numbered group stacking.
    if [layer.name for layer in raw if layer.name not in helpers] != names:
        raise ValueError('PSD draw order differs from its portable catalog')
    layers = {}
    for item in meta['layers']:
        name = item['name']; layer = leaves[name]
        filename = 'parts-src/' + item['file']; read(filename)
        png = Image.open(folder / filename).convert('RGBA')
        pixels = layer.topil().convert('RGBA')
        if list(png.size) != item['size'] or png.size != pixels.size or png.tobytes() != pixels.tobytes():
            raise ValueError(f'{name}: raw PNG differs from published PSD pixels')
        if [layer.left,layer.top] != item['position'] or layer.visible != item['visible']:
            raise ValueError(f'{name}: PSD placement or visibility differs')
        blend = {'normal':b'norm','multiply':b'mul '}.get(item['blend_mode'])
        if blend is None or layer.blend_mode.value != blend or layer.opacity != 255:
            raise ValueError(f'{name}: unsupported or mismatched PSD blend')
        normalized = dict(item, file=filename, psd_pixel_sha256=hashlib.sha256(png.tobytes()).hexdigest())
        mask = item.get('mask')
        if bool(mask) != layer.has_mask():
            raise ValueError(f'{name}: PSD mask differs from its catalog')
        if mask:
            filename = 'parts-src/' + mask['file']; read(filename)
            aperture = Image.open(folder / filename).convert('L')
            psd_mask = layer.mask.topil().convert('L')
            if (list(aperture.size) != mask['size'] or aperture.size != psd_mask.size
                    or aperture.tobytes() != psd_mask.tobytes() or list(layer.mask.bbox[:2]) != mask['position']):
                raise ValueError(f'{name}: aperture differs from its PSD mask')
            normalized.update(aperture_mask=filename, aperture_position=mask['position'])
        layers[name] = normalized
    return dict(meta, layers=layers, order_bottom_to_top=names)


def build(source, out, unit_id):
    source, out = Path(source).resolve(), Path(out).resolve()
    portable = source.name == 'manifest.json' and source.parent.name == 'parts-src'
    folder = source.parent.parent if portable else source.parent
    if out == folder or folder in out.parents:
        raise ValueError('Output must be outside the read-only source package')
    hashes = {}

    def read(name):
        path = (folder / name).resolve()
        if folder not in path.parents or not path.is_file():
            raise ValueError(f'Invalid source path: {name}')
        data = path.read_bytes()
        hashes[name] = hashlib.sha256(data).hexdigest()
        return data

    meta = json.loads(read(str(source.relative_to(folder))))
    if portable:
        meta = manifest_metadata(meta, read, folder, unit_id)
    else:
        read(f'{unit_id}-rig-notes.md')
        gates = json.loads(read(f'{unit_id}-rig-gate-results.json'))
        if not gates.get('overall_pass') or any(not gate.get('pass_gate') for gate in gates.get('gates', {}).values()):
            raise ValueError('Published artwork gate is not complete')
        read('source-records.json')
        read(f'{unit_id}-rig-3-4-right.psd')
        if hashes[f'{unit_id}-rig-3-4-right.psd'] != meta['psd_sha256']:
            raise ValueError('PSD hash differs from its extracted layer catalog')
        if gates.get('psd_sha256') != meta['psd_sha256']:
            raise ValueError('Artwork gates refer to a different PSD revision')
    root = Path(__file__).resolve().parents[3]
    config = json.loads((root / 'assets/cardrpg-look/spine/config.json').read_text())
    unit = next(u for u in json.loads((root / 'assets/cardrpg-look/spine/slots.json').read_text())['units'] if u['id'] == unit_id)
    parts, mask_names = [], []
    for name in meta['order_bottom_to_top']:
        item = meta['layers'][name]
        read(item['file'])
        rgba = Image.open(folder / item['file']).convert('RGBA')
        if list(rgba.size) != item['size'] or hashlib.sha256(rgba.tobytes()).hexdigest() != item['psd_pixel_sha256']:
            raise ValueError(f'{name}: raw PNG differs from published PSD pixels')
        x, y = item['position']
        if item.get('aperture_mask'):
            read(item['aperture_mask'])
            mask = Image.open(folder / item['aperture_mask']).convert('L')
            mx, my = item['aperture_position']
            aperture = np.asarray(mask.crop((x-mx, y-my, x-mx+rgba.width, y-my+rgba.height)), dtype=np.uint16)
            pixels = np.array(rgba)
            pixels[:, :, 3] = ((pixels[:, :, 3].astype(np.uint16)*aperture+127)//255).astype(np.uint8)
            rgba = Image.fromarray(pixels)
            mask_names.append(name)
        box = rgba.getbbox()
        if box is None:
            raise ValueError(f'{name}: empty layer after applying its aperture')
        rgba = rgba.crop(box)
        parts.append(dict(item, name=name, image=rgba, left=x+box[0], top=y+box[1], width=rgba.width, height=rgba.height))
    visible = [p for p in parts if p['visible']]
    top = min(p['top'] for p in visible)
    bottom = max(p['top']+p['height'] for p in visible)
    left = min(p['left'] for p in visible)
    right = max(p['left']+p['width'] for p in visible)
    scale = unit['targetHeight']/(bottom-top)
    origin = [meta['scope_bones']['root'][0], bottom]
    catalog = meta['layers']
    positions = dict(meta['scope_bones'])
    positions['root'] = origin
    positions['torso'] = catalog['torso']['pivot']
    positions['head-pivot'] = positions['head']
    eye_pivots = [catalog[f'eye-{side}-white']['pivot'] for side in ['l', 'r']]
    positions['head'] = [sum(p[0] for p in eye_pivots)/2, sum(p[1] for p in eye_pivots)/2+50]
    parents = {'root': None, 'hip': 'root', 'torso': 'hip', 'head-pivot': 'torso', 'head': 'head-pivot', 'hp-anchor': 'head', 'vfx-origin': 'torso'}
    for side in ['r', 'l']:
        for name, parent in [(f'{side}-arm-upper','torso'), (f'{side}-arm-lower',f'{side}-arm-upper'), (f'{side}-paw',f'{side}-arm-lower'), (f'{side}-thigh','hip'), (f'{side}-leg-lower',f'{side}-thigh'), (f'{side}-foot',f'{side}-leg-lower'), (f'ear-{side}-outer','head')]:
            positions[name] = catalog[name]['pivot']
            parents[name] = parent
    parents.update({'main-hand':'l-paw' if portable else 'r-paw','off-hand':'r-paw' if portable else 'l-paw'})
    for i in range(1, 6):
        name = f'tail-{i}'
        parents[name] = f'tail-{i-1}' if i > 1 else 'hip'
        positions[name] = catalog[name]['pivot']
    extras = [('cloth','torso','dress-skirt-2'), ('teapot','main-hand','teapot-body'), ('collar','torso','clover-brooch'), ('pouch','cloth','pouch-string'), ('hair-tip','head','hair-top-curl')] if portable else [('cloth','hip','skirt-panel-center'), ('shield','off-hand','shield-wood'), ('lantern','shield','lantern-handle'), ('hair-tip','head','hair-top-curl')]
    for name, parent, layer in extras:
        parents[name] = parent
        positions[name] = catalog[layer]['pivot']

    def xy(point):
        return [(point[0]-origin[0])*scale, (origin[1]-point[1])*scale]

    bones, added = [], set()
    while len(added) < len(parents):
        for name, parent in parents.items():
            if name in added or parent and parent not in added:
                continue
            point, base = xy(positions[name]), xy(positions[parent]) if parent else [0, 0]
            bone = {'name':name}
            if parent:
                bone.update(parent=parent, x=point[0]-base[0], y=point[1]-base[1])
            bones.append(bone)
            added.add(name)
    indices = {b['name']:i for i,b in enumerate(bones)}
    transform = meta.get('master_transform')

    def master(point):
        return [(point[i]-transform['offset'][i])/transform['scale'] for i in range(2)]

    if not portable:
        read('rig-support/tail-arc-fields.npz')
        tail_field = np.load(folder / 'rig-support/tail-arc-fields.npz')['arc']
        tail_ranges = json.loads(read('rig-support/tail-cuts.json'))['ranges']
        tail_centers = [0.] + [(r[0]+r[1])/2 for r in tail_ranges[1:5]]

    def tail_weights(point):
        if portable:
            # One continuous field for every overlapping tail layer/shadow.
            candidates = []
            for i in range(1,5):
                start, end = np.array(positions[f'tail-{i}']), np.array(positions[f'tail-{i+1}'])
                delta = end-start
                along = max(0., min(1., float(np.dot(np.array(point)-start,delta)/np.dot(delta,delta))))
                candidates.append((float(np.linalg.norm(np.array(point)-start-delta*along)),i,along))
            _, i, along = min(candidates)
            w = smooth(along)
            return {f'tail-{i}':1-w, f'tail-{i+1}':w}
        mx, my = master(point)
        x, y = max(0., min(tail_field.shape[1]-1., mx)), max(0., min(tail_field.shape[0]-1., my))
        xi, yi = int(x), int(y)
        xj, yj = min(xi+1, tail_field.shape[1]-1), min(yi+1, tail_field.shape[0]-1)
        arc = float((tail_field[yi,xi]*(1-x%1)+tail_field[yi,xj]*(x%1))*(1-y%1)+(tail_field[yj,xi]*(1-x%1)+tail_field[yj,xj]*(x%1))*(y%1))
        for i in range(4):
            if arc <= tail_centers[i+1]:
                w = smooth((arc-tail_centers[i])/(tail_centers[i+1]-tail_centers[i]))
                return {f'tail-{i+1}':1-w, f'tail-{i+2}':w}
        return {'tail-5':1.}

    neck = {'neck','neck-shadow','chest-ruff-1','chest-ruff-2','apron-bib','apron-shadow','strap-r','strap-l'}
    cloth = {'side-flap','bow-loop-r','bow-tail-r','bow-tail-l','skirt-panel-r','skirt-panel-center','skirt-panel-l'}
    if portable:
        neck = {'neck','chest-ruff-1','chest-ruff-2'}
        cloth = {p['name'] for p in parts if p['region']=='dress' and not p['name'].startswith(('belt','pouch','dress-strap','dress-bib'))}

    def arm_side(p):
        if p['region']=='arms':
            return p['name'][0]
        if portable and p['name'].startswith(('sleeve-','cuff-')):
            return p['name'][-1]
        return None

    def bone_for(p):
        name = p['name']
        if name in parents:
            return name
        if portable:
            side = arm_side(p)
            if side:
                return side+'-paw' if 'paw' in name else side+'-arm-lower' if 'lower' in name or 'cuff' in name or 'shadow' in name else side+'-arm-upper'
            if p['region']=='teapot':return 'teapot'
            if name.startswith(('leaf-','collar-ribbon')) or name=='clover-brooch':return 'collar'
            if name.startswith('pouch-') and name!='pouch-shadow':return 'pouch'
            if name in cloth:return 'cloth'
            if name.startswith('belt') or name=='hips':return 'hip'
            if name.endswith('-leg-shadow'):return name[0]+'-leg-lower'
        if name.startswith('ear-'):
            return name[:5]+'-outer'
        if name.startswith('shield-') or name == 'lantern-hook':
            return 'shield'
        if name.startswith('lantern-'):
            return 'lantern'
        if p['region'] == 'head':
            return 'hair-tip' if name == 'hair-top-curl' else 'head'
        if p['region'] == 'tail':
            return 'tail-1' if name == 'tail-shadow' else 'tail-5'
        if p['region'] == 'arms':
            return name[0]+'-paw' if 'paw' in name else name[0]+'-arm-upper'
        if p['region'] == 'legs':
            return name[0]+'-thigh'
        return 'torso'

    def weights(p, point):
        name = p['name']
        if name in neck:
            w = smooth((positions['torso'][1]-point[1])/(positions['torso'][1]-positions['head-pivot'][1])) if portable else smooth((650-master(point)[1])/75)
            return {'torso':1-w, 'head-pivot':w}
        if p['region'] == 'tail':
            return tail_weights(point)
        if name in cloth:
            w = smooth((point[1]-positions['cloth'][1])/700) if portable else smooth((master(point)[1]-740)/160)
            return {'torso' if portable else 'hip':1-w,'cloth':w}
        side = arm_side(p)
        if side:
            shoulder = np.array(positions[side+'-arm-upper'])
            elbow = np.array(positions[side+'-arm-lower'])
            wrist = np.array(positions[side+'-paw'])
            pos = np.array(point)
            w = smooth(float(np.dot(pos-elbow, wrist-shoulder)/np.linalg.norm(wrist-shoulder)+130)/260)
            return {side+'-arm-upper':1-w, side+'-arm-lower':w}
        return {bone_for(p):1.}

    # Shared fields attach overlapping layers to the same deformation. Deliberately
    # small provisional amplitudes; the designer owns the final meshes/keyframes.
    def attachment(p):
        bone = bone_for(p)
        if p['name'] not in neck|cloth and not arm_side(p) and p['region'] != 'tail':
            center, pivot = xy([p['left']+p['width']/2,p['top']+p['height']/2]), xy(positions[bone])
            return {'x':center[0]-pivot[0], 'y':center[1]-pivot[1], 'width':p['width']*scale, 'height':p['height']*scale}
        cols, rows = (3,3) if portable and (p['name'] in neck or p['region']=='tail') else (2,3) if portable else (3,4 if p['name'] in neck or p['region']=='tail' else 3)
        uvs, vertices, triangles = [], [], []
        for row in range(rows):
            for col in range(cols):
                u, v = col/(cols-1), row/(rows-1)
                point = [p['left']+u*p['width'],p['top']+v*p['height']]
                values = [(b,w) for b,w in weights(p,point).items() if w>1e-8]
                uvs.extend([u,v]);vertices.append(len(values))
                for b,w in values:
                    at, base = xy(point), xy(positions[b])
                    vertices.extend([indices[b],at[0]-base[0],at[1]-base[1],w])
                if row<rows-1 and col<cols-1:
                    i = row*cols+col
                    triangles.extend([i,i+cols,i+1,i+1,i+cols,i+cols+1])
        return {'type':'mesh','uvs':uvs,'triangles':triangles,'vertices':vertices,'hull':0,'width':p['width']*scale,'height':p['height']*scale}

    page_width = 1024
    for p in parts:
        p['packed'] = p['image'].resize((max(1,round(p['width']*scale)),max(1,round(p['height']*scale))),Image.Resampling.LANCZOS)
    x = y = row_height = 4
    for p in sorted(parts,key=lambda p:-p['packed'].height):
        w,h = p['packed'].size
        if x+w+4 > page_width:
            x = 4;y += row_height+4;row_height = 0
        p['atlas'] = [x,y,w,h];x += w+4;row_height = max(row_height,h)
    page_height = 2**math.ceil(math.log2(y+row_height+4))
    if max(page_width,page_height)>config['atlasMax']:
        raise ValueError('Layer atlas exceeds contract')
    texture = Image.new('RGBA',(page_width,page_height))
    atlas = [f'{unit_id}.png',f'size: {page_width},{page_height}','format: RGBA8888','filter: Linear,Linear','repeat: none','pma: true']
    attachments, slots = {}, []
    for p in parts:
        name = p['name'];x,y,w,h = p['atlas']
        texture.paste(p['packed'],(x,y));atlas.extend([name,f'bounds: {x},{y},{w},{h}'])
        slot = {'name':name,'bone':bone_for(p)}
        if p['visible']:
            slot['attachment'] = name
        if p['blend_mode']=='multiply':
            slot['blend'] = 'multiply'
        slots.append(slot)
        attachments[name] = {name:attachment(p)}
    mesh_vertices = sum(len(next(iter(s.values())).get('uvs',[]))//2 for s in attachments.values())
    if len(bones)>unit['budgets']['bones'] or mesh_vertices>unit['budgets']['meshVertices']:
        raise ValueError(f'Placeholder budget: {len(bones)} bones/{mesh_vertices} mesh vertices')
    skel = {'skeleton':{'spine':config['runtimeVersion']+'.00','x':(left-origin[0])*scale,'y':0,'width':(right-left)*scale,'height':unit['targetHeight']}, 'bones':bones,'slots':slots,'skins':[{'name':'default','attachments':attachments}], 'events':{n:{} for n in ['hit','cast','ult-start','ult-end']},'animations':{}}
    for name in unit['animations']:
        spec = config['animations'][name];duration = sum(spec['seconds'])/2
        def t(f): return round(f*duration,4)
        def rotate(value): return [{'time':0,'value':0},{'time':t(.5),'value':value},{'time':duration,'value':0}]
        tracks = {'root':{'translate':[{'time':0},{'time':duration}]}}
        if name in ['idle','victory']:
            tracks['torso'] = {'scale':[{'time':0,'x':1,'y':1},{'time':t(.5),'x':.998,'y':1.006},{'time':duration,'x':1,'y':1}]}
            tracks['head-pivot'] = {'rotate':rotate(1.2 if name=='idle' else 2.)}
            for i in range(1,6):tracks[f'tail-{i}'] = {'rotate':rotate(.7 if i%2 else -.5)}
            for side in ['r','l']:tracks[f'ear-{side}-outer'] = {'rotate':rotate(1.5)}
            for b in (['cloth','hair-tip','collar','pouch'] if portable else ['cloth','hair-tip','lantern']):tracks[b] = {'rotate':rotate(1.2)}
        elif name=='appear':tracks['root']['translate'] = [{'time':0,'x':-80},{'time':t(.7),'x':4},{'time':duration}]
        elif name=='ko':tracks['hip'] = {'rotate':[{'time':0},{'time':t(.8),'value':-68},{'time':duration,'value':-72}],'translate':[{'time':0},{'time':duration,'y':-unit['targetHeight']*.25}]}
        elif name=='hurt':tracks['hip'] = {'rotate':rotate(4),'translate':[{'time':0},{'time':t(.25),'x':-12},{'time':duration}]}
        else:
            tracks['hip'] = {'rotate':[{'time':0},{'time':t(.24),'value':2},{'time':t(.55),'value':-2},{'time':duration}]}
            tracks['r-arm-upper'] = {'rotate':[{'time':0},{'time':t(.25),'value':-5},{'time':t(.55),'value':5},{'time':duration}]}
            tracks['l-arm-upper'] = {'rotate':[{'time':0},{'time':t(.25),'value':3},{'time':t(.55),'value':-4},{'time':duration}]}
            if name=='attack':tracks['root']['translate'] = [{'time':0},{'time':t(.25),'x':-15},{'time':t(.48),'x':24},{'time':duration}]
        clip = {'bones':tracks}
        if spec['events']:clip['events'] = [{'name':n,'time':t(f)} for n,f in spec['events'].items()]
        if name in ['idle','victory']:
            clip['slots'] = {}
            for p in parts:
                n = p['name']
                if n.startswith('eye-'):
                    closed = n.endswith(('-closed','-eyelid'))
                    clip['slots'][n] = {'attachment':[{'time':0,'name':None if closed else n},{'time':t(.67),'name':n if closed else None},{'time':t(.715),'name':None if closed else n},{'time':duration,'name':None if closed else n}]}
        skel['animations'][name] = clip
    skel['laneC'] = {'status':'placeholder','source':str(source),'sourceHashes':hashes,'tool':'layered-to-spine.py','parts':len(parts),'sourceScale':scale,'sourceGate':'V3 artwork G7 round 3 PASS; not a final runtime export','maskPolicy':'Static setup apertures baked into derived atlas only; original eye masks and raw source pixels retained. Blink swaps complete eyelids; no animated gaze.','maskedLayers':mask_names,'weights':'Shared neck/bib field and supplied tail arc; shared skirt field; conservative automatic motion. Designer builds final meshes/keyframes.','meshVertices':mesh_vertices}
    if portable:
        skel['laneC'].update(sourceGate='Published G0-G5/G7 round 4 PASS; independently verified all PSD layers/masks/order; not a final runtime export', maskPolicy='All 11 eye/tea masks baked only at setup into derived atlas. Complete blink swaps; no animated gaze or tea slosh. Original PSD/masks unchanged.', weights='Shared neck, arm/sleeve, skirt and polyline tail fields; small provisional rotations. Teapot follows the left holding paw; designer owns final meshes/keyframes.')
    pixels = np.array(texture,dtype=np.uint16)
    pixels[:,:,:3] = (pixels[:,:,:3]*pixels[:,:,3:4]+127)//255
    # Prove no source change occurred before publishing the derived outputs.
    for name,digest in hashes.items():
        if hashlib.sha256((folder/name).read_bytes()).hexdigest()!=digest:raise ValueError(f'Source changed during conversion: {name}')
    out.mkdir(parents=True,exist_ok=True)
    Image.fromarray(pixels.astype('uint8')).save(out/f'{unit_id}.png',compress_level=9)
    (out/f'{unit_id}.json').write_text(json.dumps(skel,indent=2)+'\n')
    (out/f'{unit_id}.atlas').write_text('\n'.join(atlas)+'\n')
    return {'id':unit_id,'parts':len(parts),'bones':len(bones),'meshVertices':mesh_vertices,'atlas':[page_width,page_height],'scale':scale,'sources':len(hashes),'sourceUnchanged':True,'output':str(out)}


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('metadata');parser.add_argument('--id',required=True);parser.add_argument('--out',required=True)
    args=parser.parse_args()
    print(json.dumps(build(args.metadata,args.out,args.id)))
