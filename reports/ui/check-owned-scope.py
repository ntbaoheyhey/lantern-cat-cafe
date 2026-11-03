#!/usr/bin/env python3
"""Read-only check of the user's exact UI lane and unchanged original image blobs."""
import datetime,json,re,subprocess,sys
from pathlib import PurePosixPath

def git(*args): return subprocess.check_output(['git',*args],text=True)
base=sys.argv[1] if len(sys.argv)>1 else 'origin/main'
head=git('rev-parse','HEAD').strip()
ancestor=git('merge-base',base,'HEAD').strip()
rows=[line.split('\t') for line in git('diff','--name-status','--no-renames',base+'...HEAD').splitlines()]
source_dirs=('shell','layout','nav','map','boss','inventory','onboarding','theme','ui','forge','market','chain-proof','pets','runes','art','motion','game')
allowed_files={'main.tsx','styles.css','theme.css','cafe.css','motion.css','Panel.tsx','GameCanvas.tsx','CatPortrait.tsx'}
violations=[]
for status,path in rows:
 owned=path.startswith(tuple('apps/web/src/'+p+'/' for p in source_dirs)) or path.startswith(('apps/web/e2e/','tools/art/','reports/ui/','reports/ui-redesign/','reports/art/','screenshots/ui/','docs/ui/')) or path in ('tools/ui-audit.mjs','tools/effects-test.mjs')
 if path.startswith('apps/web/src/') and '/' not in path[len('apps/web/src/'):]:
  name=PurePosixPath(path).name
  owned=owned or name in allowed_files or name.startswith(('App','HeroTab','CafeBoard'))
 if path.startswith('apps/web/public/'):
  owned=status=='A'
 if path=='reports/asset-provenance.md':
  owned=git('show','HEAD:'+path).startswith(git('show',ancestor+':'+path))
 if not owned: violations.append({'path':path,'reason':'outside exact owned paths or non-additive public asset'})
 if path.startswith('apps/web/src/art/') and status!='A': violations.append({'path':path,'reason':'art source must be additive'})
 if status!='A' and path.lower().endswith(('.png','.jpg','.jpeg','.webp','.svg','.gif','.avif','.ico')): violations.append({'path':path,'reason':'existing image changed'})
 if path.endswith('.css') and status=='M':
  embedded=lambda content:set(re.findall(r'url\([\"\']?(data:image/[^)\"\']+)',content))
  if embedded(git('show',ancestor+':'+path))-embedded(git('show','HEAD:'+path)): violations.append({'path':path,'reason':'embedded original image removed'})

def images(ref):
 result={}
 for row in git('ls-tree','-r',ref).splitlines():
  info,path=row.split('\t',1)
  if path.lower().endswith(('.png','.jpg','.jpeg','.webp','.svg','.gif','.avif','.ico')): result[path]=info.split()[2]
 return result
before,after=images(ancestor),images('HEAD')
changed=[p for p,blob in before.items() if after.get(p)!=blob]
if changed: violations.append({'reason':'original image blobs changed','paths':changed})
for row in git('log','--format=%H%x09%an%x09%ae%x09%s',base+'..HEAD').splitlines():
 sha,name,email,subject=row.split('\t',3)
 if name!='ntbaoheyhey' or email!='108352255+ntbaoheyhey@users.noreply.github.com' or not subject.endswith(' [skip ci]'): violations.append({'commit':sha,'reason':'author/skip-ci contract'})
tracked=git('status','--porcelain','--untracked-files=no').splitlines()
if tracked: violations.append({'reason':'tracked working changes','paths':tracked})
result={'head':head,'base':git('rev-parse',base).strip(),'reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'paths':[p for _,p in rows],'violations':violations,'existingImagesUnchanged':len(before)-len(changed),'changedExistingImages':changed,'provenanceAppendOnly':not any(v.get('path')=='reports/asset-provenance.md' for v in violations),'trackedWorkingChanges':tracked}
print(json.dumps(result,indent=2))
sys.exit(bool(violations))
