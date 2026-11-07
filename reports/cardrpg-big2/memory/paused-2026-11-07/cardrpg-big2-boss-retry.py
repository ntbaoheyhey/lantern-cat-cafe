from pathlib import Path
import subprocess,time,os
root=Path('/Users/bao/taskbar-hero-cardrpg-big2')
while 'node tools/cardrpg-big2/review-measurements.mjs' in subprocess.run(['ps','-p','6992','-o','command='],capture_output=True,text=True).stdout:
 time.sleep(5)
result=subprocess.run(['node','tools/cardrpg-big2/review-measurements.mjs'],cwd=root,env={**os.environ,'BIG_REVIEW_STEPS':'boss-battles'})
if result.returncode:raise SystemExit(result.returncode)
result=subprocess.run(['python3','/tmp/cardrpg-big2-accept-review.py'],cwd=root)
raise SystemExit(result.returncode)
