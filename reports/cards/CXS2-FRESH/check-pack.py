from pathlib import Path
import hashlib,json,re,struct,subprocess,sys
root=Path(sys.argv[1]); helper=Path(__file__).with_name('source-facts.mjs')
try:
 files=['README.md','docs/submission.md','docs/pitch-slides.md','docs/video-script.md','docs/judge-walkthrough.md','reports/n4-submission.md','reports/submission/licensing-review.md']
 texts={f:(root/f).read_text() for f in files}
 submission=texts['docs/submission.md']; readme=texts['README.md']; video=texts['docs/video-script.md']; slides=texts['docs/pitch-slides.md']
 assert 'DRAFT, not submitted' in submission,'draft/submission boundary'
 assert 'repository stays private' in submission.lower() and 'repository remains **private**' in readme.lower(),'private repository boundary'
 assert 'Fresh funded wallet proof is NOT VERIFIED' in submission,'wallet evidence overclaim'
 assert 'PR #244 remains unmerged' in submission and 'UnsafeFunctionDownloadPathError' in submission,'backend backup boundary'
 assert 'unknown' in texts['reports/submission/licensing-review.md'].lower(),'historical provenance limits absent'
 alltext='\n'.join(texts.values()).lower()
 for phrase in ['must be made public','make it public','fully audited','backup complete','funded wallet proof is verified','zero unknown origins/no submission risk is confirmed']:
  assert phrase not in alltext,'unsupported claim: '+phrase
 assert 'Not a completed' in video or 'not a completed' in video,'recording versus plan boundary'
 assert 'not a completed timed demo' in texts['docs/judge-walkthrough.md'],'timed QA overclaim'
 assert '43113' in submission and '43113' in readme and '43113' in video,'Fuji chain missing/wrong'
 deployment=json.loads((root/'packages/chain/deployments/43113.json').read_text()); allowed={deployment['RelicNFT'],deployment['RelicMarket']}
 for file,text in texts.items():
  addresses=set(re.findall(r'0x[0-9A-Fa-f]{40}(?![0-9A-Fa-f])',text))
  assert addresses<=allowed,'wrong address in '+file
 for address in allowed:assert address in submission and address in readme,'contract missing'
 titles=re.findall(r'^## Slide (\d+) ',slides,re.M);assert 8<=len(titles)<=10 and titles==[str(n) for n in range(1,len(titles)+1)],'slide count/order'
 rows=re.findall(r'^\|(\d\d):(\d\d)–(\d\d):(\d\d)\|',video,re.M);times=[(int(a)*60+int(b),int(c)*60+int(d)) for a,b,c,d in rows]
 assert len(times)==9 and times[0][0]==0 and 0<times[-1][1]<=150,'video time budget'
 assert all(a<b for a,b in times) and all(times[i][1]==times[i+1][0] for i in range(len(times)-1)),'video timing continuity'
 assert 'Vietnamese narration with English subtitles' in video and 'Đây là Taskbar Hero' in video,'narration/subtitle languages'
 manifest=json.loads((root/'reports/submission/evidence/media-manifest.json').read_text());receipt=json.loads((root/'reports/submission/evidence/6144d42-acceptance.json').read_text())
 assert manifest['status']=='DRAFT_BASELINE_MEDIA' and manifest['refreshAfterUIBoardReadiness'] is True,'media freshness boundary'
 assert manifest['sourceHead']==receipt['mergeHead']=='6144d42ce12d9c61dc4f863733356de99f605eb9','media release identity'
 assert receipt['live']['transactionsPerformed']==0 and receipt['live']['fullFundedDemo'] is False,'receipt scope changed'
 assert len(manifest['images'])==7,'media inventory'
 for item in manifest['images']:
  path=root/item['path'];data=path.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n','PNG signature'
  assert hashlib.sha256(data).hexdigest()==item['sha256'],'media hash mismatch'
  size=struct.unpack('>II',data[16:24]);assert item['viewport']==str(size[0])+'x'+str(size[1]),'media viewport mismatch'
  assert item['sourceHead']==manifest['sourceHead'] and 'no wallet transaction or victory claimed' in item['scope'],'media claim mismatch'
 assert 'historical' in readme.lower() and 'version-specific' in submission,'historical counts mislabeled'
 assert receipt['main']['corePassed']==2490 and receipt['main']['browserPerSize']==323,'receipt counts drift'
 links=0
 for file,text in texts.items():
  for url in re.findall(r'\]\(([^)]+)\)',text):
   if url.startswith(('http:','https:','#')):continue
   assert (root/file).parent.joinpath(url.split('#')[0]).exists(),'missing link in '+file
   links+=1
 facts=json.loads(subprocess.check_output(['node',str(helper),str(root)],text=True))
 assert 'original-economy flag remains false' in submission,'default-OFF boundary'
 assert 'no new artwork' in texts['reports/submission/licensing-review.md'].lower(),'art ownership boundary'
 print(json.dumps(dict(status='PASS',slides=len(titles),plannedVideoSeconds=times[-1][1],images=7,localLinks=links,sourceFacts=facts,submission='DRAFT_ONLY',wallet='NOT_VERIFIED',backup='BLOCKED')))
except (AssertionError,KeyError,ValueError) as error:
 print('PACK_VALIDATION_FAIL',str(error));sys.exit(1)
