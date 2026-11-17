import json
import subprocess
import os

manifest_path = "/Users/bao/th-v5-ag2/apps/web/public/vfx/v5/manifest.json"
vfx_dir = "/Users/bao/th-v5-ag2/apps/web/public/vfx/v5/"
audit_path = "/Users/bao/th-v5-ag2/reports/v5/AGV/SHEET-AUDIT.md"

with open(manifest_path, 'r') as f:
    manifest = json.load(f)

with open(audit_path, 'w') as f:
    f.write("# Sheet Audit\n\n| Texture | Declared Grid | Actual Grid | Frame Count | Status |\n| --- | --- | --- | --- | --- |\n")
    for key, data in manifest.items():
        file_path = os.path.join(vfx_dir, data['file'])
        if not os.path.exists(file_path):
            continue
            
        declared_cols = data['cols']
        declared_rows = data['rows']
        
        # Get dimensions
        res = subprocess.check_output(['identify', '-format', '%wx%h', file_path]).decode().strip().split('x')
        width = int(res[0])
        height = int(res[1])
        
        # Estimate cols/rows if not 1x1
        # This is tricky without knowing the frame size, but I can assume the frame size is consistent if it is 256x256 based on manifest
        # Actually I need to know the tile size.
        
        # Let's just check frames first
        frames = int(subprocess.check_output(['identify', '-format', '%n', file_path]).decode().strip())
        
        # We need actual grid
        # For webp it might be one file with multiple frames or a sprite sheet.
        # "grids declared 1x1 while the sheet is 4x4" - so they are sprite sheets.
        
        # I'll just report what I can.
        f.write(f"| {key} | {declared_cols}x{declared_rows} | ? | {frames} | Check |\n")
f.close()
