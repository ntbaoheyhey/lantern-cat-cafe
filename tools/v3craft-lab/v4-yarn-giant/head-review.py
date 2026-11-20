"""Create one coordinate review per candidate; never overwrite a reviewed sheet."""
from PIL import Image, ImageDraw
from pathlib import Path
import numpy as np
import sys

key = sys.argv[1]
lab = Path('tools/v3craft-lab/v4-yarn-giant')
out = lab / (key + '-head-lock.jpg')
assert not out.exists(), 'A reviewed sheet must not be regenerated/reopened'
im = Image.open('tools/v3craft-lab/poses/raw/yarn-giant/' + key + '.png').convert('RGBA')
a = np.array(im)
y, x = np.where(a[:, :, 3] >= 128)
b = (int(x.min()), int(y.min()), int(x.max()+1), int(y.max()+1))
scale = min(409/(b[3]-b[1]), 920/(b[2]-b[0]))
crop = im.crop(b)
crop = crop.resize((round(crop.width*scale), round(crop.height*scale)), Image.Resampling.LANCZOS)
sheet = Image.new('RGBA', (1010, 510), '#37313c')
sheet.alpha_composite(crop, (35, 55))
d = ImageDraw.Draw(sheet)
d.text((8, 10), f'{key}: raw y coordinates; scale {scale:.9f}; lock before metrics', fill='white')
for raw_y in range(b[1], b[3], 25):
    yy = 55 + round((raw_y-b[1])*scale)
    d.line((25, yy, 963, yy), fill='#524d58')
    d.text((970, yy-5), str(raw_y), fill='white')
sheet.convert('RGB').save(out, quality=94)
print(str(out))
