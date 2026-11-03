#!/usr/bin/env python3
"""Read-only source/git inspection; generate only docs/art catalogs, or check drift."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import subprocess

from pipeline import ROOT, decode_png, json_bytes

ART = 'apps/web/src/art/'
CONTENT = 'packages/game-rules/src/v2/content/'
DEMO = 'docs/proposals/rune-skill-system/art/MANIFEST.md'
EXTRA = ['apps/web/src/CatPortrait.tsx', 'apps/web/src/game/StripScene.ts',
         'scripts/gen-og.mjs', 'scripts/gen-relics.mjs', 'reports/ui-redesign/index.html',
         'docs/proposals/rune-skill-system/demo/index.html', 'tools/art/original_icons.py', 'tools/art/original-icons.json']


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def text(path):
    return (ROOT / path).read_text()


def source_paths():
    return sorted(set(git('ls-files', 'apps/web/src/art', 'apps/web/public', 'apps/web/src/game/rig', *EXTRA).splitlines()))


def palette_literals(source):
    return sorted({'#' + s.lower() for s in re.findall(r'(?:#|0x)([a-fA-F0-9]{6})(?![a-fA-F0-9])', source)})


def matrices(source):
    """Literal icon maps only. Deliberately not a TypeScript evaluator."""
    out = {}
    for match in re.finditer(r"(?:'([^']+)'|\b([A-Za-z]\w*))\s*:\s*\[\s*((?:'[^']*'\s*,?\s*)+)\]", source):
        rows = re.findall(r"'([^']*)'", match[3])
        if rows and all(re.fullmatch(r'[.a-zA-Z]+', row) for row in rows) and any('.' in row for row in rows):
            out[match[1] or match[2]] = {'width': max(map(len, rows)), 'height': len(rows)}
    return out


def monster_records(source):
    """Inspect literal monster/cat frame arrays; count frames, not string rows."""
    records = {}
    starts = list(re.finditer(r"\bid: '((?:mon|cat)\.[^']+)'", source))
    for index, match in enumerate(starts):
        block = source[match.end():starts[index + 1].start() if index + 1 < len(starts) else len(source)]
        size = re.search(r'size:\s*\{\s*w:\s*(\d+),\s*h:\s*(\d+)\s*\}', block)
        export = re.findall(r'export const (\w+)', source[:match.start()])
        if not size or not export:
            raise ValueError('unrecognized literal monster source')
        animations = {}
        for anim in re.finditer(r'\b(walk|idle|windup|attack|hit|defeat|hurt|victory):\s*(\[)', block):
            depth, count = 0, 0
            for char in block[anim.start(2):]:
                if char == '[':
                    if depth == 1:
                        count += 1
                    depth += 1
                elif char == ']':
                    depth -= 1
                    if depth == 0:
                        break
            if depth or not count:
                raise ValueError('unrecognized animation array: ' + match[1])
            animations[anim[1]] = count
        if not animations:
            raise ValueError('missing literal animation frames: ' + match[1])
        records[export[-1] + ':' + match[1]] = {'width': int(size[1]), 'height': int(size[2]), 'animations': animations}
    return records


def inventory():
    records = []
    for path in source_paths():
        data = (ROOT / path).read_bytes()
        source = data.decode('utf8') if not path.endswith('.png') else ''
        intro = git('log', '--follow', '--diff-filter=A', '--format=%H|%cs', '--', path).splitlines()[-1]
        latest = git('log', '-1', '--format=%H|%cs', '--', path)
        native, scale, kind = [], '1 source cell = 1 art pixel; display scale is consumer-defined', 'art source'
        ids = matrices(source)
        if path.endswith('.png'):
            image = decode_png(data)
            native = [f'{image.width}x{image.height}']
            colors = sorted({'#' + image.pixels[i:i + 3].hex() for i in range(0, len(image.pixels), 4) if image.pixels[i + 3]})
            scale, kind = 'mixed procedural rectangle sizes; no uniform sprite scale asserted', 'raster'
            if path.startswith(ART + 'generated/original/'):
                scale = 'native32px icon frames; integer1x/2x/3x lookup in static atlas'
        else:
            colors = palette_literals(source)
            native += [f'{w}x{h}' for w, h in re.findall(r'size:\s*\{\s*w:\s*(\d+),\s*h:\s*(\d+)', source)]
            native += [f'{w}x{h}' for w, h in re.findall(r'viewBox="0 0 (\d+) (\d+)"', source)]
            native += [f'{v["width"]}x{v["height"]}' for v in ids.values()]
            if '/backdrops/' in path and Path(path).stem in ('livingroom', 'kitchen', 'bathroom', 'basement', 'rooftops'):
                native += [re.search(r'width:\s*(\d+)', source)[1] + 'x96']
            if path.endswith('.test.ts') or path.endswith('.test.tsx') or Path(path).name in ('index.ts', 'types.ts', 'BackdropView.tsx'):
                kind = 'support/test; no standalone asset'
            elif path.endswith('.json'):
                kind, scale = ('relic metadata; no pixels' if path.startswith('apps/web/public/relics/') else 'art metadata; no pixels'), 'not applicable'
            elif path.endswith('.html'):
                kind, scale = 'original design demo; placeholder glyphs', 'mixed SVG/CSS; not production sprite art'
            elif path.endswith('.svg'):
                kind = 'vector pixel art'
                view = re.search(r'viewBox="0 0 (\d+) (\d+)"', source)
                dimensions = re.search(r'<svg[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"', source)
                if view and dimensions:
                    scale = f'{int(dimensions[1]) / int(view[1]):g}x horizontal / {int(dimensions[2]) / int(view[2]):g}x vertical at declared SVG dimensions'
            elif path == 'tools/art/original_icons.py':
                native += ['32x32']
                kind, scale = 'original art generator', 'native coordinate grid; static icons only'
            elif '/rig/' in path:
                native += ['56x48 composed canvas']
            elif path.endswith('/CatPortrait.tsx'):
                scale = '20x20 native; default 72x72 display = 3.6x (legacy SVG exception)'
        records.append({'path': path, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                        'kind': kind, 'nativeSizes': sorted(set(native)), 'pixelScale': scale,
                        'colors': colors, 'colorEvidence': 'decoded opaque RGB' if path.endswith('.png') else 'static hex literals, including CSS fallbacks/comments; not rendered color count',
                        'literalMaps': ids, 'sprites': monster_records(source) if re.fullmatch(ART + r'monsters/ch[1-5]\.ts', path) else {},
                        'firstCommit': intro.split('|')[0], 'firstDate': intro.split('|')[1],
                        'latestCommit': latest.split('|')[0], 'latestDate': latest.split('|')[1]})
    return records


def proposal_rows():
    result = []
    for line in text(DEMO).splitlines():
        cells = [s.strip() for s in line.strip('|').split('|')]
        if len(cells) == 8 and re.fullmatch(r'\d+x\d+', cells[2]):
            result.append(cells)
    if len(result) != 163:
        raise ValueError('proposal manifest changed: review category coverage before regenerating')
    return result


def content_ids():
    source = text(CONTENT + 'items.ts')
    section = source.split('const WEAPON_NAMES:')[1].split('export function weaponItems')[0]
    weapons = []
    for weapon, block in re.findall(r'(\w+): \{(.*?)\n  \}', section, re.S):
        for rarity, suffix in re.findall(r"(\w+): \['([^']+)'", block):
            weapons.append((f'wpn.{weapon}.{suffix}', weapon, rarity))
    rarities = re.findall(r"'([^']+)'", re.search(r'GEAR_RARITY_IDS\s*=\s*\[(.*?)\]', text(CONTENT + 'rarities.ts'), re.S)[1])
    armor_section = source.split('export const ARMOR_SETS:')[1].split('export function armorItems')[0]
    armor = [(f'arm.{s}.{slot}.{r}', f'arm.{s}.{slot}', r) for s in re.findall(r"id: '([^']+)'", armor_section)
             for slot in ('helmet', 'armor', 'gloves', 'boots') for r in rarities]
    acc_section = source.split('export const ACCESSORY_DESIGNS:')[1].split('const ACCESSORY_PREFIXES:')[0]
    accessories = [(f'acc.{slot}.{name}.{r}', f'acc.{name}', r) for name, slot in re.findall(r"id: '([^']+)', slot: '([^']+)'", acc_section) for r in rarities]
    if (len(weapons), len(armor), len(accessories)) != (35, 60, 60):
        raise ValueError('content registry structure/count changed: update explicit art adapters')
    return weapons, armor, accessories


def original_art():
    path = ROOT / 'tools/art/original-icons.json'
    if not path.exists(): return None
    obj = json.loads(path.read_text())
    if obj.get('schemaVersion') != 1 or obj.get('palette') != 'cafe-night-v1':
        raise ValueError('unsupported original-art registry')
    entries = obj['entries']
    if len(entries) != 34 or len({row['id'].lower() for row in entries}) != 34:
        raise ValueError('original-art coverage/identity changed; review the adapter')
    for row in entries:
        relative = Path(row['path'])
        if relative.is_absolute() or '..' in relative.parts or not row['path'].startswith(ART + 'generated/original/icons/'):
            raise ValueError('original-art path must stay in its additive source directory')
        if (row['width'], row['height']) != (32, 32) or row['kind'] not in ('stat', 'item', 'skill'):
            raise ValueError('invalid original-art slot')
        if hashlib.sha256((ROOT / relative).read_bytes()).hexdigest() != row['sha256']:
            raise ValueError('original-art hash drift: ' + row['id'])
    if hashlib.sha256((ROOT / obj['generator']).read_bytes()).hexdigest() != obj['generatorSha256']:
        raise ValueError('original-art generator does not match its recorded recipe')
    return obj


def manifest():
    slots, aliases = [], {}

    def add(id_, category, width, height, frames=1, path=None, selector=None, note='', source='ART1', status=None):
        slots.append({'id': id_, 'category': category, 'width': width, 'height': height, 'frames': frames,
                      'status': status or ('existing' if selector else 'placeholder'),
                      'path': path or ART + 'generated/' + id_.replace('.', '/') + '.png',
                      'selector': selector, 'source': source, 'note': note})

    iconmaps = matrices(text(ART + 'v2Icons.tsx'))
    framemaps = matrices(text(ART + 'v2Frames.tsx'))
    itemmaps = matrices(text(ART + 'itemIcons.tsx'))
    classicmaps = matrices(text(ART + 'pixelIcons.tsx'))
    existing = {
        'mat.yarn': ('pixelIcons.tsx', 'yarn', classicmaps),
        'mat.fluff': ('v2Icons.tsx', 'fluffTuft', iconmaps),
        'mat.button': ('v2Icons.tsx', 'shinyButton', iconmaps),
        'mat.crystal': ('v2Icons.tsx', 'catnipCrystal', iconmaps),
        'mat.scale': ('v2Icons.tsx', 'starlightScale', iconmaps),
        'mat.pearl': ('v2Icons.tsx', 'moonPearl', iconmaps)}
    for rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary'):
        existing['frame.rarity.' + rarity] = ('v2Frames.tsx', 'frame' + rarity.title(), framemaps)
    for slot in ('weapon', 'helmet', 'armor', 'gloves', 'boots', 'collar', 'earring', 'ring', 'charm'):
        existing['slot.' + slot] = ('v2Frames.tsx', 'empty' + slot.title(), framemaps)
    monster_sources = {}
    for chapter in range(1, 6):
        source = text(ART + f'monsters/ch{chapter}.ts')
        for selector, sprite in monster_records(source).items():
            export, mid = selector.split(':')
            if export == f'CH{chapter}_PILOT_ART':
                monster_sources['monster.' + mid[4:].replace('.', '-').replace('windup', 'wind-up')] = (chapter, mid, sprite)
    for row in proposal_rows():
        id_, category, size, frames, path, screens, note, _ = row
        if id_.startswith('pet.'):
            # Proposal identities are not gameplay registry identities; do not propagate display names.
            aliases[id_] = f'pet.cafe-{len(aliases) + 1:02}.idle'
            continue
        w, h = map(int, size.split('x'))
        if id_ in existing:
            file, selector, maps = existing[id_]
            d = maps[selector]
            add(id_, category, d['width'], d['height'], path=ART + file, selector=selector,
                source=DEMO, note='Reuse native source; integer-scale and pad for UI. Proposed canvas ' + size)
        elif id_ in monster_sources:
            chapter, mid, sprite = monster_sources[id_]
            animations = sprite['animations']
            add(id_, category, sprite['width'], sprite['height'], sum(animations.values()), ART + f'monsters/ch{chapter}.ts', f'CH{chapter}_PILOT_ART:{mid}',
                ' + '.join(f'{count} {name}' for name, count in animations.items()) + '; keep existing art.', DEMO)
        else:
            add(id_, category, w, h, int(frames), path=ART + 'generated/' + path.removeprefix('art/').lower(),
                note=note + ('; sub-tab glyph only, no new rail item' if id_.startswith('nav.') else ''), source=DEMO)
    for index in range(1, 13):
        for kind, size, frames in [('portrait', 96, 1), ('locked', 96, 1), ('idle', 48, 4)]:
            add(f'pet.cafe-{index:02}.{kind}', 'pet ' + kind, size, size, frames,
                note='Reserved art slot; bind one-to-one to CXP1 registry ID before ART2 wiring. No demo pet name adopted.')
    # Current game registries: every Compendium entry has an explicit mapping or a missing icon slot.
    weapons, armor, accessories = content_ids()
    for id_, key, rarity in weapons + armor + accessories:
        maps, file = (iconmaps, 'v2Icons.tsx') if id_.startswith('wpn.') else (itemmaps, 'itemIcons.tsx')
        d = maps[key]
        add('compendium.' + id_, 'compendium gear', d['width'], d['height'], path=ART + file, selector=key,
            source=CONTENT + 'items.ts', note='Shared existing drawing; rarity ' + rarity + ' remains a UI frame/text cue.')
    for key in re.findall(r"'([^']+)'", re.search(r'CLASS_IDS = \[(.*?)\]', text(CONTENT + 'classes.ts'), re.S)[1]):
        add('compendium.class.' + key, 'compendium class', 56, 48, path='apps/web/src/game/rig/compose.ts',
            selector='composeFrame', source=CONTENT + 'classes.ts', note='Existing rig composed with CLASS_LOOKS.' + key + '; portrait canvas may be padded to 96.')
    for row in list(slots):
        if row['id'] in monster_sources:
            mid = monster_sources[row['id']][1]
            add('compendium.' + mid, 'compendium monster', row['width'], row['height'], row['frames'], row['path'], row['selector'],
                'Reuse resting frame for monster or boss entry.', CONTENT + 'monsters.ts')
    mat_alias = {'yarn': 'mat.yarn', 'fluffTuft': 'mat.fluff', 'shinyButton': 'mat.button', 'catnipCrystal': 'mat.crystal', 'starlightScale': 'mat.scale', 'moonPearl': 'mat.pearl'}
    for key in re.findall(r"\{ id: '([^']+)'", text(CONTENT + 'materials.ts')):
        if key == 'catKey':
            add('compendium.material.' + key, 'compendium material', 8, 7, path=ART + 'pixelIcons.tsx', selector='key', source=CONTENT + 'materials.ts')
        else:
            row = next(s for s in slots if s['id'] == mat_alias[key])
            add('compendium.material.' + key, 'compendium material', row['width'], row['height'], path=row['path'], selector=row['selector'], source=CONTENT + 'materials.ts')
    for key in re.findall(r"id: '(rcp\.[^']+)'", text(CONTENT + 'recipes.ts')):
        add('compendium.' + key, 'compendium recipe', 32, 32, source=CONTENT + 'recipes.ts', note='No dedicated recipe icon; neutral tile until ART2.')
    for index in range(1, 5):
        add(f'compendium.relic.{index}', 'compendium relic', 16, 16, path=f'apps/web/public/relics/{index}.svg', selector='svg', note='Existing 16x16 native SVG, 128x128 display card (8x); retain SVG.')
    chapter_source = text(CONTENT + 'chapters.ts')
    backgrounds = re.findall(r"'([^']+)'", re.search(r'const BACKGROUNDS = \[(.*?)\]', chapter_source)[1])
    for index, backdrop in enumerate(backgrounds, 1):
        add(f'compendium.chapter.ch{index}', 'compendium chapter', 160, 96, path=ART + 'backdrops/' + backdrop + '.ts', selector=backdrop, source=CONTENT + 'chapters.ts', note='Chapter thumbnail uses existing backdrop.')
        for state in ('done', 'current', 'locked', 'boss'):
            add(f'map.ch{index}.{state}', 'map node', 48, 48, note=f'Chapter {index}: {backdrop}; distinct state silhouette, text remains in UI.')
        add(f'map.ch{index}.decor', 'map decor', 128, 96, note='Original cafe prop vignette for ' + backdrop)
    for id_, w, h in [('ui.pet-slot', 48, 48), ('ui.card', 128, 128), ('ui.panel', 48, 48), ('ui.focus', 48, 48)]:
        add(id_, 'UI frame', w, h, note='Transparent interior; mark stretch/slice inset explicitly when produced.')
    # Existing capstones need an explicit frame as well as the 32px icon in the proposal.
    for key in ('echo', 'moonw', 'catnap'):
        add('passive.' + key + '.frame', 'passive frame', 48, 48)
    originals = original_art()
    if originals:
        for row in originals['entries']:
            add('original.' + row['kind'] + '.' + row['key'], 'original ' + row['kind'], 32, 32,
                path=row['path'], source='tools/art/original-icons.json', status='new',
                note='Original static icon; runtime atlas lookup preserves these exact pixels. Local catalog only.')
        for quality in ('common', 'uncommon', 'rare', 'epic', 'legendary'):
            add('original.quality.' + quality, 'original quality frame', 16, 16,
                path=ART + 'v2Frames.tsx', selector='frame' + quality.title(), status='existing',
                source='packages/game-rules/src/config.ts', note='Unchanged existing frame; original quality name is a text cue.')
    return {'schemaVersion': 1, 'palette': 'cafe-night-v1', 'proposalPetAliases': aliases, 'slots': sorted(slots, key=lambda s: s['id'])}


def render_manifest(obj):
    counts = Counter(s['status'] for s in obj['slots'])
    lines = ['# Art slot manifest', '',
             'Generated by tools/art/catalog.py from the proposal, current registries and explicit ART1 reservations. Machine contract: [manifest.json](manifest.json).', '',
             'Status: existing = reusable source exists; placeholder = required art has no delivered file; new = delivered original art (ORIG2/T013 adds34 static icons; ART1 generated none). Paths on placeholder rows are future destinations, not links or claims that files exist.', '',
             'Sizes are native art pixels per frame. Existing matrices keep their native dimensions; pad or integer-scale them in consumers. New icon canvases are 32/48; portraits 96; cards 128. Sheets use the [atlas contract](../../tools/art/README.md).', '',
             'The six proposal pet IDs map to the first six reservations in manifest.json; all twelve reservations have a portrait, locked silhouette and idle sheet. CXP1 owns pet identity: bind its twelve IDs before ART2 wiring. Demo names and balance numbers are not adopted.', '',
             'Recipe icons are currently missing. Gear uses shared existing source drawings for every real item ID. Map state and decor slots are additive. Demo nav slots are tab glyphs, not permission to add rail items. Chapter order is Living Room, Kitchen, Bathroom, Basement, Night Rooftops.', '',
             f"Counts: {len(obj['slots'])} slots; " + ', '.join(f'{k} {v}' for k, v in sorted(counts.items())) + '.', '',
             '| ID | Category | Native size | Frames | Status | Path / selector | Source / note |',
             '|---|---|---|---|---|---|---|']
    for s in obj['slots']:
        lines.append(f"| {s['id']} | {s['category']} | {s['width']}x{s['height']} | {s['frames']} | {s['status']} | {s['path']}" + (f" :: {s['selector']}" if s['selector'] else '') + f" | {s['source']}; {s['note']} |")
    return '\n'.join(lines) + '\n'


def render_inventory(rows):
    lines = ['# Existing art inventory', '',
             'Generated by tools/art/catalog.py. Every tracked file under apps/web/src/art and apps/web/public is included, plus the rig, cat portrait, classic scene, generators and original HTML demos. Support/test files are explicitly distinguished from art. [inventory.json](inventory.json) stores full SHA-256, palette literals, map sizes and git evidence per path.', '',
             'Source palettes include comments and CSS fallback literals; this is static evidence, not a claim that every listed colour renders. Rig palettes are composed at runtime. PNG colours are decoded visible RGB values. A missing native size means dynamic/support code, not an inferred dimension. No source asset was rewritten.', '',
             '| Path | Bytes | Kind | Native sizes (px) | Palette evidence | Pixel scale |', '|---|---|---|---|---|---|']
    for r in rows:
        lines.append(f"| {r['path']} | {r['bytes']} | {r['kind']} | {', '.join(r['nativeSizes']) or 'dynamic / not applicable'} | {len(r['colors'])} values in inventory.json | {r['pixelScale']} |")
    return '\n'.join(lines) + '\n'


def render_provenance(rows):
    originals = original_art()
    authored = {row['path']: row for row in originals['entries']} if originals else {}
    if originals:
        for path in [originals['atlas']['image'], originals['atlas']['metadata'], originals['generator'], 'tools/art/original-icons.json']:
            authored[path] = {'tool': 'Original coordinate recipe and static atlas; see reports/asset-provenance.md', 'date': originals['date'], 'prompt': 'Packing/recipe for the34 individually recorded original icon briefs.'}
    lines = ['# Art provenance', '',
             'Canonical record. Brief compatibility link: [provenance.md](PROVENANCE.md). This is a lowercase link label, not a second case-colliding file on macOS.', '',
             'One row per inventoried source/export file. A source file owns all of its literal maps, animation frames and procedural output; inventory.json enumerates literal map selectors and native dimensions, and MANIFEST.md identifies reusable selectors. Companion PNGs are not claimed as delivered.', '',
             'Git proves that bytes existed at a commit, not who drew every pixel, the generating model, or an external licence. Existing entries are backfilled honestly as "existing, provenance from git log <hash>". Historical authoring prompts, model versions, seeds and post-processing are unknown unless a script is present. The project-original licence statement is the existing claim in [licenses-v2](../licenses-v2.md), not independent chain-of-title verification. Missing historical evidence remains missing; do not invent it.', '',
             'No new production art was generated in ART1. New test pixels are original, made for this project; no image model or third-party input was used.', '',
             '| Asset path | Tool / full method | Model/version | Seed | Date | Post-processing | Licence / evidence |',
             '|---|---|---|---|---|---|---|']
    for r in rows:
        if r['path'] in authored:
            row = authored[r['path']]
            lines.append(f"| {r['path']} | {row['tool']}; full per-icon brief/commands in [asset-provenance](../../reports/asset-provenance.md) | Python3.9+ standard library; no image model | none (deterministic) | {row['date']} | snap32 → cafe-night-v1 lock → trim/pad32 → optimize/check → static atlas, gutter1 | original, made for this project; SHA-256 `{r['sha256']}`; no external media input |")
            continue
        if r['path'].startswith('apps/web/public/relics/'):

            method = 'scripts/gen-relics.mjs (current recipe; historical invocation not recorded)'
        elif r['path'] in ('apps/web/public/favicon.svg', 'apps/web/public/og.png'):
            method = 'scripts/gen-og.mjs (current recipe; historical invocation not recorded)'
        else:
            method = r['path'] + ' (full checked-in source; historical tool unknown)'
        licence = 'existing project-original claim; not independently verified'
        if 'support/test' in r['kind'] or 'metadata' in r['kind']:
            licence = 'repository source/metadata; not a standalone art licence'
        lines.append(f"| {r['path']} | {method} | unknown; not retroactively assigned | unknown | {r['firstDate']} first tracked; {r['latestDate']} latest change | unknown historically; unchanged in ART1 | {licence}; existing, provenance from git log {r['firstCommit']}; latest {r['latestCommit']} |")
    lines += ['| tools/art/test_pipeline.py :: fixture(), raw_png(), inline test pixels | Full procedural method in named functions; asymmetric pennant and numeric codec samples, no external input | Python 3.9+ standard library; no image model | none (deterministic) | 2026-11-01 | snap, palette-lock, trim, pad, pack, lossless PNG in temporary test directories only; off-palette raw samples intentionally test rejection | original, made for this project |', '',
              'Future production rows must include exact output path, SHA-256, full prompt or versioned drawing script, tool/model version, explicit seed or "not supplied", creation date, ordered transform commands, palette ID, and licence "original, made for this project" only when supported. Keep removed/replaced source history and record old → new.']
    lines += ['', '## Reference capture evidence', '',
              'These are screenshots of the original local HTML designs, not generated production assets. They intentionally retain source colours and system font fallback instead of palette processing that would falsify the reference. No external resources were fetched. Full method: tools/art/reference_review.mjs; command and browser/package versions are recorded in the report logs.', '',
              '| Evidence path | Method / source | Model / seed | Date | Post-processing / licence |', '|---|---|---|---|---|']
    for kind, source in [('redesign', 'reports/ui-redesign/index.html'), ('rune-demo', 'docs/proposals/rune-skill-system/demo/index.html')]:
        for size in (1280, 1600):
            for part in (1, 2):
                path = f'reports/scorecard/art1/references/{kind}-{size}-{part}.png'
                lines.append(f'| {path} | Playwright capture via tools/art/reference_review.mjs of {source}, {size} logical width, part {part} | no image model; no random seed | 2026-11-01 | browser contact-sheet layout only; source project-original claim retained, no new production art |')
    return '\n'.join(lines) + '\n'


def outputs():
    rows, slots = inventory(), manifest()
    return {'inventory.json': json_bytes({'schemaVersion': 1, 'files': rows}),
            'INVENTORY.md': render_inventory(rows).encode(), 'PROVENANCE.md': render_provenance(rows).encode(),
            'manifest.json': json_bytes(slots), 'MANIFEST.md': render_manifest(slots).encode()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = outputs()
    drift = []
    for name, data in result.items():
        path = ROOT / 'docs/art' / name
        if args.check:
            if not path.exists() or path.read_bytes() != data:
                drift.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    if drift:
        parser.exit(1, 'catalog drift: ' + ', '.join(drift) + '\n')
    print(('checked' if args.check else 'generated') + ' 5 art catalog files; application assets read only')


if __name__ == '__main__':
    main()
