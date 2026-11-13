#!/usr/bin/env python3
"""Preserve the greeting's spoken inflection through the shipping Opus codec."""
import datetime, json, subprocess
from pathlib import Path
from analyse import analyse_file
from callout_dsp import ROOT, WORK, process, save, recognizer, recognize, cat_speak
from publish_callouts import signed

B=ROOT/'reports/v3-shell/b2'
source=B/'MENU-VOICE-LINES.json'
production=json.loads(source.read_text())
row=next(r for r in production['lines'] if Path(r['path']).name=='mallow-1.flac')
report=B/'q5/menu-codec-probes.json'
result={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'sourceProduction':signed(source),
        'method':'The first greeting lost its contour in real encoded playback. Preserve vowel formants while giving the welcome a longer falling inflection. Test recognition, loudness and the exact shipping64kbps Opus codec; fresh browser evidence remains required.',
        'rows':[{'source':signed(ROOT/row['path']),'cueId':row['cueId'],
                 'unitId':row['unitId'],'originalText':row['text'],'attempts':[]}]}
model=recognizer(threads=2)
for index,(accent,pace) in enumerate([(4,1.15),(6,1.15),(6,1.3),(8,1.3)]):
    settings={**row['production']['settings'],'preserveFormants':True,
              'phraseAccent':accent,'paceMultiplier':pace}
    pcm,used,details=process({**row,'kind':'skill'},0,settings)
    path=WORK/'q5-menu-codec'/f'mallow-{index}.flac';save(path,pcm)
    opus=path.with_suffix('.opus')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-c:a','libopus','-b:a','64k',str(opus)],check=True)
    levels=cat_speak.loudness(path);asr=recognize(model,opus,row['text'])
    raw=analyse_file(path,duration=len(pcm)/24000)
    encoded=analyse_file(opus,duration=len(pcm)/24000)
    accepted=asr['wordAccuracy']>=.75 and -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1 and len(raw['voiceContourEvents'])==1 and len(encoded['voiceContourEvents'])==1 and max(e['duration'] for e in encoded['voiceContourEvents'])>=.25
    trial={**signed(path),'text':row['text'],'attempt':index+1,'production':details,
           'sources':[{'path':r['path'],'sha256':r['sha256']} for r in {r['path']:r for r in used}.values()],
           **levels,**asr,'isolatedMetrics':raw,'encoded':{**signed(opus),'metrics':encoded},'meetsDiagnosticCriteria':bool(accepted)}
    result['rows'][0]['attempts'].append(trial)
    result['rows'][0]['complete']=bool(accepted or index==3)
    report.write_text(json.dumps(result,indent=2)+'\n')
    print(index+1,accent,pace,asr['wordAccuracy'],len(raw['voiceContourEvents']),encoded['voiceContourEvents'],'CANDIDATE' if accepted else 'MISS',flush=True)
    if accepted:break
