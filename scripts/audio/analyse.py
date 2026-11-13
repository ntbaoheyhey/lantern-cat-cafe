#!/usr/bin/env python3
"""Deterministic measurement only. PCM stays in memory and is never written to disk.

Layer, music-bed, and voice-contour measurements are spectral proxies, not source
separation or recognition. The identical algorithm is used on references and game
renders. NumPy and ffmpeg are the only dependencies.
"""
import argparse
import json
import math
import re
import subprocess
import numpy as np

RATE = 22050
FFT = 1024
HOP = 220  # 9.98 ms


def runs(mask):
    edges = np.diff(np.r_[False, mask, False].astype(np.int8))
    return list(zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)))


def rolling_median(values, width):
    half = width // 2
    padded = np.pad(values, (half, half), mode='edge')
    return np.median(np.lib.stride_tricks.sliding_window_view(padded, width), axis=-1)


def measure(samples, rate=RATE):
    x = np.asarray(samples, dtype=np.float64)
    if len(x) < FFT:
        x = np.pad(x, (0, FFT-len(x)))
    duration = len(samples)/rate
    frames = np.lib.stride_tricks.sliding_window_view(x, FFT)[::HOP]
    windowed = frames * np.hanning(FFT)
    spectrum = np.fft.rfft(windowed, axis=1)
    power = np.abs(spectrum)**2
    magnitude = np.sqrt(power)
    freqs = np.fft.rfftfreq(FFT, 1/rate)
    rms = np.sqrt(np.mean(frames**2, axis=1))
    db = 20*np.log10(np.maximum(rms, 1e-12))
    # Half-wave spectral flux, whitened by the recent frequency-bin median.
    # Square-root compression reduces sensitivity to the video's master gain.
    compressed = np.sqrt(magnitude)
    flux = np.r_[0, np.maximum(np.diff(compressed, axis=0), 0).mean(axis=1)]
    local = rolling_median(flux, 101)
    mad = rolling_median(np.abs(flux-local), 101)
    threshold = local + np.maximum(1.5*mad, np.max(flux)*0.015)
    peaks = np.flatnonzero((flux > threshold) & (flux >= np.r_[0, flux[:-1]]) & (flux > np.r_[flux[1:], 0]) & (db > -50))
    onsets = []
    for p in peaks:
        if not onsets or (p-onsets[-1])*HOP/rate >= 0.075:
            onsets.append(int(p))
        elif flux[p] > flux[onsets[-1]]:
            onsets[-1] = int(p)
    bands = [(0,120),(120,800),(800,5000),(5000,rate/2+1)]
    energies = np.stack([power[:,(freqs >= lo)&(freqs < hi)].sum(axis=1) for lo,hi in bands], axis=1)
    layer_counts = []
    for p in onsets:
        before = np.mean(energies[max(0,p-3):max(1,p)], axis=0)
        after = np.max(energies[p:min(len(energies),p+4)], axis=0)
        rise = 10*np.log10(np.maximum(after,1e-18)/np.maximum(before,1e-18))
        layer_counts.append(int(np.sum(rise > 6)))
    # Sustained spectral peaks: at least 0.25 s of tonal concentration, allowing
    # short impact holes of <= 0.12 s. Includes harmonic beds, not just melody.
    sorted_power = np.sort(power[:,(freqs >= 120)&(freqs <= 5000)], axis=1)
    tonal = sorted_power[:,-12:].sum(axis=1) / np.maximum(sorted_power.sum(axis=1),1e-18)
    bed = (tonal > 0.32) & (db > -50)
    for a,b in runs(~bed):
        if a>0 and b<len(bed) and (b-a)*HOP/rate<=0.12:
            bed[a:b]=True
    sustained=np.zeros_like(bed)
    for a,b in runs(bed):
        if (b-a)*HOP/rate >= 0.25:
            sustained[a:b]=True
    # Autocorrelation F0 salience in the requested 150-1200 Hz range.
    ac = np.fft.irfft(np.abs(np.fft.rfft(windowed,n=2048,axis=1))**2,n=2048,axis=1)
    lag_lo,lag_hi=math.floor(rate/1200),math.ceil(rate/150)
    lag=np.argmax(ac[:,lag_lo:lag_hi+1],axis=1)+lag_lo
    clarity=ac[np.arange(len(ac)),lag]/np.maximum(ac[:,0],1e-18)
    f0=rate/lag
    voiced=(clarity>=0.58)&(db>-42)
    # Break pitch discontinuities; count only contoured 0.2-1.2 s phrases.
    jumps=np.r_[False,np.abs(12*np.log2(f0[1:]/f0[:-1]))>5]
    voiced[jumps]=False
    voice_events=[]
    for a,b in runs(voiced):
        seconds=(b-a)*HOP/rate
        contour=12*np.log2(np.percentile(f0[a:b],90)/np.percentile(f0[a:b],10))
        if 0.2<=seconds<=1.2 and contour>=1.5:
            voice_events.append({'start':round(a*HOP/rate,3),'duration':round(seconds,3),'semitones':round(float(contour),3)})
    # 2-8 kHz energy is measured in 5 ms windows for <40 ms consonant/tick bursts.
    # Frequency masking is a deterministic bandpass, not an exported asset.
    raw_fft=np.fft.rfft(x)
    raw_freq=np.fft.rfftfreq(len(x),1/rate)
    raw_fft[(raw_freq<2000)|(raw_freq>8000)]=0
    high=np.fft.irfft(raw_fft,n=len(x))
    tick_hop=round(rate*0.005)
    blocks=high[:len(high)//tick_hop*tick_hop].reshape(-1,tick_hop)
    env=np.mean(blocks**2,axis=1)
    background=rolling_median(env,101)
    active=(env>np.maximum(background*4,1e-8))
    ticks=[(a,b) for a,b in runs(active) if 0<(b-a)*tick_hop/rate<0.04]
    return {
        'onsetsPerSecond':len(onsets)/duration,
        'layersPerOnset':float(np.mean(layer_counts)) if layer_counts else 0,
        'musicBedFraction':float(np.mean(sustained)),
        'voiceContoursPerMinute':len(voice_events)*60/duration,
        'tickTransientsPerSecond':len(ticks)/duration,
        'silenceFraction':float(np.mean(db < -50)),
        'onsetCount':len(onsets),'onsetBandCounts':layer_counts,
        'onsetTimes':[round(p*HOP/rate,3) for p in onsets],
        'voiceContourEvents':voice_events,'tickCount':len(ticks),
        'bandEnergyFractions':(energies.sum(axis=0)/max(float(energies.sum()),1e-18)).tolist(),
    }


def analyse_file(path, start=0, duration=30):
    inputs=['-ss',str(start),'-i',str(path),'-t',str(duration),'-vn']
    pcm=subprocess.run(['ffmpeg','-v','error',*inputs,'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1'],check=True,capture_output=True).stdout
    samples=np.frombuffer(pcm,dtype='<f4')
    result=measure(samples)
    loud=subprocess.run(['ffmpeg','-hide_banner',*inputs,'-af','loudnorm=I=-16:TP=-1:LRA=11:print_format=json','-f','null','-'],check=True,capture_output=True,text=True).stderr
    match=re.search(r'\{\s*"input_i"[\s\S]*?\}',loud)
    if not match:
        raise RuntimeError('ffmpeg loudness measurement missing')
    values=json.loads(match.group())
    result.update(integratedLufs=float(values['input_i']),loudnessRange=float(values['input_lra']),truePeakDbTP=float(values['input_tp']),durationSeconds=len(samples)/RATE)
    return result


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('path');parser.add_argument('--start',type=float,default=0);parser.add_argument('--duration',type=float,default=30)
    args=parser.parse_args()
    print(json.dumps(analyse_file(args.path,args.start,args.duration),allow_nan=False))
