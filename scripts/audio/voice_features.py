"""Shared MFCC/F0 measurement for raw cat recordings and produced voices.
Same 24 kHz pipeline, 32 mel filters, MFCC 1..13 (energy coefficient excluded).
Silence is removed by one identical relative/absolute RMS rule on both inputs.
"""
import subprocess
import numpy as np
RATE=24000; FFT=1024; HOP=240

def decode(path):
 b=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1'])
 return np.frombuffer(b,dtype='<f4').copy()

def features(x):
 x=np.asarray(x,dtype=np.float64)
 if len(x)<FFT:x=np.pad(x,(0,FFT-len(x)))
 frames=np.lib.stride_tricks.sliding_window_view(x,FFT)[::HOP]
 rms=np.sqrt(np.mean(frames*frames,axis=1));keep=rms>max(.001,np.max(rms)*.08)
 frames=frames[keep]
 if len(frames)==0:raise ValueError('No audible frames')
 power=np.abs(np.fft.rfft(frames*np.hanning(FFT),axis=1))**2
 hz=np.linspace(0,RATE/2,FFT//2+1)
 mel=lambda f:2595*np.log10(1+f/700)
 centers=700*(10**(np.linspace(mel(80),mel(11000),34)/2595)-1)
 bank=[]
 for i in range(32):bank.append(np.maximum(0,np.minimum((hz-centers[i])/(centers[i+1]-centers[i]),(centers[i+2]-hz)/(centers[i+2]-centers[i+1]))))
 melpower=power@np.asarray(bank).T
 logmel=10*np.log10(np.maximum(melpower,np.max(melpower,axis=1,keepdims=True)*1e-8))
 dct=np.sqrt(2/32)*np.cos(np.pi/32*(np.arange(32)+.5)[None,:]*np.arange(1,14)[:,None])
 mfcc=(logmel@dct.T).mean(axis=0)
 windowed=frames*np.hanning(FFT);ac=np.fft.irfft(np.abs(np.fft.rfft(windowed,n=2048,axis=1))**2,n=2048,axis=1)
 lo,hi=int(RATE/1400),int(RATE/90)
 acn=ac[:,lo:hi]/np.maximum(ac[:,0,None],1e-15)
 # First strong local peak avoids repeatedly choosing octave/subharmonic lags.
 local=(acn[:,1:-1]>acn[:,:-2])&(acn[:,1:-1]>=acn[:,2:])&(acn[:,1:-1]>.55)
 has=local.any(axis=1);idx=local.argmax(axis=1)+lo+1
 f0=RATE/idx[has]
 return {'mfcc':mfcc.tolist(),'medianF0':float(np.median(f0)) if len(f0) else 0,'voicedFrames':int(has.sum()),'audibleFrames':len(frames)}
