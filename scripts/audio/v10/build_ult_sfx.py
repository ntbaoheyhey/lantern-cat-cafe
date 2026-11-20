#!/usr/bin/env python3
"""V10 ultimate SFX: four layers per MVP cat, timed to the V9 2.2 s ultimate.
riser plays at cut-in (0 ms) and lands on impact (1100 ms); transient+body at impact; tail at linger (1300 ms).
All sounds are synthesised here from oscillators and noise. No samples, no generators."""
import sys,subprocess
from pathlib import Path
import numpy as np,soundfile as sf
sys.path.insert(0,str(Path(__file__).parent))
from dsp import *
OUT=Path(__file__).resolve().parents[3]/'apps/web/public/audio/v9'
RISER=1.10
G,D,B,E,A=196.0,293.66,246.94,329.63,220.0
def note(m):return 440*2**((m-69)/12)

def mochi():
    # Last Lantern Vow: a golden bell-lantern swells, then a holy dome slams down.
    r_bell=bell(note(55),RISER,decay=1.1)[::-1]*env_rise(int(RISER*SR),1.5)
    r_air=sweep(noise(RISER,'pink'),lambda s:300*(5000/300)**((s/RISER)**1.4),.5)*env_rise(int(RISER*SR),2.2)
    r_drone=(sine_glide(RISER,55,110)+.4*sine_glide(RISER,82.5,165))*env_rise(int(RISER*SR),1.6)
    trem=grains(RISER,[note(m) for m in (79,83,86,91,95)],34,(0.05,0.18),.5,shape=lambda:1-rng.random()**2.2)
    riser=mix(widen(.55*r_bell),widen(.5*r_air,17),st(.45*r_drone),.6*trem)
    riser=fade(norm(reverb(riser,1.0,.25,tail_pad=0),-3),0.01,0.012)
    # transient: sub boom + struck bronze bell + bright crack
    tr=mix(st(boom(0.6,120,40,2.2)),widen(.7*bell(note(43),0.6,bright=1.3,decay=4)),widen(.5*hp(noise(0.06),2500)*env_ad(int(.06*SR),.001,.02),7))
    tr=fade(norm(reverb(tr,0.9,.18,tail_pad=.05),-1),0.0005,0.08)
    # body: shockwave whoosh falling + warm G-major dome pad with shimmer
    dur=1.5;n=int(dur*SR);tt=t(dur)
    pad=sum(a*np.sign(np.sin(2*np.pi*f*tt))*.25+a*np.sin(2*np.pi*f*1.003*tt) for f,a in ((note(43),.6),(note(50),.5),(note(55),.45),(note(59),.35),(note(62),.3)))
    pad=lp(pad,1800)*env_ad(n,.06,.9,2.6)
    wave=sweep(noise(dur,'pink'),lambda s:4500*(250/4500)**min(1,s/.6),.45)*env_ad(n,.005,.35,3)
    shim=grains(dur,[note(m) for m in (79,83,86,91,98)],40,(0.08,0.4),.35,shape=lambda:rng.random()**1.6)
    body=fade(norm(reverb(mix(widen(.6*pad,13),widen(.8*wave,9),shim),1.6,.3,tail_pad=.2),-2),0.003,0.25)
    # tail: lingering bell + embers
    tl=mix(widen(.6*bell(note(67),2.2,bright=.6,decay=1.2)),widen(.25*bell(note(74),2.2,bright=.5,decay=1.6),19),st(.35*crackle(2.2,25,5000,1.4),.6))
    tail=fade(norm(reverb(tl,2.2,.4,tail_pad=.3),-6),0.002,0.4)
    return riser,tr,body,tail

def clover():
    # Fourleaf Spring Brew: kettle steam and a rising harp, then a soft bloom of healing light.
    n=int(RISER*SR)
    steam=sweep(noise(RISER,'white'),lambda s:1400*(7000/1400)**(s/RISER),.35)*env_rise(n,1.8)
    harp=np.zeros(n);notes=[65,69,72,77,81,84,89];times=[0,.2,.38,.54,.68,.8,.9]
    for m,s in zip(notes,times):
        p=pluck(note(m),RISER-s,.9975);harp[int(s*SR):int(s*SR)+len(p)]+=p*(.5+.5*s/RISER)
    riser=mix(widen(.35*hp(steam,900),15),widen(.8*harp,11))
    riser=fade(norm(reverb(riser,1.4,.35,tail_pad=0),-4),0.01,0.012)
    tr=mix(grains(.7,[note(m) for m in (84,88,91,96,100)],60,(0.03,0.2),.7,shape=lambda:rng.random()**3),
           st(.5*lp(boom(.35,90,55,1),400)),widen(.5*bell(note(84),.7,bright=.4,decay=5),9))
    tr=fade(norm(reverb(tr,1.2,.3,tail_pad=.1),-3),0.001,0.1)
    dur=1.6;N=int(dur*SR);tt=t(dur)
    pad=sum(a*np.sin(2*np.pi*f*tt)+.3*a*np.sin(2*np.pi*2*f*tt) for f,a in ((note(53),.5),(note(60),.45),(note(65),.4),(note(69),.35),(note(74),.25),(note(79),.18)))
    pad=pad*env_ad(N,.18,1.1,2.2)*(1+.08*np.sin(2*np.pi*5*tt))
    bub=np.zeros(N)
    for _ in range(22):
        i=rng.integers(0,int(N*.8));L=int(rng.uniform(.03,.07)*SR);f0=rng.uniform(500,1300)
        g=sine_glide(L/SR,f0,f0*2.2);L=len(g);bub[i:i+L]+=g*env_ad(L,.002,L/SR/2,3)*rng.uniform(.2,.6)
    body=fade(norm(reverb(mix(widen(.55*pad,14),widen(.35*bub,7),grains(dur,[note(m) for m in (88,91,93,96)],30,(0.1,0.4),.25)),1.8,.35,tail_pad=.2),-4),0.01,0.3)
    chimes=np.zeros(int(2.2*SR))
    for k,m in enumerate([96,93,91,88,86,84,81,79]):
        s=int((k*.11+rng.uniform(0,.03))*SR);b=bell(note(m),2.2-s/SR,bright=.3,decay=2.5);chimes[s:s+len(b)]+=b*(1-k*.08)
    tail=fade(norm(reverb(mix(widen(.4*chimes,17),widen(.15*hp(noise(2.2,'pink'),3000)*env_ad(int(2.2*SR),.3,.9,3),23)),2.4,.45,tail_pad=.3),-7),0.005,0.4)
    return riser,tr,body,tail

def soot():
    # Chimney Comet: a whistling fireball falls from the sky into a purple-orange blast.
    n=int(RISER*SR)
    roar=sweep(noise(RISER,'brown')+.3*noise(RISER,'pink'),lambda s:250*(3500/250)**((s/RISER)**1.3),.7)*env_rise(n,1.7)
    whistle=sine_glide(RISER,2600,700)*env_rise(n,1.2)*(1+.25*np.sin(2*np.pi*23*t(RISER)))
    crack=crackle(RISER,70,3000)*env_rise(n,1.5)
    riser=mix(widen(.9*roar,13),st(.22*whistle,.35),st(.4*crack,.65))
    riser=fade(norm(reverb(riser,.8,.2,tail_pad=0),-3),0.01,0.012)
    blast=hp(noise(.9,'pink'),60)*env_ad(int(.9*SR),.002,.25,3.5)
    tr=mix(st(1.0*boom(.9,95,28,3)),widen(.8*np.tanh(2.5*blast),9),widen(.45*hp(noise(.05),3000)*env_ad(int(.05*SR),.0005,.012),5))
    tr=fade(limit(norm(reverb(tr,1.1,.2,tail_pad=.05),0),-1,1.4),0.0005,0.1)
    dur=1.6;N=int(dur*SR)
    rumble=lp(noise(dur,'brown'),260)*env_ad(N,.02,1.0,2.4)
    fire=sweep(noise(dur,'pink'),lambda s:2200*(500/2200)**min(1,s/1.2),.8)*env_ad(N,.01,.8,2.5)
    debris=crackle(dur,45,2500,2.2)
    body=fade(norm(reverb(mix(st(1.2*rumble),widen(.6*fire,15),st(.5*debris,.4)),1.5,.28,tail_pad=.2),-2),0.003,0.3)
    dur=2.2;N=int(dur*SR)
    tail=mix(st(.4*lp(noise(dur,'brown'),180)*env_ad(N,.05,1.2,2.5)),widen(.45*crackle(dur,30,4500,1.6),21),
             st(.15*sine_glide(dur,note(70),note(58))*env_ad(N,.2,1.2,2.5),.3))
    tail=fade(norm(reverb(tail,2.0,.35,tail_pad=.3),-7),0.005,0.4)
    return riser,tr,body,tail

def write(cat,layers):
    for name,x in zip(('riser','transient','body','tail'),layers):
        if name=='riser':x=fit(x,RISER)
        wav=Path('/tmp')/f'v10-ult-{cat}-{name}.wav';sf.write(wav,x.T.astype(np.float32),SR,subtype='FLOAT')
        base=OUT/f'sfx-ult-{cat}-{name}'
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','libopus','-b:a','128k',str(base)+'.opus'],check=True)
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','aac','-b:a','160k',str(base)+'.m4a'],check=True)
        print(cat,name,round(x.shape[1]/SR,2),'s peak',round(20*np.log10(np.abs(x).max()),1),'dB')
if __name__=='__main__':
    for cat,fn in (('mochi',mochi),('clover',clover),('soot',soot)):write(cat,fn())
