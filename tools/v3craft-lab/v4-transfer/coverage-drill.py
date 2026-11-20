"""Compare exact-coverage encodings; reuse inspected split RGB planes unchanged."""
import datetime
import gc
import hashlib
import json
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'reports/v4-art/REVIEW/A10/scene-ready-transfer'
RAW=OUT/'raw/coverage-r1'
REPORT=OUT/'coverage-r1.json'
assert not REPORT.exists()
RAW.mkdir(parents=True,exist_ok=True)
base=json.loads((OUT/'split-r1.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'started':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'scope':'Lossless mask coding only; no browser reconstruction or production acceptance',
 'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'scriptSha256AtRun':sha(Path(__file__)),'boundSplitR1Sha256':sha(OUT/'split-r1.json'),
 'rows':[],'complete':False}
for source in base['assets']:
 p=ROOT/source['source'];assert sha(p)==source['sourceSha256']
 alpha=Image.open(p).convert('RGBA').getchannel('A')
 rgba=Image.new('RGBA',alpha.size,(255,255,255,255));rgba.putalpha(alpha)
 row={'kind':source['kind'],'owner':source['owner'],'source':source['source'],'sourceSha256':sha(p),'avifMaskBytes':source['mask']['bytes'],'candidates':[]}
 for method,image,options in [('webp-alpha',rgba,dict(format='WEBP',lossless=True,quality=100,method=6,exact=True)),('png-gray',alpha,dict(format='PNG',optimize=True))]:
  output=RAW/(source['kind']+'-'+source['owner']+'-'+method+('.webp' if method=='webp-alpha' else '.png'))
  assert not output.exists();image.save(output,**options)
  decoded=Image.open(output)
  actual=decoded.convert('RGBA').getchannel('A') if method=='webp-alpha' else decoded.convert('L')
  exact=bool(np.array_equal(np.asarray(alpha),np.asarray(actual)))
  assert exact,'Coverage changed'
  row['candidates'].append({'method':method,'path':str(output.relative_to(ROOT)),'bytes':output.stat().st_size,'sha256':sha(output),'coverageExact':exact,'options':options})
 report['rows'].append(row);REPORT.write_text(json.dumps(report,indent=2)+'\n')
 print(row['kind'],row['owner'],'AVIF',row['avifMaskBytes'],[(c['method'],c['bytes']) for c in row['candidates']],flush=True)
 del alpha,rgba,decoded,actual;gc.collect()
report['projections']=[]
for mask_method in ['webp-alpha','png-gray']:
 for color_method in base['scales']:
  total_masks=sum(next(c['bytes'] for c in a['candidates'] if c['method']==mask_method) for a in report['rows'])
  total_color=sum(next(c['colorBytes'] for c in a['candidates'] if c['method']==color_method) for a in base['assets'])
  overhead=sum(a['observedResponseOverhead']+base['extraResponseAllowanceEach'] for a in base['assets'])
  total=base['baseline']['nonImageBytes']+base['baseline']['unchangedAuxiliaryImageBytes']+base['newDecoderByteReserve']+total_masks+total_color+overhead
  report['projections'].append({'maskMethod':mask_method,'colorMethod':color_method,'maskBytes':total_masks,'colorBytes':total_color,'totalBytesIncludingDecoderReserve':total,'withinBudgetProjection':total<=8000000,'measuredProductionPass':False})
report.update(complete=True,finished=datetime.datetime.now(datetime.timezone.utc).isoformat())
REPORT.write_text(json.dumps(report,indent=2)+'\n')
print('complete',report['projections'],flush=True)
