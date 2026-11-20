#!/usr/bin/env python3
"""Build an auditable CC0 source library. Decode in memory; retain only compressed audio.

No reference media, paid services, account models or source ZIPs are used/retained.
Peak/RMS normalization is source preparation, not a claim of final mix LUFS.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import build_opener,HTTPCookieProcessor
import argparse,hashlib,http.cookiejar,io,json,re,runpy,subprocess,zipfile
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'assets/audio-sources'
OUT=SRC/'b2'
REPORT=ROOT/'reports/v3-shell/b2'
RATE=48000
DATE='2026-11-13'
CC0='https://creativecommons.org/publicdomain/zero/1.0/'
REJECTED=[]
SOURCE=runpy.run_path(str(Path(__file__).with_name('catalogue-candidates.py')))
fetch=SOURCE['fetch']


def digest(data):return hashlib.sha256(data).hexdigest()
def relative(path):return str(path.relative_to(ROOT))
def db(value):return float(20*np.log10(max(float(value),1e-12)))
def rms(data):return float(np.sqrt(np.mean(data.astype(np.float64)**2)))


def decode(source,limit=180):
    args=['ffmpeg','-hide_banner','-loglevel','error','-i',str(source) if isinstance(source,Path) else 'pipe:0','-t',str(limit),'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1']
    data=subprocess.run(args,input=None if isinstance(source,Path) else source,capture_output=True,check=True).stdout
    return np.frombuffer(data,dtype='<f4').copy()


def trim(data):
    if not len(data):raise ValueError('Empty decoded source')
    loud=np.flatnonzero(np.abs(data)>max(.0001,float(np.max(np.abs(data)))*.003))
    if not len(loud):raise ValueError('Silent source')
    a=max(0,int(loud[0])-.015*RATE);b=min(len(data),int(loud[-1])+.040*RATE)
    return data[int(a):int(b)],int(a)/RATE,int(b)/RATE


def normalize(data,target=-24):
    before=rms(data);peak=float(np.max(np.abs(data)))
    if before<1e-6:raise ValueError('Source below useful signal floor')
    gain=min(10**((target-db(before))/20),10**(-3/20)/peak,10**(18/20))
    result=data*gain
    # Tiny edge fades remove crop clicks without flattening transients.
    n=min(int(.003*RATE),len(result)//6)
    if n:
        result[:n]*=np.linspace(0,1,n);result[-n:]*=np.linspace(1,0,n)
    return result.astype('<f4'),{'inputRmsDbFS':db(before),'inputPeakDbFS':db(peak),'gainDb':db(gain),'rmsDbFS':db(rms(result)),'samplePeakDbFS':db(np.max(np.abs(result)))}


def mouth_segments(data,max_grains=24):
    """Separate non-overlapping mouth transients, never duplicate/pitch-shift to inflate counts."""
    hop=int(.005*RATE);size=len(data)//hop
    if size<5:return []
    envelope=np.sqrt(np.mean(data[:size*hop].reshape(size,hop).astype(np.float64)**2,axis=1))
    threshold=max(float(np.max(envelope))*.12,.0006)
    peaks=[i for i in range(1,size-1) if envelope[i]>=threshold and envelope[i]>=envelope[i-1] and envelope[i]>envelope[i+1]]
    chosen=[]
    for p in sorted(peaks,key=lambda i:float(envelope[i]),reverse=True):
        if all(abs(p-q)*.005>=.25 for q in chosen):chosen.append(p)
        if len(chosen)>=max_grains:break
    result=[]
    for p in sorted(chosen):
        a=max(0,p*hop-int(.035*RATE));b=min(len(data),p*hop+int(.16*RATE))
        sample=data[a:b].copy()
        if len(sample)>=int(.025*RATE) and rms(sample)>.0003:result.append((sample,a/RATE,b/RATE))
    return result


def emit(candidate,data,filename,role,kind=None,trimmed=None,tags=None):
    target=-26 if role=='ambience' else -20 if role=='music' else -24
    data,quality=normalize(data,target)
    path=OUT/filename;path.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a','flac','-compression_level','8',str(path)],input=data.tobytes(),capture_output=True,check=True)
    # Probe the actual container, not an assumed input duration.
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',str(path)]))
    seconds=float(probe['format']['duration'])
    if seconds<.005 or quality['samplePeakDbFS']>-2.99:
        path.unlink()
        raise ValueError(f'Invalid normalized clip {filename}: {seconds}s, peak {quality["samplePeakDbFS"]} dBFS')
    row={k:candidate[k] for k in ['sourceUrl','licenseUrl','license','author','date','licenseEvidence','recordingId'] if k in candidate}
    row.update({'id':candidate['id']+':'+filename,'path':relative(path),'sha256':digest(path.read_bytes()),'role':role,'kind':kind or candidate['kind'],
        'durationSeconds':seconds,'sampleRate':RATE,'channels':1,'codec':probe['streams'][0]['codec_name'],'quality':quality,
        'tags':tags if tags is not None else candidate.get('tags',[]),'sourceId':candidate['id'],
        'sourceHash':candidate.get('sourceHash'),'sourceRangeSeconds':trimmed,
        'processing':'Decode mono 48 kHz; trim if documented; RMS gain with -3 dBFS peak ceiling, max +18 dB; 3 ms edge fades; FLAC.'})
    return row


def archive_bytes(pack,rows):
    url='https://kenney.nl/assets/'+pack
    opener=build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))
    page=fetch(url,opener).decode()
    ident=re.search("data-download-id='([^']+)'",page).group(1)
    link=json.loads(fetch('https://kenney.nl/download-link/'+ident,opener,url))['url']
    raw=fetch(link,opener,url)
    if digest(raw)!=rows[0]['archiveSha256']:raise ValueError('Official archive changed since licensed inventory; re-audit before use')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        proof='\n'.join(z.read(p).decode(errors='replace') for p in z.namelist() if 'license' in p.lower() and p.lower().endswith('.txt'))
        if not re.search(r'CC0|Creative Commons Zero',proof,re.I):raise ValueError('No CC0 licence in archive')
        return {r['id']:z.read(r['archiveMember']) for r in rows}


def kenney_pack(job):
    pack,rows=job
    missing=[r for r in rows if not (SRC/pack/Path(r['file']).name).exists()]
    downloaded=archive_bytes(pack,missing) if missing else {}
    clips=[]
    for original in rows:
        r=dict(original);path=SRC/pack/Path(r['file']).name
        raw=path.read_bytes() if path.exists() else downloaded[r['id']]
        r['sourceHash']=digest(raw)
        data,a,b=trim(decode(raw,20))
        role='tail' if r['kind']=='sting' else 'voice-grain' if r['kind']=='voice-effort' else 'body' if pack=='impact-sounds' else 'sweetener' if pack=='digital-audio' else 'foley' if pack in ['rpg-audio','casino-audio'] else 'transient'
        tags=[pack,Path(r['file']).stem]
        try:
            clips.append(emit(r,data,f'{pack}/{Path(r["file"]).stem}.flac',role,trimmed=[a,b],tags=tags))
        except ValueError as e:
            REJECTED.append({'source':r['id'],'error':str(e)})
    return clips


def remote_source(original):
    r=dict(original);raw=fetch(r['downloadUrl'],referer=r['sourceUrl']);r['sourceHash']=digest(raw)
    data=decode(raw,180)
    ident=r['id'].split(':')[-1]
    if r['kind']=='consonant':
        # Keep the master as a source too; it is not counted as another grain.
        master=emit(r,data,f'mouth-masters/{ident}.flac','foley',kind='mouth-recording',trimmed=[0,len(data)/RATE])
        clips=[master]
        for i,(sample,a,b) in enumerate(mouth_segments(data)):
            clips.append(emit(r,sample,f'consonants/{ident}-{i+1:02}.flac','consonant',trimmed=[a,b]))
        return clips
    if r['kind']=='cat-recording':
        data,a,b=trim(data)
        return [emit(r,data,f'cats/{ident}.flac','voice-grain',trimmed=[a,b])]
    if r['kind'] in ['ambience','foley']:
        # An empty cafe, kettle, rain, street and hearth remain independent beds.
        data=data[:RATE*40];tag=r['tags'][0]
        return [emit(r,data,f'ambience/{tag}-{ident}.flac','ambience',kind='ambience',trimmed=[0,len(data)/RATE])]
    if r['kind']=='music':
        return [emit(r,data,f'music/{Path(r["file"]).stem}.flac','music',trimmed=[0,len(data)/RATE])]
    raise ValueError('Unreviewed source kind')


def licences(clips):
    old=json.loads((ROOT/'apps/web/public/audio/LICENSES.json').read_text())
    by_path={r.get('path','apps/web/public/audio/'+r.get('file','')):r for r in old['files']}
    packs={r['pack']:r for r in json.loads((SRC/'SOURCES.json').read_text())}
    new={r['path']:r for r in clips}
    rows=[]
    for path in sorted([p for base in [SRC,ROOT/'apps/web/public/audio'] for p in base.rglob('*') if p.suffix.lower() in ['.flac','.opus','.webm','.mp3','.wav','.ogg','.aif','.aiff']]):
        rel=relative(path)
        if rel in new:
            source=new[rel]
        elif rel in by_path:
            source=by_path[rel]
        elif path.is_relative_to(SRC) and path.parent.name in packs:
            source=packs[path.parent.name]
        elif path.parent==SRC and path.stem in packs:
            source=packs[path.stem]
        elif path==SRC/'meow.mp3':source=packs['voice']
        else:raise ValueError('No provenance for '+rel)
        row={k:source[k] for k in ['sourceUrl','license','author','date','licenseEvidence','sourceId','sourceHash','sourceRangeSeconds','processing','sourceFiles','pack','role','kind'] if k in source}
        if not row.get('role'):
            pack=source.get('pack',path.parent.name)
            row['role']={'rpg-audio':'foley','impact-sounds':'body','interface-sounds':'transient','music-jingles':'tail','voice':'voice-grain'}.get(pack,'ambience' if path.stem=='ambience' else 'music')
        row.update({'path':rel,'file':path.name,'sha256':digest(path.read_bytes()),'licenseUrl':source.get('licenseUrl',CC0)})
        if not all(row.get(k) for k in ['sourceUrl','license','author','date']):raise ValueError('Incomplete licence '+rel)
        rows.append(row)
    (ROOT/'apps/web/public/audio/LICENSES.json').write_text(json.dumps({'licenseUrl':CC0,'files':rows},indent=2)+'\n')
    return len(rows)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--only',choices=['kenney','remote','legacy','all'],default='all');args=parser.parse_args()
    candidates=json.loads((SRC/'CANDIDATES.json').read_text())['files']
    prior=json.loads((SRC/'CATALOG.json').read_text())['clips'] if (SRC/'CATALOG.json').exists() else []
    clips={r['path']:r for r in prior};failures=[]
    if args.only in ['kenney','all']:
        packs=['rpg-audio','impact-sounds','interface-sounds','ui-audio','digital-audio','casino-audio','music-jingles']
        jobs=[]
        for pack in packs:
            rows=[r for r in candidates if r['pack']==pack]
            # A musically varied sting library, without counting alternate encodings.
            if pack=='music-jingles':rows=[r for r in rows if re.search(r'jingles_(HIT|SAX|STEEL)0[0-5]',r['file'])]
            jobs.append((pack,rows))
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures=[(pack,pool.submit(kenney_pack,(pack,rows))) for pack,rows in jobs]
            for name,future in futures:
                try:
                    result=future.result();clips.update({r['path']:r for r in result});print(name,len(result),'usable clips',flush=True)
                except Exception as e:failures.append({'source':name,'error':str(e)});print(name,'FAILED',str(e),flush=True)
    if args.only in ['remote','all']:
        rows=[r for r in candidates if r['pack']=='freesound' or r['pack']=='music-b2' and ('battle' in r['file'] or 'select_forest' in r['file'] or 'select_snow' in r['file'])]
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures=[(r['id'],pool.submit(remote_source,r)) for r in rows]
            for name,future in futures:
                try:
                    result=future.result();clips.update({r['path']:r for r in result});print(name,len(result),'usable clips',flush=True)
                except Exception as e:failures.append({'source':name,'error':str(e)});print(name,'FAILED',str(e),flush=True)
    if args.only in ['legacy','all']:
        metadata={r['pack']:r for r in json.loads((SRC/'SOURCES.json').read_text())}
        for name in ['landing','home','battle','boss']:
            r={**metadata[name],'id':'legacy:'+name,'kind':'music','licenseUrl':CC0,'sourceHash':digest((SRC/(name+'.ogg')).read_bytes())}
            data=decode(SRC/(name+'.ogg'),180)
            row=emit(r,data,f'music/legacy-{name}.flac','music',trimmed=[0,len(data)/RATE],tags=[name]);clips[row['path']]=row
    rows=sorted(clips.values(),key=lambda r:r['path'])
    # Hash equality catches accidental repeated output; no duplicated output counts toward gates.
    seen=set();unique=[]
    for row in rows:
        if row['sha256'] in seen:continue
        seen.add(row['sha256']);unique.append(row)
    failures.extend(REJECTED)
    (SRC/'CATALOG.json').write_text(json.dumps({'version':2,'clips':unique,'failures':failures},indent=2)+'\n')
    count=licences(rows)
    summary={'clips':len(unique),'licensedFiles':count,'catRecordings':len({r['recordingId'] for r in unique if r['kind']=='cat-recording'}),
        'catAuthors':len({r['author'] for r in unique if r['kind']=='cat-recording'}),
        'consonants':sum(r['role']=='consonant' for r in unique),'ambience':sum(r['role']=='ambience' for r in unique),
        'music':sum(r['role']=='music' for r in unique),'stings':sum(r['kind']=='sting' for r in unique),
        'sourceBytes':sum((ROOT/r['path']).stat().st_size for r in unique),'failures':failures,
        'normalization':'Peak/RMS source preparation; final LUFS measured at S3/S4/S5. Reference audio is never used.',
        'rawWavFilesWritten':0,'retainedZipFiles':0}
    (REPORT/'SOURCE-QUALITY.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)


if __name__=='__main__':main()
