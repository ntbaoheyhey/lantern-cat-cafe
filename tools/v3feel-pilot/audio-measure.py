from pathlib import Path
import numpy as np,wave,json,sys
base=Path('reports/v3-feel/REVIEW')/(sys.argv[1] if len(sys.argv)>1 else 'QR-P1')
with wave.open(str(base/'mix.wav')) as w:
 rate=w.getframerate();channels=w.getnchannels();signal=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float).reshape(-1,channels).mean(1)/32768
observations=json.loads((base/'observed-contact.json').read_text())
windows=[]
for event in observations['events']:
 name,t,observed=event['action'],event['scheduledSeconds'],event['videoFrame']/30
 first=int((t-.08)*rate);last=int((t+.15)*rate);part=np.abs(signal[first:last]);threshold=part.max()*.18
 indices=np.flatnonzero(part>=threshold);start=(first+int(indices[0]))/rate if len(indices) else None
 windows.append({'event':name,'scheduledSeconds':t,'observedContactSeconds':observed,'observedFrame':event['videoFrame'],'transientSeconds':start,'offsetMs':None if start is None else abs(start-observed)*1000,'thresholdFraction':.18,'peakWindowAmplitude':float(part.max()),'method':'First absolute sample above 18% of local maximum, 80ms before to 150ms after event. Contact frame supplied by actual video review, never hard-coded from another pilot. Listening unverified.'})
(base/'audio-measurements.json').write_text(json.dumps({'sampleRate':rate,'channels':channels,'seconds':len(signal)/rate,'events':windows,'listened':False},indent=2)+'\n');print(json.dumps(windows))
