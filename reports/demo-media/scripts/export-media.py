from pathlib import Path
import subprocess,json,shutil,hashlib,html,zipfile
R=Path('/workspace/taskbar-captures');OUT=R/'deliverables';OUT.mkdir(exist_ok=True);(OUT/'character-clips').mkdir(exist_ok=True);(OUT/'captions').mkdir(exist_ok=True)
TMP=R/'edit';TMP.mkdir(exist_ok=True);FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
classes=['warrior','guardian','rogue','hunter','archer','witch','alchemist']
meta={id:json.loads((R/f'{id}.json').read_text()) for id in classes+['features','mobile']}
log=(R/'export.log').open('w')
def run(args):
 p=subprocess.run(args,stdout=log,stderr=subprocess.STDOUT)
 if p.returncode:raise RuntimeError('Media export failed; see export.log')
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate','-of','json',str(p)],text=True))
def textfile(key,text):
 p=TMP/f'{key}.txt';p.write_text(text);return str(p)
def label(key,title,subtitle):
 a=textfile(key+'-title',title);b=textfile(key+'-subtitle',subtitle)
 return f'drawbox=x=0:y=ih-92:w=iw:h=92:color=0x1a1220@0.95:t=fill,drawtext=fontfile={FONT}:textfile={a}:fontsize=34:fontcolor=0xfff3d0:x=30:y=h-78,drawtext=fontfile={FONT}:textfile={b}:fontsize=20:fontcolor=0xc8b7d3:x=30:y=h-34'
def encode(source,dest,start=0,duration=None,filter=None):
 args=['ffmpeg','-hide_banner','-loglevel','warning','-y','-ss',f'{start:.3f}','-i',str(source)]
 if duration:args+=['-t',f'{duration:.3f}']
 if filter:args+=['-vf',filter]
 args+=['-an','-c:v','libx264','-preset','fast','-crf','22','-threads','2','-pix_fmt','yuv420p','-r','25','-movflags','+faststart',str(dest)]
 run(args)
for id in classes:
 m=meta[id];duration=float(probe(m['raw'])['format']['duration'])-.65
 encode(m['raw'],OUT/f'character-clips/{id}.mp4',start=.45,duration=duration,
  filter=label(id,m['name']+' · '+m['weapon'],'Current in-game art · class selection + prepared demo save'))
 print('exported',id,flush=True)
encode(meta['features']['raw'],OUT/'feature-walkthrough.mp4',start=.3,filter=label('feature-full','Boss fights, equipment and the forge','Recorded gameplay · staged demo saves · no blockchain transaction'))
encode(meta['mobile']['raw'],OUT/'mobile-walkthrough.mp4',start=.3)
segments=[]
def card(key,title,subtitle,duration):
 p=TMP/f'{key}.mp4';a=textfile(key+'-card-title',title);b=textfile(key+'-card-sub',subtitle);c=textfile(key+'-card-note','Recorded demo gameplay · staged saves · silent video')
 vf=f'drawtext=fontfile={FONT}:textfile={a}:fontsize=82:fontcolor=0xffd27b:x=(w-text_w)/2:y=310,drawtext=fontfile={FONT}:textfile={b}:fontsize=32:fontcolor=0xfff3d0:x=(w-text_w)/2:y=425,drawtext=fontfile={FONT}:textfile={c}:fontsize=22:fontcolor=0xc8b7d3:x=(w-text_w)/2:y=550'
 run(['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','lavfi','-i',f'color=c=0x1a1220:s=1600x900:r=25:d={duration}','-vf',vf,'-an','-c:v','libx264','-preset','fast','-crf','22','-threads','2','-pix_fmt','yuv420p',str(p)])
 segments.append((p,title,subtitle))
card('intro','Taskbar Hero','Seven classes. One cat adventure.',3)
for id in classes:
 m=meta[id];p=TMP/f'class-{id}.mp4'
 encode(m['raw'],p,start=m['marks']['combat']+.55,duration=5.2,filter=label('montage-'+id,m['name']+' · '+m['weapon'],'Current in-game art · prepared demo save'))
 segments.append((p,m['name'],m['weapon']))
for key,title,duration in [('equipment','Equip the best gear',3.0),('arena','Challenge a chapter boss',2.5),('map','Explore the chapter map',2.0),('chest','Open first-clear rewards',3.0),('forge','Craft at the forge',3.5)]:
 m=meta['features'];p=TMP/f'feature-{key}.mp4';encode(m['raw'],p,start=m['marks'][key]+.55,duration=duration,filter=label('montage-'+key,title,'Prepared demo saves · browser-local progress'))
 segments.append((p,title,'Prepared demo save'))
m=meta['mobile'];p=TMP/'mobile-landscape.mp4';encode(m['raw'],p,start=m['marks']['stage']+.55,duration=4.5,filter='scale=-2:760:flags=neighbor,pad=1600:900:(ow-iw)/2:20:color=0x1a1220,'+label('mobile-landscape','Play on your phone','390 × 844 capture · responsive layout'))
segments.append((p,'Mobile layout','390 × 844'))
card('outro','Choose your class','Warrior · Guardian · Rogue · Hunter · Archer · Witch · Alchemist',3)
concat=TMP/'concat.txt';concat.write_text(''.join("file '"+str(p)+"'\n" for p,_,_ in segments))
run(['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(OUT/'taskbar-hero-demo.mp4')])
def timestamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
vtt='WEBVTT\n\n';timeline=[];at=0
for i,(p,title,sub) in enumerate(segments,1):
 d=float(probe(p)['format']['duration']);vtt+=f'{i}\n{timestamp(at)} --> {timestamp(at+d)}\n{title}\n{sub}\n\n';timeline.append({'start':round(at,3),'end':round(at+d,3),'title':title,'subtitle':sub});at+=d
(OUT/'captions/taskbar-hero-demo.vtt').write_text(vtt)
shutil.copytree(R/'screenshots',OUT/'screenshots',dirs_exist_ok=True)
(OUT/'README.md').write_text('''# Taskbar Hero demo recordings

- taskbar-hero-demo.mp4: all seven classes plus equipment, boss arena, chest, forge and mobile scenes.
- character-clips/: a separate real-gameplay recording for each class.
- feature-walkthrough.mp4 and mobile-walkthrough.mp4: additional uncut feature/mobile captures (with scene changes between demo saves).
- screenshots/: seven full-size class images, seven stage details, desktop features and mobile images.
- captions/: the showcase transcript in WebVTT.

These are silent recordings of the same static bundle used for the demo. Each class is genuinely selected; a prepared mid-game save and a 30-second clock advance trigger combat. Prepared boss/forge saves shorten the walkthrough. Current in-game art and existing economy are unchanged. No live account, private key, backend, blockchain transaction or mint is involved.

Open index.html for an offline gallery. The recordings were not uploaded to the existing Site; its access API currently reports public access. Source code and the existing Site were not changed by this capture task.
''')
items=[]
for id in classes:
 m=meta[id];items.append(f'<article><h2>{m["name"]}</h2><p>{m["weapon"]}</p><video controls preload="none" poster="screenshots/characters/{id}.png" aria-label="{m["name"]} gameplay"><source src="character-clips/{id}.mp4" type="video/mp4"></video><p><a href="character-clips/{id}.mp4" download>Download clip</a> · <a href="screenshots/characters/{id}.png">Screenshot</a></p></article>')
(OUT/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Taskbar Hero · Demo recordings</title><style>body{margin:32px auto;max-width:1400px;padding:0 24px;background:#1a1220;color:#fff3d0;font:16px system-ui}h1{color:#ffd27b}a{color:#d8b9ff}video{width:100%;border-radius:8px;background:#130c1a}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px}article{padding:18px;border:1px solid #705080;border-radius:12px;background:#251a30}p{line-height:1.6}main>video{max-width:1100px}</style><h1>Taskbar Hero · Seven-class showcase</h1><p>Actual demo gameplay · current in-game art · staged saves · silent recordings</p><main><video controls poster="screenshots/characters/warrior.png"><source src="taskbar-hero-demo.mp4" type="video/mp4"><track kind="captions" src="captions/taskbar-hero-demo.vtt" srclang="en" label="English"></video><p><a href="taskbar-hero-demo.mp4" download>Download showcase</a> · <a href="feature-walkthrough.mp4">Feature walkthrough</a> · <a href="mobile-walkthrough.mp4">Mobile walkthrough</a></p></main><h2>Every class</h2><section class="grid">'+''.join(items)+'</section></html>')
manifest={'capture_bundle_source_commit':'7d3da052dc9754917ade195843d7108ddac876a8','capture_scenarios':9,'classes':classes,'console_and_page_errors':{k:m['errors'] for k,m in meta.items()},'timeline':timeline,'videos':{},'screenshots':[]}
for p in sorted(OUT.rglob('*.mp4')):
 info=probe(p);assert info['streams'][0]['codec_name']=='h264';run(['ffmpeg','-v','error','-i',str(p),'-f','null','-']);manifest['videos'][str(p.relative_to(OUT))]={'duration':float(info['format']['duration']),'size_bytes':int(info['format']['size']),'width':info['streams'][0]['width'],'height':info['streams'][0]['height'],'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
for p in sorted((OUT/'screenshots').rglob('*.png')):manifest['screenshots'].append(str(p.relative_to(OUT)))
(OUT/'capture-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')

sheet='<h2>Screenshots</h2><section class="grid">'
for rel in manifest['screenshots']:
 title=Path(rel).stem.replace('-',' ').title();sheet+=f'<article><h3>{title}</h3><a href="{rel}"><img src="{rel}" loading="lazy" alt="{title}" style="width:100%;max-height:300px;object-fit:contain;image-rendering:pixelated"></a><p><a href="{rel}" download>Download full-size PNG</a></p></article>'
sheet+='</section>'
gallery=OUT/'index.html';gallery.write_text(gallery.read_text().replace('</html>',sheet+'</html>'))

zip_path=R/'taskbar-hero-demo-media.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(OUT.rglob('*')):
  if p.is_file():z.write(p,'taskbar-hero-demo-media/'+str(p.relative_to(OUT)))
print(json.dumps({'showcase_seconds':manifest['videos']['taskbar-hero-demo.mp4']['duration'],'video_count':len(manifest['videos']),'screenshots':len(manifest['screenshots']),'zip_bytes':zip_path.stat().st_size},indent=2),flush=True)
