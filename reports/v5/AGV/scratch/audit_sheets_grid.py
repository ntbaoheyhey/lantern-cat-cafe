import json
import subprocess
import os

manifest_path = "/Users/bao/th-v5-ag2/apps/web/public/vfx/v5/manifest.json"
vfx_dir = "/Users/bao/th-v5-ag2/apps/web/public/vfx/v5/"
audit_path = "/Users/bao/th-v5-ag2/reports/v5/AGV/SHEET-AUDIT.md"

with open(manifest_path, 'r') as f:
    manifest = json.load(f)

with open(audit_path, 'w') as f:
    f.write("# Sheet Audit\n\n| Texture | Declared Grid | Actual Grid | Frame Count | SizePx | Dimensions | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n")
    for key, data in manifest.items():
        file_path = os.path.join(vfx_dir, data['file'])
        if not os.path.exists(file_path):
            f.write(f"| {key} | {data.get('cols')}x{data.get('rows')} | N/A | N/A | N/A | N/A | Missing |\n")
            continue
            
        # Get dimensions
        res = subprocess.check_output(['identify', '-format', '%wx%h', file_path]).decode().strip().split('x')
        width = int(res[0])
        height = int(res[1])
        
        frames = int(subprocess.check_output(['identify', '-format', '%n', file_path]).decode().strip())
        
        sizePx = data.get('sizePx', 0)
        
        # Calculate actual cols/rows if sizePx is known
        actual_cols = width // sizePx if sizePx > 0 else 1
        actual_rows = height // sizePx if sizePx > 0 else 1
        
        declared_cols = data.get('cols', 1)
        declared_rows = data.get('rows', 1)
        
        status = "OK"
        if declared_cols != actual_cols or declared_rows != actual_rows:
            status = "Mismatch"
            
        f.write(f"| {key} | {declared_cols}x{declared_rows} | {actual_cols}x{actual_rows} | {frames} | {sizePx} | {width}x{height} | {status} |\n")
f.close()
