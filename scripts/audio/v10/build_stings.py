#!/usr/bin/env python3
"""V10 stingers: victory, defeat and one boss-intro sting per chapter boss. Synthesised, no samples."""
import sys,subprocess
from pathlib import Path
import numpy as np,soundfile as sf
sys.path.insert(0,str(Path(__file__).parent))
from dsp import *
OUT=Path(__file__).resolve().parents[3]/'apps/web/public/audio/v9'
def note(m):return 440*2**((m-69)/12)
def saw(f,d,harm=None):
    tt=t(d);x=np.zeros_like(tt);k=1
    while f*k<min(9000,SR/2.2) and (harm is None or k<=harm):x+=np.sin(2*np.pi*f*k*tt)/k;k+=1
    return x
def brass(m,d,a=.04,rel=.25,bright=2500,vib=True):
    n=int(d*SR);tt=t(d);x=sum(saw(note(m)*2**(c/1200),d) for c in (-7,0,6))/3
    if vib:x*=1+.03*np.sin(2*np.pi*5.5*tt)*np.minimum(1,tt/.3)
    envf=np.minimum(1,tt/a);y=np.zeros(n)
    for i,(lo,hi) in enumerate([(0,.3),(.3,1)]):pass
    y=lp(x,bright)*.7+lp(x,bright*.4)*.3
    env=np.minimum(1,tt/a)*np.where(tt<d-rel,1,np.maximum(0,(d-tt)/rel))
    return y*env*(1-.25*np.minimum(1,tt/d))
def timpani(m,d=1.4,amp=1.0):
    tt=t(d);f=note(m);x=(np.sin(2*np.pi*f*tt)+.5*np.sin(2*np.pi*f*1.5*tt)+.25*np.sin(2*np.pi*f*1.98*tt))*np.exp(-tt*3)
    x+=.4*lp(noise(d),900)*np.exp(-tt*30);return amp*x*np.minimum(1,tt/.002)
def cymbal(d,swell=False):
    n=int(d*SR);x=hp(noise(d),5000)
    return x*(env_rise(n,2) if swell else np.exp(-t(d)*2.2))
def place(total,*items):
    out=np.zeros((2,int(total*SR)))
    for x,s,g in items:
        x=st(x) if np.ndim(x)==1 else x;i=int(s*SR);m=min(x.shape[1],out.shape[1]-i);out[:,i:i+m]+=g*x[:,:m]
    return out
def victory():
    tot=3.6;C=60
    parts=[(timpani(C-24,1.2),0,.9),(widen(brass(C+7,.14)),0,.5),(widen(brass(C+7,.14)),.16,.5),(widen(brass(C+7,.14)),.32,.5),
           (widen(brass(C+12,.5)),.48,.65),(widen(brass(C+9,.2)),.98,.5),(widen(brass(C+11,.2)),1.18,.5)]
    for m in (C,C+4,C+7,C+12,C+16):parts.append((widen(brass(m,2.1,a=.06,rel=.9,bright=3000),9+m%5),1.4,.32))
    parts+= [(timpani(C-24,1.6,1.2),1.4,1),(widen(cymbal(2.0),13),1.4,.25),(cymbal(1.4,True),0,.12),
             (grains(2.2,[note(m) for m in (84,88,91,96)],40,(.1,.5),.35,shape=lambda:rng.random()**1.5),1.4,1)]
    return fade(norm(reverb(place(tot,*parts),1.8,.28,tail_pad=.4),-2),0.002,0.5)
def defeat():
    tot=3.4;parts=[]
    for k,m in enumerate((64,62,60,59)):parts.append((widen(pluck(note(m),1.2,.9985)*.9),k*.42,.8))
    for m in (45,52,57,60,64):parts.append((widen(lp(brass(m,1.9,a=.3,rel=1.2,bright=900,vib=False),900),11),1.7,.3))
    parts.append((timpani(33,1.8,.8),1.7,1))
    return fade(norm(reverb(place(tot,*parts),2.4,.4,tail_pad=.5),-4),0.002,0.6)
def boss_intro(root,flavour):
    tot=2.8;parts=[(st(boom(1.6,70,30,2.5)),0,1.0),(timpani(root-12,1.6,1.2),0,.9),(cymbal(.9,True),0,.18)]
    for m in (root,root+1,root+6,root+12):parts.append((widen(brass(m,2.4,a=.02,rel=1.4,bright=1800)),0.0,.32))
    parts+=[(widen(brass(root+12,.25)),1.1,.55),(widen(brass(root+13,.25)),1.38,.55),(widen(brass(root+12,1.2,rel=.8)),1.66,.6),(timpani(root-12,1.2,1),1.66,1)]
    if flavour=='thread':parts.append((widen(sweep(noise(2.5,'pink'),lambda s:200*(3000/200)**(s/2.5),.4)*env_ad(int(2.5*SR),.8,1,3)),0,.4))
    if flavour=='storm':
        parts.append((widen(lp(noise(2.8,'pink'),3000)*.35,23),0,.6))
        parts.append((st(lp(noise(1.8,'brown'),400)*env_ad(int(1.8*SR),.04,.9,2.5)),1.66,1.0))
    if flavour=='crown':parts+= [(widen(bell(note(root+24),2.0,bright=.7,decay=1.5)),1.66,.6),(widen(bell(note(root+31),2.0,bright=.6,decay=1.8),17),1.66,.35)]
    return fade(limit(norm(reverb(place(tot,*parts),2.0,.3,tail_pad=.4),0),-1,1.3),0.002,0.5)
def write(name,x):
    wav=Path('/tmp')/f'v10-{name}.wav';sf.write(wav,x.T.astype(np.float32),SR,subtype='FLOAT')
    for codec,ext,br in (('libopus','opus','128k'),('aac','m4a','160k')):
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a',codec,'-b:a',br,str(OUT/f'{name}.{ext}')],check=True)
    print(name,round(x.shape[1]/SR,2))
if __name__=='__main__':
    write('sting-victory',victory());write('sting-defeat',defeat())
    write('sting-boss-yarn-giant',boss_intro(38,'thread'));write('sting-boss-rain-spool',boss_intro(40,'storm'));write('sting-boss-pantry-crown',boss_intro(41,'crown'))
