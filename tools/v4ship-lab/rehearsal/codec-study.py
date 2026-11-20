"""Compare compression methods on preserved real-build footage, never final proof."""
from pathlib import Path
import subprocess,json,hashlib,time,re,gzip,datetime

root=Path(__file__).resolve().parents[3]
source=root/'reports/v3-battle/A6/demo-v3.webm'
out=root/'work/v4ship-prep/S10-codec-1'
report=root/'reports/v4-ship/S10/codec-comparison-1.json'
assert not report.exists() and not out.exists(), 'Preserve previous experiment'
assert not (root/'STOP-V4SHIP').exists()
out.mkdir(parents=True);report.parent.mkdir(parents=True,exist_ok=True)
logs=[];rows=[]
def run(args):
    start=time.monotonic()
    result=subprocess.run(args,cwd=root,capture_output=True,text=True)
    logs.append({'command':args,'exit':result.returncode,'stdout':result.stdout,'stderr':result.stderr})
    assert result.returncode==0, 'Codec experiment failed; diagnostic log preserved'
    return result,time.monotonic()-start
try:
    for method in ['crf24','two-pass430k']:
        target=out/(method+'.mp4')
        common=['ffmpeg','-hide_banner','-nostdin','-threads','1','-ss','15','-t','12','-i',str(source),'-map','0:v:0','-vf','fps=30,format=yuv420p','-c:v','libx264','-threads','1','-preset','slow']
        elapsed=0
        if method=='crf24':
            _,elapsed=run(common+['-crf','24','-map','0:a:0','-c:a','aac','-b:a','64k','-movflags','+faststart',str(target)])
        else:
            prefix=str(out/'pass')
            for n in [1,2]:
                args=common+['-b:v','430k','-pass',str(n),'-passlogfile',prefix]
                args+=['-an','-f','null','/dev/null'] if n==1 else ['-map','0:a:0','-c:a','aac','-b:a','64k','-movflags','+faststart',str(target)]
                _,seconds=run(args);elapsed+=seconds
        probe,_=run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_type,r_frame_rate','-of','json',str(target)])
        metrics=json.loads(probe.stdout)
        quality,_=run(['ffmpeg','-hide_banner','-nostdin','-threads','1','-i',str(target),'-threads','1','-ss','15','-t','12','-i',str(source),'-filter_complex_threads','1','-lavfi','[0:v]settb=AVTB,setpts=PTS-STARTPTS[a];[1:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS[b];[a][b]ssim=shortest=1','-an','-f','null','-'])
        values=re.findall(r'SSIM Y:[^\n]* All:([0-9.]+)',quality.stderr)
        assert values, 'No comparison metric'
        size=target.stat().st_size;duration=float(metrics['format']['duration'])
        rows.append({'method':method,'seconds':duration,'bytes':size,'encodingSeconds':round(elapsed,3),'ssim':float(values[-1]),'linear150SecondSizeEstimateBytes':round(size/duration*150),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'streams':metrics['streams']})
    result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':str(source.relative_to(root)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'scope':'12-second compression study of historical A6 actual gameplay; NOT V4 journey or submission footage','sourceStartSeconds':15,'rows':rows,'decision':'Use bounded two-pass bitrate for the 10 MB delivery ceiling; inspect caption readability and measure the entire final film before acceptance.','limitations':['A short historical segment cannot establish final V4 quality, duration, complete seven-step coverage or final file size.','SSIM is a numerical comparison, not proof of readable captions or perceptual equivalence.']}
    report.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'report':str(report.relative_to(root)),'rows':rows}))
finally:
    (report.parent/'codec-comparison-1.log.json.gz').write_bytes(gzip.compress(json.dumps(logs).encode()))
