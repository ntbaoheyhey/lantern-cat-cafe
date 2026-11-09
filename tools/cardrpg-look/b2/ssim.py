"""Full-image RGB SSIM with 11x11 Gaussian window, no cherry-picked crops."""
from pathlib import Path
import json,sys,cv2,numpy as np
full,lean,out=map(Path,sys.argv[1:]);rows=[]
for a in sorted(full.glob('1280-*.png')):
 x=cv2.imread(str(a)).astype(np.float64);y=cv2.imread(str(lean/a.name)).astype(np.float64)
 assert x.shape==y.shape
 mu=lambda v:cv2.GaussianBlur(v,(11,11),1.5)
 mx,my=mu(x),mu(y);vx=mu(x*x)-mx*mx;vy=mu(y*y)-my*my;cov=mu(x*y)-mx*my
 score=((2*mx*my+6.5025)*(2*cov+58.5225))/((mx*mx+my*my+6.5025)*(vx+vy+58.5225))
 rows.append(dict(file=a.name,ssim=float(score[5:-5,5:-5].mean()),mae=float(np.abs(x-y).mean())))
out.write_text(json.dumps(dict(method='RGB11x11 Gaussian sigma1.5; full screenshot with5px border excluded; data range255',rows=rows),indent=2))
print(json.dumps(rows))
