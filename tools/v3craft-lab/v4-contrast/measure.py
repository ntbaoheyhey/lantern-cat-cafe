"""Rendered backing contrast, using glyph masks instead of whole text rectangles."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
import json, math, re, sys
lab = Path(__file__).resolve().parent
runtime = '--runtime' in sys.argv
folder = lab / 'raw' / (('runtime-' if runtime else 'drill-') + (sys.argv[1] if len(sys.argv) > 1 else 'r2'))
data = json.loads((folder / 'drill.json').read_text())
def luminance(rgb):
    linear = [c / 255 / 12.92 if c / 255 <= .04045 else ((c / 255 + .055) / 1.055) ** 2.4 for c in rgb]
    return sum(c * w for c, w in zip(linear, [.2126, .7152, .0722]))
def contrast(a, b):
    a, b = sorted([luminance(a), luminance(b)])
    return (b + .05) / (a + .05)
for variant in data['variants']:
    prefix = variant['variant']
    bg = Image.open(folder / (prefix + '-background.png')).convert('RGB')
    black = Image.open(folder / (prefix + '-black.png')).convert('RGB')
    white = Image.open(folder / (prefix + '-white.png')).convert('RGB')
    diff = ImageChops.difference(black, white)
    for row in variant['metadata']:
        colour = [float(n) for n in re.findall(r'[\d.]+', row['color'])[:3]]
        unsupported = []
        for ancestor in row['ancestors']:
            f = ancestor['filter']
            if ancestor['opacity'] != '1' or ancestor['blend'] != 'normal':
                unsupported.append(ancestor)
            functions = re.findall(r'([a-z-]+)\(', f)
            if any(fn not in ['drop-shadow', 'brightness', 'rgb', 'rgba'] for fn in functions):
                unsupported.append(ancestor)
            for multiplier in re.findall(r'brightness\(([\d.]+)\)', f):
                colour = [min(255, c * float(multiplier)) for c in colour]
        pixels = set()
        for rect in row['rects']:
            for y in range(max(0, math.floor(rect['y'])), min(bg.height, math.ceil(rect['y'] + rect['height']))):
                for x in range(max(0, math.floor(rect['x'])), min(bg.width, math.ceil(rect['x'] + rect['width']))):
                    if max(diff.getpixel((x, y))) > 8:
                        pixels.add((x, y))
        values = [(contrast(colour, bg.getpixel(p)), p, bg.getpixel(p)) for p in pixels]
        worst = min(values) if values else None
        row['measurement'] = {'glyphMaskPixels': len(pixels), 'minimum': 4.5, 'effectiveForeground': colour,
            'ratio': worst[0] if worst else None, 'worstPixel': worst[1] if worst else None,
            'backgroundAtWorst': worst[2] if worst else None, 'unsupported': unsupported,
            'pass': bool(worst and worst[0] >= 4.5 and not unsupported)}
    variant['pass'] = all(row['measurement']['pass'] for row in variant['metadata'])
data['method'] = 'Chromium screenshot backing with text fill transparent; black/white text-fill difference isolates glyph pixels. WCAG authored foreground, supported brightness transforms, no AA edge-colour substitution. Original screenshots and masks retained locally.'
if not runtime:
    data['retainedHarnessFailure'] = 'r1 used an empty addStyleTag content string, rejected by Playwright before screenshots. Fixed to a nonempty CSS comment; r1 log retained.'
out = Path('reports/v4-art/REVIEW/A10/contrast')
out.mkdir(parents=True, exist_ok=True)
(out / ('runtime-contrast-' + sys.argv[1] + '.json' if runtime else 'drills.json')).write_text(json.dumps(data, indent=2) + '\n')
if runtime:
    for v in data['variants']:
        print(v['variant'], 'pass=', v['pass'], 'labels=', len(v['metadata']), 'min=', min(r['measurement']['ratio'] or 0 for r in v['metadata']))
    raise SystemExit(0 if data.get('finished') and not data['errors'] and all(v['pass'] for v in data['variants']) else 1)
panel = Image.new('RGB', (1024, 510), '#211c2a')
draw = ImageDraw.Draw(panel)
for i, variant in enumerate(data['variants']):
    im = Image.open(folder / (variant['variant'] + '.png')).convert('RGB')
    strip = im.crop((0, 600, 1280, 720)).resize((1024, 96), Image.Resampling.LANCZOS)
    y = i * 170
    draw.text((8, y + 4), variant['variant'] + ' — same scene and clock; HUD at 80% display scale', fill='#ffe9b5')
    panel.paste(strip, (0, y + 24))
    counter = variant['metadata'][0]['rect']
    cx, cy = round(counter['x'] + counter['width'] / 2), round(counter['y'] + counter['height'] / 2)
    crop = im.crop((cx - 100, cy - 24, cx + 100, cy + 24))
    panel.paste(crop, (300, y + 122))
    draw.text((8, y + 137), 'World counter at native scale:', fill='#ffe9b5')
panel.save(folder / 'private-comparison.jpg', quality=94)
for v in data['variants']:
    print(v['variant'], 'pass=', v['pass'], [(r['selector'], round(r['measurement']['ratio'] or 0, 4)) for r in v['metadata']])
