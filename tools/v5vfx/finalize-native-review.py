"""Record an already completed visual review and compact per-cat proof."""
from pathlib import Path
import sys,json,datetime,subprocess,hashlib
cat=sys.argv[1];notes=json.load(sys.stdin);root=Path(f'work/v5/CXV/films/M-V2-{cat}-native-R1');now=datetime.datetime.now(datetime.timezone.utc).isoformat()
report=json.loads((root/'report.json').read_text());review=json.loads((root/'review-measure.json').read_text());assert report['pass']
for im in review['images']:
 assert not im['reviewed'];assert hashlib.sha256(Path(im['path']).read_bytes()).hexdigest()==im['sha256'];im.update(reviewed=True,reviewedUTC=now,views=1)
review['assessment']=notes;review['status']='Scoped motion evidence passes; pending integrated judge acceptance.'
video=review['comparison']['video'];probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate,nb_frames,duration','-of','json',video],text=True))['streams'][0]
assert probe['width']==1280 and probe['height']==720 and probe['avg_frame_rate']=='30/1' and int(probe['nb_frames'])==300
review['filmProbe']=probe;(root/'review-measure.json').write_text(json.dumps(review,indent=2)+'\n')
geometry=json.loads(Path('reports/v5/CXV/M-native-eight-geometry.json').read_text());rows=[r for r in geometry['rows'] if r['cat']==cat];profile=rows[0]['profile'];report.update(visualReview=review,geometry=rows,checks={'focused':60,'files':4,'typecheckExit':0,'runtimeEquivalentTo':'a3173c08e','logs':['work/v5/CXV/jobs/m-native-eight-tests-r2.log','work/v5/CXV/jobs/m-native-eight-typecheck-r2.log']})
Path(f'reports/v5/CXV/M-{cat}-native-R1.json').write_text(json.dumps(report,indent=2)+'\n')
normal=rows[0]['rangesPercentH'];reduced=rows[1]['rangesPercentH'];h=normal['head'];rh=reduced['head'];hit=report['cast']['exactHit'];lag=profile['lag'];images='; '.join(Path(im['path']).name for im in review['images'])
table=f'''# {cat.title()} — Batch M motion proof
Source {report['sourceCommit']}; UTC {report['completedUTC']}; URL {report['url']};1280×720, experimental capture. Source/artifact/runtime patch hashes in M-{cat}-native-R1.json.
Character: {profile['idea']}. {notes['motion']}

| Channel | Designer Mochi L1 | {cat.title()} |
|---|---|---|
| Loop / breath |10s total,3.333s dominant |10s/3breaths; root/meshseam0 |
| Head X/Y peak-to-peak |1.84/2.11%H |{h[0]:.3f}/{h[1]:.3f}%H; reduced{rh[0]:.3f}/{rh[1]:.3f}%H |
| Blink |nearclosed600–800ms |180ms close/400hold/320reopen;3.333s spacing,45ms right lag;phase{profile['blink']}s |
| Face |independent feature motion |eyes{1.2*profile['face']:.2f}px/mouth{2.4*profile['face']:.2f}px parallax |
| Ear / tail follow |lag not anatomically validated |ear{45*lag:.1f}/{70*lag:.1f}ms;tail{120*lag:.1f}/{240*lag:.1f}/{360*lag:.1f}ms authored lag |
| Tail / prop range X/Y |reference larger; tail track rejected |tail{normal['tail_3'][0]:.3f}/{normal['tail_3'][1]:.3f}%H;prop{normal['weapon'][0]:.3f}/{normal['weapon'][1]:.3f}%H |
| Cloth |soft follow-through |{1.8*profile['cloth']:.2f}px band-limited sway,lag{160*lag:.1f}ms |
| Cast |no supplied designer cast |1s additive:anticipate0–.28,reach.14–.72,hit.47–.71,recoverby1;cue250/550ms |
| Actual rules contact |existing rules retained |{report['cast']['duration']}ms action;{hit['ms']}ms→clip{hit['at']},bothmodes |
| Feet / handoff |planted-foot target |worldfeet0;directidle/cast endpoints0;actualscenehandoffmesh<.001/root<.001 |

60focused/TSC0;16CPU normal/reduced cases shared across8cats, this cat mintriangle{min(r['minTriangleRatio'] for r in rows):.5f}. Actualcapture0pageerrors and Soot301samples/11mesh snapshots exactly match baseline in bothmodes. Original rigs/weights untouched.
Same-height{review['comparison']['sameBodyHeightPx']}px,1×10s/300frame comparison film; SHA256 {review['comparison']['sha256']}.
Reviewed once: {images}. {notes['quality']}
Limits: {notes['limits']} Integrated judge URL acceptance and performance remain CXI gates. This is scoped motion evidence, not a release claim.
'''
Path(f'reports/v5/CXV/M-{cat}-timing.md').write_text(table)
p=Path('reports/v5/CXV/PROGRESS.log');p.write_text(p.read_text()+f'{now} {cat} nativeR1PASS;4freshimages measured/viewedonce;feet/seam0;actual350ms→skill.55bothmodes;Sootexact;side-by-sidefilmverified1280x720/300frames/30Hz. {notes["quality"]}\n')
p=Path('reports/v5/CXV/STATUS-VI.md');p.write_text(p.read_text()+f'\n{now} {cat.title()}: idle10giây/cast1giây đã qua capture6310; chân và vòng lặp0dịch, hit350ms→.55s cả2chếđộ;60test/TSC0. Đã xem4ảnhmới, phimso sánh1×cùngchiềucao. Chưa nghiệmthu bảnjudge/tốcđộ.\n')
print(json.dumps({'cat':cat,'source':report['sourceCommit'],'reportBytes':Path(f'reports/v5/CXV/M-{cat}-native-R1.json').stat().st_size,'reviewedImages':len(review['images']),'film':probe}))
