import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,rmSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=resolve(import.meta.dirname,'../..');
const require=createRequire(resolve(root,'apps/web/package.json'));
const ts=require('typescript');
const sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const signed=p=>({path:p,sha256:sha(p)});
const unique=a=>[...new Set(a)];
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)]);

/** Expand only literals, finite domains and inspected adapters. Unknown expressions fail closed. */
export function collectAudioCalls(source,path,{domains={},eventCues=[],forwardedIds=[],bindings=[]}={}){
  const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,path.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const calls=[];
  const cueNames=new Set(['playCue']),engineNames=new Set(['audioEngine','audio']);
  for(const st of sf.statements)if(ts.isImportDeclaration(st))for(const item of st.importClause?.namedBindings?.elements??[]){
    if((item.propertyName??item.name).text==='playCue')cueNames.add(item.name.text);
    if((item.propertyName??item.name).text==='audioEngine')engineNames.add(item.name.text);
  }
  const values=node=>{
    if(!node)return [];
    if(domains[node.getText(sf)])return domains[node.getText(sf)];
    if(ts.isStringLiteralLike(node))return [node.text];
    if(ts.isParenthesizedExpression(node)||ts.isAsExpression(node)||ts.isNonNullExpression(node))return values(node.expression);
    if(ts.isConditionalExpression(node)){const a=values(node.whenTrue),b=values(node.whenFalse);return a.length&&b.length?unique([...a,...b]):[];}
    if(ts.isIdentifier(node))return node.text==='id'&&forwardedIds.length?forwardedIds:domains[node.text]??[];
    if(ts.isCallExpression(node)&&node.expression.getText(sf)==='eventCue')return eventCues;
    if(ts.isTemplateExpression(node)){
      const bound=node.templateSpans.some(s=>ts.isIdentifier(s.expression)&&bindings.some(b=>s.expression.text in b));
      if(bound)return unique(bindings.flatMap(binding=>{
        let out=[node.head.text];
        for(const span of node.templateSpans){const vs=ts.isIdentifier(span.expression)&&span.expression.text in binding?[binding[span.expression.text]]:values(span.expression);if(!vs.length)return [];out=out.flatMap(a=>vs.map(b=>a+b+span.literal.text));}
        return out;
      }));
      let out=[node.head.text];
      for(const span of node.templateSpans){const vs=values(span.expression);if(!vs.length)return [];out=out.flatMap(a=>vs.map(b=>a+b+span.literal.text));}
      return unique(out);
    }
    return [];
  };
  function visit(node){
    if(ts.isCallExpression(node)){
      const exp=node.expression;
      const named=ts.isIdentifier(exp)&&cueNames.has(exp.text);
      const property=ts.isPropertyAccessExpression(exp);
      const receiver=property?exp.expression.getText(sf):'';
      const bridge=property&&['play','music','ambience'].includes(exp.name.text)&&(engineNames.has(receiver)||receiver.includes('__thAudio'));
      if(named||bridge){
        const ids=values(node.arguments[0]).map(id=>property&&['music','ambience'].includes(exp.name.text)&&!id.startsWith(exp.name.text+'.')?exp.name.text+'.'+id:id);
        const {line,character}=sf.getLineAndCharacterOfPosition(node.getStart(sf));
        calls.push({path,line:line+1,column:character+1,expression:node.arguments[0]?.getText(sf)??'',ids:unique(ids),delegation:forwardedIds.length>0});
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(sf);return calls;
}

export async function writeSoundMap(){
  const tmp=resolve(root,'tmp/b2-sound-map');mkdirSync(tmp,{recursive:true});
  const entry=resolve(tmp,'entry.ts');
  writeFileSync(entry,`export * from '../../apps/web/src/audio/sound-map';\nexport * from '../../apps/web/src/audio/cues';\nexport * from '../../apps/web/src/audio/feedback';`);
  const {build}=await import(require.resolve('vite'));
  let M;
  try{
    await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:tmp,minify:false,lib:{entry,formats:['es'],fileName:()=> 'map.mjs'}}});
    M=await import(pathToFileURL(resolve(tmp,'map.mjs')).href+'?at='+Date.now());
  }finally{rmSync(tmp,{recursive:true,force:true});}
  const eventCues=unique([...Object.values(M.EVENT_CUES),'hit.magic',...M.SOUND_STATUSES.flatMap(status=>['status_apply','status_expire','status-tick'].map(type=>M.eventCue({type,status})))]);
  const manifest=JSON.parse(readFileSync(resolve(root,'apps/web/public/audio/manifest.json'),'utf8'));
  const existing=unique([...Object.keys(manifest.cues),...eventCues,...Object.keys(M.CUE_ALIASES),...Object.values(M.CUE_ALIASES)]);
  const sources=walk(resolve(root,'apps/web/src')).filter(p=>/\.(ts|tsx)$/.test(p)&&!/(?:\.test\.|\/__tests__\/)/.test(p));
  const calls=[],inspected=[];
  for(const file of sources){
    const path=relative(root,file),source=readFileSync(file,'utf8');
    const slots=JSON.parse(readFileSync(resolve(root,'apps/web/src/audio/voice-callouts.json'),'utf8')).filter(r=>r.kind==='skill').map(r=>({unit:r.unitId,slot:r.slot}));
    const adapters=path==='apps/web/src/audio/events.ts'?{domains:{unit:M.SOUND_UNITS,phase:M.SOUND_PHASES},bindings:slots,eventCues}:
      path==='apps/web/src/game/cardrpg/ui-v3/RecruitV3.tsx'?{domains:{'active.rarity':M.SOUND_RARITIES,'reward.rarity':M.SOUND_RARITIES}}:
      path==='apps/web/src/game/cardrpg/ui-v3/RewardFly.tsx'?{domains:{currency:M.SOUND_CURRENCIES}}:
      path==='apps/web/src/game/cardrpg/ui-v3/ShellV3.tsx'?{domains:{musicScene:['home','map','battle','boss','gacha'],ambientScene:['home','bag','invitations','cats','settings','chapter-map','battle-prep','field-guide','reward','boss','battle']}}:
      path==='apps/web/src/game/cardrpg/shell/BagB2.tsx'?{domains:{cardId:M.CATS,event:['select','victory'],'spec.slot':M.SOUND_SLOTS}}:
      path==='apps/web/src/game/cardrpg/shell/BoundFusion.tsx'?{domains:{'R.GEAR_BY_ID[r.state.gear.at(-1)!.templateId]!.rarity':M.SOUND_RARITIES}}:
      path==='apps/web/src/audio/feedback.ts'?{domains:{id:M.UI_FEEDBACK_CUES}}:
      path==='apps/web/src/game/cardrpg/contracts/audio-cues.ts'?{forwardedIds:[...M.SOUND_CUES.keys()]}:{};
    const found=collectAudioCalls(source,path,adapters);
    if(found.length){calls.push(...found);inspected.push(signed(path));}
  }
  const missingExisting=existing.filter(id=>!M.SOUND_CUES.has(id));
  const unresolved=calls.filter(c=>!c.ids.length||c.ids.some(id=>!M.SOUND_CUES.has(id))).map(c=>({...c,missing:c.ids.filter(id=>!M.SOUND_CUES.has(id))}));
  const b=resolve(root,'reports/v3-shell/b2');
  writeFileSync(resolve(b,'SOUND-MAP.json'),JSON.stringify({version:1,kind:'authoring-plan',rows:M.SOUND_MAP},null,2)+'\n');
  const report={existingCueCount:existing.length,missingExisting,callsiteCount:calls.length,unresolved,cuesSource:signed('apps/web/src/audio/cues.ts'),sources:inspected,
    mapSource:signed('apps/web/src/audio/sound-map.ts'),manifestSource:signed('apps/web/public/audio/manifest.json'),
    scannedSourceCount:sources.length,calls,existingCues:existing,
    adapters:{events:'playFrame unit IDs from live cat/enemy catalogues; four effect phases; eventCue outputs expanded over live statuses and known event types.',bridge:'Contract wrapper delegates the concrete caller IDs; wrapper is not counted as an independent gameplay event.'}};
  writeFileSync(resolve(b,'SOUND-MAP-COVERAGE.json'),JSON.stringify(report,null,2)+'\n');
  const lines=['# B2 sound map','','Generated from typed sound-map.ts. This is the production plan; assets, screen wiring and playback measurements are separately gated by S2–S7.','',
    `${M.SOUND_MAP.length} event/screen assignments; ${M.SOUND_SCREENS.length} screens; ${M.SOUND_CUES.size} distinct cues.`,
    `${existing.length} legacy/current cue IDs inspected; ${missingExisting.length} missing. ${calls.length} call sites in ${sources.length} production source files; ${unresolved.length} unresolved.`,
    '', 'Pitch values are playback-rate ratios. Random gain is in dB. Every layer pool is a production role, not a claim that the asset exists. Hits reserve four variants per layer; UI reserves three. High-priority ultimate/voice requests duck music −8 dB with 120 ms attack / 400 ms release.',
    '', 'S6 must stop tx.pending on confirmation, failure, rejection or panel disposal; cap count.tick at 20/s with rising pitch; crossfade ambience for 800 ms. Audio is gesture-unlocked; no hover sound before consent. One voice at a time, ordinary battle voice cadence 6–9 s. A owns battle event timing; B owns playback and assets.',
    '', 'The legacy forge-success/fail hyphen IDs remain accepted aliases for the dotted IDs. New callout IDs are additive. Enemy basic/signature mechanics are mapped separately from cat skills. No reference samples are included.',
  ];
  for(const screen of M.SOUND_SCREENS){
    lines.push('',`## ${screen}`,'','| Event | Cue | Bus | Layers (pool / variants / delay ms / EQ) | Variants | Pitch | Gain dB | Cooldown ms | Priority | Duck music | Owner |','|---|---|---|---|---:|---|---|---:|---:|---|---|');
    for(const row of M.SOUND_MAP.filter(r=>r.screen===screen))lines.push(`| ${row.event} | ${row.cueId} | ${row.bus} | ${row.layers.map(l=>`${l.pool} / ${l.variants} / ${l.offsetMs} / ${l.eq}`).join('; ')} | ${row.variantCount} | ${row.pitchRange.join('–')} | ${row.volumeRange.join('–')} | ${row.cooldownMs} | ${row.priority} | ${row.ducking?'-8 dB; 120/400 ms':'none'} | ${row.owner} |`);
  }
  writeFileSync(resolve(b,'SOUND-MAP.md'),lines.join('\n')+'\n');
  console.log(JSON.stringify({events:M.SOUND_MAP.length,screens:M.SOUND_SCREENS.length,cues:M.SOUND_CUES.size,existing:existing.length,calls:calls.length,missingExisting,unresolved},null,2));
  return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const r=await writeSoundMap();process.exitCode=r.missingExisting.length||r.unresolved.length?1:0;
}
