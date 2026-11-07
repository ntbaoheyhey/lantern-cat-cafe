"""REFERENCE: look-ui-check.mjs. Contrast against rendered, text-masked pixels."""
import hashlib
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

def luminance(rgb):
    srgb = np.asarray(rgb, dtype=float) / 255
    linear = np.where(srgb <= .04045, srgb / 12.92, ((srgb + .055) / 1.055) ** 2.4)
    return linear @ np.array([.2126, .7152, .0722])

rows = []
for name in sys.argv[1:]:
    path = Path(name)
    receipt = json.loads(path.read_text())
    for screen in receipt['rows']:
        if screen['mode'] != 'on':
            continue
        background = Path(screen['background'])
        assert hashlib.sha256(background.read_bytes()).hexdigest() == screen['backgroundSha256']
        image = np.asarray(Image.open(background).convert('RGB'))
        for text in screen['texts']:
            channels = list(map(float, re.findall(r'[\d.]+', text['colour'])))
            alpha = (channels[3] if len(channels) == 4 else 1) * text['opacity']
            r = text['bounds']
            x1, y1 = max(0, math.ceil(r['x'])), max(0, math.ceil(r['y']))
            x2, y2 = min(image.shape[1], math.floor(r['x']+r['width'])), min(image.shape[0], math.floor(r['y']+r['height']))
            pixels = image[y1:y2, x1:x2]
            if not pixels.size:
                continue
            back = luminance(pixels)
            front = luminance(np.array(channels[:3]) * alpha + pixels * (1-alpha))
            contrast = (np.maximum(front, back)+.05)/(np.minimum(front, back)+.05)
            size = float(text['fontSize'].replace('px',''))
            weight = int(text['fontWeight']) if text['fontWeight'].isdigit() else 400
            threshold = 3 if size >= 24 or (size >= 18.66 and weight >= 700) else 4.5
            rows.append(dict(screen=screen['screen'], width=receipt['width'], text=text['text'], tag=text['tag'],
                             className=text['className'], bounds=r, colour=text['colour'], opacity=alpha,
                             minimum=float(contrast.min()), p05=float(np.percentile(contrast,5)),
                             threshold=threshold, disabled=text['disabled'], passes=bool(contrast.min() >= threshold),
                             background=str(background), artifactSha256=receipt['artifactSha256']))
result = dict(method='WCAG sRGB relative luminance against every pixel inside each visible text rectangle in a text-masked screenshot. Conservatively includes whitespace/background texture; inactive controls reported separately. DPR1 only; not a complete accessibility audit.',
              rows=rows, measured=len(rows), activeFailures=sum(not r['passes'] and not r['disabled'] for r in rows),
              inactiveFailures=sum(not r['passes'] and r['disabled'] for r in rows))
out=Path(sys.argv[1]).parent/'contrast.json'
out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='rows'}))
for r in rows:
    if not r['passes'] and not r['disabled']:
        print(json.dumps({k:r[k] for k in ['width','screen','text','tag','className','minimum','threshold']}))
