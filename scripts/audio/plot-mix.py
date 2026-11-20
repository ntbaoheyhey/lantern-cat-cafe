#!/usr/bin/env python3
"""Static review figure from the identical reference/runtime analysis outputs."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'reports/v3-shell/b2'
reference=json.loads((BASE/'REFERENCE-AUDIO.json').read_text())['targets']
ours=json.loads((BASE/'OUR-AUDIO.json').read_text())['renders']
metrics=[('onsetsPerSecond','Onsets / second',.30),('layersPerOnset','Rising bands / onset',None),('tickTransientsPerSecond','Short transients / second',.40),('voiceContoursPerMinute','Voice-like contours / minute',.35),('musicBedFraction','Tonal bed fraction',None),('integratedLufs','Integrated loudness (LUFS)',None)]
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9})
fig,axes=plt.subplots(2,3,figsize=(12.8,7.2),layout='constrained')
for ax,(key,title,tolerance) in zip(axes.flat,metrics):
 for i,row in enumerate(ours):
  ref=reference['battle' if row['name']=='boss' else row['name']][key]
  if tolerance is not None:lo,hi=ref*(1-tolerance),ref*(1+tolerance)
  elif key=='layersPerOnset':lo,hi=max(0,ref-.5),max(4,ref)
  elif key=='musicBedFraction':lo,hi=.95,1
  else:lo,hi=(-16,-13) if row['name'] in ['battle','boss'] else (-20,-16)
  ax.vlines(i,lo,hi,color='#a9d9cc',lw=10,alpha=.7)
  ax.scatter(i,ref,s=22,marker='x',color='#555b67',zorder=4)
  ax.scatter(i,row[key],s=33,color='#258370' if lo<=row[key]<=hi else '#c0474e',zorder=5)
 ax.set_title(title,loc='left',weight='bold');ax.set_xticks(range(6),[r['name'].title() for r in ours],rotation=25)
 ax.grid(axis='y',alpha=.2);ax.spines[['top','right']].set_visible(False)
fig.suptitle('Actual game audio vs reference — identical measurement algorithm',fontsize=15,weight='bold')
fig.text(.5,-.015,'Green ranges = required bands  ·  × = reference  ·  red dots = failed targets  ·  contours and bands are spectral proxies, not source separation.',ha='center',fontsize=9)
fig.savefig(BASE/'shots/audio-vs-ref.png',dpi=100,bbox_inches='tight')
