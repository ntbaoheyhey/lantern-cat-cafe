/** Evidence is data, never a manually written PASS flag. Missing/NaN/stale = FAIL. */
import {readFileSync, existsSync, statSync, readdirSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const root = resolve(import.meta.dirname, '../..');
export const evidenceRoot = 'reports/v3-battle/a2';
export const fixtures = ['wave1', 'wave3', 'boss'];
const views = ['1280x720', '1440x900'];
const read = p => {try {return JSON.parse(readFileSync(p,'utf8'));} catch {return null;}};
export const get = (o,p) => p.split('.').reduce((a,k)=>a?.[k],o);
export function numeric(value, op, limit) {
  if (!Number.isFinite(value)) return false;
  if (op==='band') return Array.isArray(limit)&&limit.length===2&&limit.every(Number.isFinite)&&value>=limit[0]&&value<=limit[1];
  if (!Number.isFinite(limit)) return false;
  return op==='min'?value>=limit:op==='max'?value<=limit:op==='eq'?value===limit:false;
}
const G = (id,path,op,limit,extra={})=>({id,path,op,limit,...extra});
const file = (id,path,min=1)=>G(id,path,'min',min,{kind:'files'});
const matrix = (id,path,op,limit,sizes=views)=>G(id,path,op,limit,{matrix:sizes.flatMap(v=>fixtures.map(f=>`${f}@${v}`))});
const three = (id,path,op,limit)=>G(id,path,op,limit,{matrix:fixtures});
const shared = [G('typecheck','suite.typecheckExit','eq',0),G('unit','suite.unitExit','eq',0),G('e2e','suite.e2eExit','eq',0),G('parity','suite.parityExit','eq',0)];
export const cards = {
  G0: {sources:['scripts/v3a2/check-gates.mjs','scripts/v3a2/check-gates.test.mjs','scripts/v3a2/compare-sheet.mjs','scripts/v3a2/battle-capture.mjs','scripts/v3a2/fixtures.json'], gates:[
    G('bootstrap-all-fail','bootstrap.failed','eq','bootstrap.total',{localLimit:true}),G('bootstrap-gate-count','bootstrap.total','min',100),G('tests','checkerTestExit','eq',0),
    G('fixtures','captureFixtures','eq',3),G('fps','captureFps','eq',30),file('fixture-captures','G0/capture-*.json',3),file('checker-test-log','G0/checker-tests.log'),file('bootstrap-log','G0/bootstrap.log'),file('compare-tool','../../../scripts/v3a2/compare-sheet.mjs'),file('capture-tool','../../../scripts/v3a2/battle-capture.mjs')
  ]},
  R: {sources:['scripts/v3a2/ref-metrics.mjs','scripts/v3a2/ref_metrics.py','scripts/v3a2/ref-annotations.json','scripts/v3a2/baseline-metrics.py','scripts/v3a2/baseline-glyphs.mjs','scripts/v3a2/split-pilots.py','scripts/v3a2/collect-research.mjs'], gates:[
    G('windows','reference.samples.windows','min',12),G('window-seconds','reference.samples.minWindowSeconds','min',10),G('ultimate-windows','reference.samples.ultimateWindows','min',6),
    G('unit-boxes','reference.samples.boxes','min',40),G('unit-frames','reference.samples.boxFrames','min',10),G('number-boxes','reference.samples.numbers','min',30),G('text-frames','reference.samples.textFrames','min',10),G('displacement-windows','reference.samples.displacementWindows','min',3),
    ...['scale.median','scale.p10','scale.p90','motion.meanEnergy','motion.displacementPer10s','ultimate.coverageMedian','ultimate.peakLuminance','ultimate.whiteoutFraction','ultimate.dominantHues','ultimate.durationMedian','numbers.medianHeight720','numbers.maxSimultaneous','numbers.impactPerSecond','text.medianWords','audio.normalOnsetsPerSecond','audio.ultimateOnsetsPerSecond','audio.voiceLikePerMinute'].map(p=>G(p,`reference.${p}`,'min',0)),
    file('reference-json','REF-METRICS.json'),file('baseline-json','OURS-BASELINE.json'),file('research-table','RESEARCH-A2.md'),G('table-rows','research.tableRows','min',20),G('articles','research.articles','min',3),G('motion-rules','research.motionRules','min',12),G('split-pilots','research.splitPilots','eq',3),G('layer-types','research.layerTypes','min',15),G('targets-measured','research.targetsMeasured','eq',1)
  ]},
  F1: {sources:['apps/web/src/game/cardrpg/stage','apps/web/src/game/cardrpg/spine/layout.ts','apps/web/src/game/cardrpg/spine/scene.ts','apps/web/src/game/cardrpg/spine/stage-painting.ts','apps/web/src/game/cardrpg/battle-v3/BattleHud.tsx','scripts/v3a2/field-audit.mjs','scripts/v3a2/browser-fixture.mjs','scripts/v3a2/collect-field.mjs','apps/web/e2e/formation-c2.spec.ts'],gates:[
    matrix('unit-height','medianCoreHeightFraction','band','scaleBand'),matrix('face-occlusion','maxFaceOcclusion','max',.1),matrix('clipping','clippedUnits','eq',0),matrix('floor','visibleFloorFraction','min',.5),matrix('field-names','fieldNameLabels','eq',0),G('core-size','coreSizeExit','eq',0),file('comparisons','F1/compare-*.png',3)
  ]},
  F2: {sources:['apps/web/src/game/cardrpg/battle-v3/body-fx.ts','apps/web/src/game/cardrpg/spine/scene.ts'],gates:[
    three('alpha','unitMeanAlpha','min',.97),three('persistent-bubbles','framesWithMultiplePersistentBubbles','eq',0),three('contrast','silhouetteContrast','min','silhouetteContrastMin'),file('comparisons','F2/compare-*.png',3)
  ]},
  M1: {sources:['apps/web/src/game/rig','apps/web/src/game/cardrpg/battle-v3/motion.ts','apps/web/src/game/cardrpg/spine/scene.ts'],gates:[
    three('seconds','seconds','min',30),three('displacements','displacementPer10s','min','displacementEventsPer10sMin'),three('motion-energy','motionEnergy','min','motionEnergyMin'),three('every-action-moves','minActionDisplacementFraction','min',.06),three('hit-knockback','hitKnockbackFraction','eq',1),three('high-fps','fpsHigh','min',50),G('crowded-units','performanceUnits','min',10),file('archetype-strips','M1/motion-*.png',6)
  ]},
  M2: {sources:['art/rig-templates','art/units','apps/web/public/units','apps/web/src/game/rig'],gates:[
    G('units-inspected','rigs.inspected','eq',22),G('separate-parts','rigs.separateEyeMouthWeapon','min',20),G('zero-holes','rigs.zeroHoles','min',18),G('remaining-holes','rigs.maxRemainingHoles','max',150),G('extreme-poses','rigs.minPoses','min',8),G('joint-overlap','rigs.minJointOverlap','min',12),G('core-size','coreSizeExit','eq',0),file('face-strips','M2/face-*.png',22)
  ]},
  V1: {sources:['tools/cinematic-compositor/compositor.ts','tools/cinematic-compositor/plates','apps/web/public/cinematics','apps/web/src/game/cardrpg/battle-v3/cinematic-player.ts'],gates:[
    G('plate-count','plates.count','eq',13),G('coverage','plates.minCoverage','min','effectCoverageMin'),G('viewport','plates.minViewportFill','eq',1),G('edges','plates.minChangedEdgeColumns','eq',2),G('layer-types','plates.minVerifiedLayerTypes','min',7),G('particles','plates.minPeakParticles','min',300),G('beats','plates.minDistinctBeats','min',3),G('distinctness','plates.maxMeanPairSSIM','max',.55),G('pair-count','plates.pairsMeasured','eq',78),G('bytes','plates.totalBytes','max',20*1024*1024),file('comparisons','V1/compare-*.png',13),file('render-log','V1/compositor.json')
  ]},
  V2: {sources:['apps/web/src/game/cardrpg/battle-v3/numbers.ts','apps/web/src/game/cardrpg/battle-v3/field-vfx.ts','apps/web/src/game/cardrpg/vfx-layered','skills'],gates:[
    three('number-height','medianGlyphHeight720','band','numberHeightBand'),three('active-coverage','minActiveCoverage','min',.15),three('basic-coverage','minBasicCoverage','min',.05),three('impact-density','impactNumbersPerSecond','min','numbersPerSecondMin'),three('high-fps','fpsHigh','min',50),G('sequences','sequences.count','min',36),G('distinctness','sequences.maxCrossCatActiveSSIM','max',.6),file('sequence-strips','V2/sequence-*.png',36)
  ]},
  V3: {sources:['apps/web/src/game/cardrpg/battle-v3/battle-audio.ts','apps/web/src/game/cardrpg/contracts/audio-cues.ts','skills'],gates:[
    three('cue-density','cueEventsPerSecond','min','cueEventsPerSecondMin'),three('ultimate-voice','voicedUltimateFraction','eq',1),three('active-voice','voicedActiveFraction','eq',1),three('unknown-cues','missingContractCueIds','eq',0),three('bark-spacing','meanBarkIntervalSeconds','band',[7,8]),G('callout-rows','calloutRows','min',25),file('callout-table','../REQUESTS-TO-B.md')
  ]},
  T1: {sources:['apps/web/src/game/cardrpg/battle-v3/BattleHud.tsx','apps/web/src/game/cardrpg/battle-v3/battle.css','apps/web/src/game/cardrpg/stage/FormationC2.tsx'],gates:[
    three('word-samples','framesCounted','min',30),three('word-max','maxNonNumberWords','max',8),G('system-fonts','fontLint.systemFonts','eq',0),file('desktop-small','T1/1280x720.png'),file('desktop-large','T1/1440x900.png'),file('phone','T1/phone.png'),file('comparisons','T1/compare-*.png',3)
  ]},
  SY1: {sources:[],notBefore:'2026-11-16T12:00:00Z',gates:[file('report','SYNC-16.md'),G('commit-ids','commitIds','eq',2),G('lint','suite.lintExit','eq',0),G('build','suite.buildExit','eq',0),G('browser-cases','browserCasesReviewed','eq',13),G('cue-coverage','cueCoverage.measured','eq',1)]},
  SY2: {sources:[],notBefore:'2026-11-18T12:00:00Z',gates:[file('report','SYNC-18.md'),G('commit-ids','commitIds','eq',2),G('lint','suite.lintExit','eq',0),G('build','suite.buildExit','eq',0),G('browser-cases','browserCasesReviewed','eq',13),G('cue-coverage','cueCoverage.measured','eq',1)]},
  D1: {sources:['tools/cinematic-compositor/record-demo.mjs','tools/cinematic-compositor/encode-demo.mjs'],notBefore:'2026-11-18T12:00:00Z',gates:[
    G('after-sync','afterSY2Merge','eq',1),G('duration','seconds','eq',90),G('battle-time','battleSeconds','min',55),G('landing-home','landingHomeSeconds','max',15),G('forge-time','forgeSeconds','max',12),G('ultimates','distinctUltimates','min',3),G('geometry','width','eq',1280),G('height','height','eq',720),G('fps','fps','eq',30),G('F1','metrics.F1','eq',1),G('F2','metrics.F2','eq',1),G('M1','metrics.M1','eq',1),G('V1','metrics.V1','eq',1),G('V2','metrics.V2','eq',1),G('loudness','integratedLUFS','band','audioLoudnessBand'),G('trailer-seconds','trailer.seconds','eq',30),G('trailer-bytes','trailer.bytes','max',6*1024*1024),G('desktop-copy','desktopCopyVerified','eq',1),file('video','D1/demo-v3a2.webm'),file('filmstrip','D1/filmstrip.png'),file('comparisons','D1/compare-*.png',6)
  ]},
  SY3: {sources:[],notBefore:'2026-11-19T12:00:00Z',gates:[file('report','REPORT-A2.md'),file('status','STATUS-VI.md'),G('status-lines','statusLines','max',30),G('final-gate-coverage','finalGateCoverage','eq',1),G('draft-pr','draftPrUpdated','eq',1)]},
  P: {sources:[],gates:[G('items','completedItems','eq',10),G('commits','separateCommits','min',10),G('comparisons','itemsWithEvidence','eq',10),G('unresolved-partials','partialCardsRemaining','eq',0),G('six-camera-variants','secondCameraVariants','min',6),G('low-fps','lowFpsAt4xCpu','min',30)]}
};
for(const spec of Object.values(cards)) spec.gates.push(...shared);

export function filesMatching(base, pattern) {
  const path=resolve(base,pattern);
  if(!pattern.includes('*')) return existsSync(path)&&statSync(path).isFile()&&statSync(path).size>0?[path]:[];
  const dir=resolve(path,'..'),name=path.split('/').at(-1),re=new RegExp('^'+name.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$');
  return existsSync(dir)?readdirSync(dir).filter(n=>re.test(n)).map(n=>resolve(dir,n)).filter(p=>statSync(p).isFile()&&statSync(p).size>0):[];
}
export function sourceRevision(repo, sources) {
  if(!sources.length)return null;
  try {const [commit,date]=execFileSync('git',['log','-1','--format=%H|%cI','--',...sources],{cwd:repo,encoding:'utf8'}).trim().split('|');return {commit,date};}catch{return null;}
}
export function fresh(meta, revision, repo=root) {
  if(!meta?.sourceCommit||!Number.isFinite(Date.parse(meta.generatedAt)))return false;
  if(!revision?.commit)return true;
  if(Date.parse(meta.generatedAt)<Date.parse(revision.date))return false;
  try {execFileSync('git',['merge-base','--is-ancestor',revision.commit,meta.sourceCommit],{cwd:repo,stdio:'ignore'});return true;}catch{return false;}
}
export function checkCard(id, {repo=root,base=resolve(repo,evidenceRoot),targets=read(resolve(repo,'scripts/v3a2/targets.json')),now=new Date(),data,skipFreshness=false}={}) {
  const spec=cards[id];if(!spec)throw Error('Unknown card '+id);
  data??=read(resolve(base,id,'metrics.json'));
  const rows=[];
  if(!skipFreshness){
    const revision=sourceRevision(repo,spec.sources),ok=fresh(data?._meta,revision,repo);
    rows.push({id:`${id}.freshness`,pass:ok,measured:data?._meta?.sourceCommit??'missing',required:`evidence >= ${revision?.commit??'source revision'}`});
    let dirty=true;try{dirty=spec.sources.length>0&&execFileSync('git',['status','--porcelain','--',...spec.sources],{cwd:repo,encoding:'utf8'}).trim().length>0;}catch{}
    rows.push({id:`${id}.committed-source`,pass:!!data&&!dirty,measured:data?(dirty?1:0):'missing evidence',required:'eq 0 uncommitted source changes'});
  }
  if(spec.notBefore)rows.push({id:`${id}.date`,pass:now>=new Date(spec.notBefore)&&Date.parse(data?._meta?.generatedAt)>=Date.parse(spec.notBefore),measured:now.toISOString(),required:`>= ${spec.notBefore} and evidence after that time`});
  for(const g of spec.gates){
    const limit=g.localLimit?get(data,g.limit):typeof g.limit==='string'?get(targets,g.limit):g.limit;
    const rowsToCheck=g.matrix??[null];
    for(const key of rowsToCheck){
      const value=g.kind==='files'?filesMatching(base,g.path).length:get(key?data?.fixtures?.[key]:data,g.path);
      rows.push({id:`${id}.${g.id}${key?`[${key}]`:''}`,pass:!!data&&numeric(value,g.op,limit),measured:value??'missing',required:`${g.op} ${limit===null||limit===undefined?'UNMEASURED TARGET':JSON.stringify(limit)}`});
    }
  }
  if(!skipFreshness){
    const revision=sourceRevision(repo,spec.sources),files=spec.gates.filter(g=>g.kind==='files'&&!g.path.startsWith('../')).flatMap(g=>filesMatching(base,g.path));
    const stale=files.filter(p=>revision?.date&&statSync(p).mtimeMs+1000<Date.parse(revision.date));
    rows.push({id:`${id}.artifact-freshness`,pass:!!data&&stale.length===0,measured:data?stale.length:'missing',required:'eq 0 artifacts older than last source commit'});
  }
  return rows;
}
export function evidenceMeta(repo=root){return {generatedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim()};}
export const format = row => `${row.pass?'PASS':'FAIL'} ${row.id}: measured=${typeof row.measured==='object'?JSON.stringify(row.measured):row.measured}; required=${row.required}`;
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  const ids=process.argv.slice(2).filter(x=>!x.startsWith('--'));
  const rows=(ids.length?ids:Object.keys(cards)).flatMap(id=>checkCard(id));
  for(const row of rows)console.log(format(row));
  console.log(`TOTAL ${rows.filter(r=>r.pass).length} PASS / ${rows.filter(r=>!r.pass).length} FAIL / ${rows.length} gates`);
  process.exitCode=rows.every(r=>r.pass)?0:1;
}
