from PIL import Image
import os

texture = Image.open('/Users/bao/th-v5-ag2/apps/web/public/vfx/v5/temp/clover-particle-1.webp')
battle = Image.open('/Users/bao/.gemini/antigravity/brain/11476ffe-10cb-42af-a8dd-ac1e80127026/browser_sandbox/uploads/fresh-battle-frame.png')
# Resize battle for montage if needed
battle = battle.resize((640, 360))
montage = Image.new('RGB', (1024, 600))
montage.paste(texture.resize((512, 512)), (0, 0))
montage.paste(battle, (0, 512))
montage.save('/Users/bao/th-v5-ag2/reports/v5/AGV/comp/clover-particle-1-montage.jpg')
