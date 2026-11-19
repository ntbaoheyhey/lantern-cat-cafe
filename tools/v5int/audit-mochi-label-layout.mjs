/** Replay the pinned solver and independently recount Mochi-only layout bounds. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';

const [claimPath, output] = process.argv.slice(2);
const hash = b => createHash('sha256').update(b).digest('hex');
const claimBytes = await readFile(claimPath), claim = JSON.parse(claimBytes);
const rawBytes = await readFile(claim.input.path), raw = JSON.parse(rawBytes);
assert.equal(hash(rawBytes), claim.input.sha256);
assert.deepEqual(raw.fixture.mediaCats, ['mochi']);
for (const key of ['sourceCommit', 'indexSha256', 'url']) assert.equal(raw[key], claim[key]);
const source = execFileSync('git', ['show', `${raw.sourceCommit}:${claim.source.path}`], {encoding:'utf8'});
assert.equal(hash(source), claim.source.sha256);
const {layoutWorldLabels} = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const epsilon = 1 / 64;
assert.deepEqual(claim.designBounds, {nativeBodyPadding:6, fallback:12, gap:6, epsilon});
const rectError = (a,b) => Math.max(...['x','y','width','height'].map(k => Math.abs(a[k]-b[k])));
const intersects = (a,b) => Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x) && Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y);
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-10, `${a} != ${b}`);
const cases = [...raw.rows.map((r,i) => ({key:`row-${i}`, s:r.snapshot, placement:r.placement})), ...raw.cases.map(c => ({key:c.key,s:c.before,placement:c.placement}))];
assert.equal(cases.length,176);
const rows=[];
for (const {key,s,placement} of cases) {
  const expected=claim.results.find(r=>r.key===key); assert.ok(expected);
  const actors=JSON.parse(s.battle).actors;
  const extents=new Map(s.labels.map(l=>{
    const node=s.labelPaintState.find(n=>n.actor===l.id&&n.class==='b3-world');
    const matrix=node.transform.slice(7,-1).split(',').map(Number);
    assert.deepEqual(matrix.slice(0,4),[1,0,0,1]);
    return [l.id,{x:l.rect.x-node.rect.x+matrix[4],y:l.rect.y-node.rect.y+matrix[5],width:l.rect.width,height:l.rect.height}];
  }));
  const world=r=>({...r,x:r.x+s.host.x,y:r.y+s.host.y});
  const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...world(a.face),id:a.id}));
  const proposals=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
    const e=extents.get(a.id),t=a.labelTarget;
    const row={id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y}};
    if(t) row.anchorPlacement={rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:world(t.avoid)};
    return row;
  });
  const replay=layoutWorldLabels(proposals,1280,720,s.hud.map(h=>h.rect),faces);
  const replayError=Math.max(...replay.map(l=>rectError(l.rect,s.labels.find(x=>x.id===l.id).rect)));
  near(replayError,expected.replayError); assert.ok(replayError<=epsilon);
  const owner=s.anchors.find(a=>a.id==='mochi'),actual=s.labels.find(l=>l.id==='mochi').rect,e=extents.get('mochi');
  const preferred={...actual,x:owner.labelTarget.x+s.host.x+e.x,y:Math.max(owner.footY,owner.body.y+owner.body.height)+s.host.y+6};
  const obstacles=[...s.hud.map(h=>({...h.rect,id:'hud'})),...faces,...s.labels.filter(l=>l.id!=='mochi').map(l=>({...l.rect,id:l.id+':label'})),{...world(owner.body),id:'mochi:body'}];
  for(const a of s.anchors.filter(a=>a.visible&&a.body&&a.id!=='mochi')) {
    const r=world(a.body);obstacles.push({x:r.x-6,y:r.y-6,width:r.width+12,height:r.height+12,id:a.id});
  }
  const hits=obstacles.filter(o=>intersects(actual,o)).map(o=>o.id);
  assert.deepEqual(hits,expected.intersections);
  const drift=Math.hypot(preferred.x-actual.x,preferred.y-actual.y),gap=actual.y-(preferred.y-6),axis=owner.labelTarget.x+s.host.x;
  near(drift,expected.drift);near(gap,expected.gap);near(axis,expected.axis);near(rectError(preferred,expected.preferred),0);
  const associated=drift<=12+epsilon&&actual.y>=preferred.y-epsilon&&actual.y<=preferred.y+12+epsilon&&actual.x<=axis&&actual.x+actual.width>=axis;
  assert.equal(associated,expected.associationDesignBound);
  rows.push({key,placement,replayError,hits,drift,gap,associated});
}
const paired=[];
for(const c of raw.cases.filter(c=>c.placement==='candidate')) {
  const baseline=raw.cases.find(b=>b.placement==='baseline'&&['method','mode','cat','skill','ms'].every(k=>b[k]===c[k]));assert.ok(baseline);
  const a=baseline.before,b=c.before;
  assert.equal(a.battle,b.battle);assert.deepEqual(a.plan,b.plan);
  const bodies=s=>s.anchors.map(({id,body,face,footY})=>({id,body,face,footY}));
  assert.deepEqual(bodies(a),bodies(b));
  const otherLabelsError=Math.max(...a.labels.filter(l=>l.id!=='mochi').map(l=>rectError(l.rect,b.labels.find(v=>v.id===l.id).rect)));
  const expected=claim.paired.find(p=>p.key===c.key);near(otherLabelsError,expected.otherLabelsError);assert.equal(otherLabelsError,0);
  paired.push(c.key);
}
const candidates=rows.filter(r=>r.placement==='candidate');
const summary={samples:rows.length,candidateSamples:candidates.length,maxReplayError:Math.max(...rows.map(r=>r.replayError)),candidateGeometryFailures:candidates.filter(r=>r.hits.length).length,candidateAssociationFailures:candidates.filter(r=>!r.associated).length,pairedFailures:0};
assert.deepEqual(summary,claim.summary);
const receipt={utc:new Date().toISOString(),claim:{path:claimPath,sha256:hash(claimBytes)},raw:claim.input,source:claim.source,sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,auditor:{path:import.meta.filename,sha256:hash(await readFile(import.meta.filename))},summary,pairedComparisons:paired.length,candidateMaxDrift:Math.max(...candidates.map(r=>r.drift)),candidateMinGap:Math.min(...candidates.map(r=>r.gap)),candidateCollisionOwners:[...new Set(candidates.flatMap(r=>r.hits))],numericAudit:'PASS',proposalDisposition:'REJECT',productionAcceptance:false,imagesViewed:0,limits:['Bounds and replay audit only; shadow paint and perceptual label ownership remain separate.','Fresh development population includes existing native Clover; do not pool with R7 dual-media.','No source proposal applied; strict pixel threshold0 and2pxguard retained.']};
await writeFile(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({summary,maxDrift:receipt.candidateMaxDrift,minGap:receipt.candidateMinGap,owners:receipt.candidateCollisionOwners}));
