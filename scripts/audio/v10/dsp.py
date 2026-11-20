"""Small procedural sound-design kit for V10 SFX (numpy/scipy only, no samples)."""
import numpy as np, scipy.signal as ss
SR=48000
rng=np.random.default_rng(7)
def t(d): return np.arange(int(d*SR))/SR
def silence(d): return np.zeros(int(d*SR))
def env_ad(n,a,d,curve=4.0):
    x=np.zeros(n);na=max(1,int(a*SR));x[:na]=np.linspace(0,1,na)**2
    rest=n-na;x[na:]=np.exp(-curve*np.arange(rest)/max(1,d*SR)) if rest>0 else 0;return x
def env_rise(n,power=3.0): return (np.arange(n)/max(1,n-1))**power
def noise(d,color='white'):
    n=int(d*SR);w=rng.standard_normal(n)
    if color=='white':return w
    f=np.fft.rfftfreq(n,1/SR);F=np.fft.rfft(w);f[0]=f[1]
    F/= (np.sqrt(f) if color=='pink' else f)
    x=np.fft.irfft(F,n);return x/np.abs(x).max()
def lp(x,fc,o=4):return ss.sosfilt(ss.butter(o,min(fc,SR*.45),'low',fs=SR,output='sos'),x)
def hp(x,fc,o=4):return ss.sosfilt(ss.butter(o,fc,'high',fs=SR,output='sos'),x)
def bp(x,lo,hi,o=3):return ss.sosfilt(ss.butter(o,[lo,min(hi,SR*.45)],'band',fs=SR,output='sos'),x)
def sweep(x,f_of_t,width=0.6):
    """Time-varying band emphasis in the STFT domain: f_of_t(seconds)->centre Hz."""
    f,tt,Z=ss.stft(x,SR,nperseg=1024,noverlap=768)
    fc=np.array([f_of_t(s) for s in tt]);lf=np.log2(np.maximum(f,1))[:,None];lc=np.log2(fc)[None,:]
    Z*=np.exp(-((lf-lc)/width)**2);_,y=ss.istft(Z,SR,nperseg=1024,noverlap=768);return y[:len(x)]
def sine_glide(d,f0,f1,curve='exp'):
    tt=t(d);f=f0*(f1/f0)**(tt/d) if curve=='exp' else f0+(f1-f0)*tt/d
    return np.sin(2*np.pi*np.cumsum(f)/SR)
def bell(f0,d,bright=1.0,ratios=(1,2.0,2.76,4.07,5.4,6.8,8.93),decay=2.2):
    tt=t(d);x=np.zeros_like(tt)
    for i,r in enumerate(ratios):
        amp=(0.9**i)*(bright if i>2 else 1);x+=amp*np.sin(2*np.pi*f0*r*tt+rng.uniform(0,6))*np.exp(-tt*decay*(1+i*.55))
    return x*np.minimum(1,tt/0.002)
def pluck(f0,d,damp=0.996):
    n=int(d*SR);p=max(2,int(SR/f0));buf=rng.uniform(-1,1,p);out=np.zeros(n)
    for i in range(n):
        out[i]=buf[i%p];buf[i%p]=damp*0.5*(buf[i%p]+buf[(i+1)%p])
    return out
def boom(d,f0=110,f1=38,drive=1.5):
    tt=t(d);x=sine_glide(d,f0,f1)*np.exp(-tt*4.5)*np.minimum(1,tt/.003)
    return np.tanh(drive*x)/np.tanh(drive)
def crackle(d,rate=60,bright=4000,decay=0.0):
    n=int(d*SR);x=np.zeros(n)
    for _ in range(int(rate*d)):
        i=rng.integers(0,n-400);L=rng.integers(40,300);x[i:i+L]+=rng.standard_normal(L)*np.exp(-np.arange(L)/(L/5))*rng.uniform(.2,1)
    x=hp(x,bright/3)
    if decay:x*=np.exp(-t(d)*decay)
    return x
def grains(d,freqs,count,length=(0.04,0.25),amp=1.0,shape=None):
    n=int(d*SR);L=np.zeros(n);R=np.zeros(n)
    for _ in range(count):
        pos=shape() if shape else rng.uniform(0,1);i=int(pos*(n-1));g=rng.uniform(*length);m=min(int(g*SR),n-i)
        if m<10:continue
        tt=np.arange(m)/SR;f=rng.choice(freqs)*rng.choice([1,2])
        s=np.sin(2*np.pi*f*tt)*np.exp(-tt*(6/g))*np.minimum(1,tt/.002)*rng.uniform(.3,1)*amp;p=rng.uniform(.15,.85)
        L[i:i+m]+=s*np.sqrt(1-p);R[i:i+m]+=s*np.sqrt(p)
    return np.stack([L,R])
def st(x,pan=0.5):
    return np.stack([x*np.sqrt(1-pan),x*np.sqrt(pan)]) if x.ndim==1 else x
def widen(x,ms=11):
    """Mono -> stereo with a short Haas offset."""
    if x.ndim==2:return x
    d=int(ms*SR/1000);r=np.concatenate([np.zeros(d),x[:-d]]);return np.stack([x,0.85*r+0.15*x])
def reverb(x,t60=1.6,wet=0.3,pre=0.012,tone=6000,tail_pad=None):
    x=st(x);n=int(t60*SR);tt=np.arange(n)/SR
    pad=int((tail_pad if tail_pad is not None else t60*.7)*SR)
    y=np.concatenate([x,np.zeros((2,pad))],axis=1);out=[]
    for ch in range(2):
        ir=rng.standard_normal(n)*np.exp(-6.9*tt/t60);ir=lp(ir,tone,2);ir=np.concatenate([np.zeros(int(pre*SR)),ir]);ir/=np.sqrt((ir**2).sum())
        out.append(ss.fftconvolve(y[ch],ir)[:y.shape[1]])
    return (1-wet)*y+wet*np.array(out)*2.2
def mix(*parts):
    parts=[st(p) for p in parts];n=max(p.shape[1] for p in parts);out=np.zeros((2,n))
    for p in parts:out[:,:p.shape[1]]+=p
    return out
def at(x,sec,total=None):
    x=st(x);off=int(sec*SR);n=total and int(total*SR) or off+x.shape[1];out=np.zeros((2,n));m=min(x.shape[1],n-off);out[:,off:off+m]=x[:,:m];return out
def fade(x,fi=0.002,fo=0.05):
    x=st(x).copy();a=int(fi*SR);b=int(fo*SR)
    if a:x[:,:a]*=np.linspace(0,1,a)
    if b:x[:,-b:]*=np.linspace(1,0,b)
    return x
def norm(x,peak_db=-1.0):return x*(10**(peak_db/20))/max(1e-9,np.abs(x).max())
def limit(x,ceiling_db=-1.0,drive=1.0):
    c=10**(ceiling_db/20);return np.tanh(drive*x/c)*c
def fit(x,d):
    x=st(x);n=int(d*SR)
    if x.shape[1]>=n:return x[:,:n]
    return np.concatenate([x,np.zeros((2,n-x.shape[1]))],axis=1)
